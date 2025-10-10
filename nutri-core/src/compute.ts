import dayjs from 'dayjs';
import { NutrientKey, LifeStage, FoodDB, Goals, Schema, ReportJSON, FoodLogEntry, Limits, ULAlert, NutrientProvenance, NUTRIENT_KEYS, makeRecord } from './types';
import { convertToBaseUnit } from './units';
import { applyPlausibilityGuards, evaluateULs, calculateConfidence, createProvenance } from './limits';

// Compute weekly nutrition report
export function computeWeekly({
  logPath,
  stage,
  foodDB,
  goals,
  schema,
  limits,
}: {
  logPath: string;
  stage: LifeStage;
  foodDB: FoodDB;
  goals: Goals;
  schema: Schema;
  limits?: Limits;
}): ReportJSON {
  // Load and validate food log
  const fs = require('fs');
  const Papa = require('papaparse');

  const csvContent = fs.readFileSync(logPath, 'utf8');
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(`CSV parsing errors: ${parsed.errors.map((e: { message: string }) => e.message).join(', ')}`);
  }

  const logEntries: FoodLogEntry[] = parsed.data.map((row: { date: string; food_name: string; servings: string }) => ({
    date: row.date,
    food_name: row.food_name,
    servings: Number(row.servings),
  }));

  // Get the week range from the first log entry
  if (logEntries.length === 0) {
    throw new Error('No log entries found');
  }

  const firstDate = dayjs(logEntries[0].date);
  const weekStart = firstDate.startOf('week').format('YYYY-MM-DD');
  const weekEnd = firstDate.endOf('week').format('YYYY-MM-DD');

  // Calculate daily intake for each day in the week
  const dailyIntake: Record<string, Record<NutrientKey, number>> = {};

  for (const entry of logEntries) {
    const date = entry.date;
    const foodItem = foodDB[entry.food_name];

    if (!foodItem) {
      throw new Error(`Food item '${entry.food_name}' not found in database`);
    }

    if (!dailyIntake[date]) {
      dailyIntake[date] = {} as Record<NutrientKey, number>;
    }

    const servings = entry.servings;

    // Apply plausibility guards if limits are provided
    let guardedFood = foodItem;
    let plausibilityFlags: string[] = [];
    if (limits) {
      const guardResult = applyPlausibilityGuards(foodItem, limits);
      guardedFood = guardResult.food;
      plausibilityFlags = guardResult.flags;
    }

    // Calculate nutrient intake for each nutrient
    for (const nutrient of Object.keys(schema.nutrients) as NutrientKey[]) {
      const nutrientInfo = schema.nutrients[nutrient];
      const fieldName = `${nutrient}_${nutrientInfo.unit}` as keyof typeof guardedFood;

      // Convert serving size to actual intake based on servings
      const servingMultiplier = servings;
      const nutrientValue = (guardedFood[fieldName] as number) * servingMultiplier;

      // Convert to base unit (mg) for consistent calculations
      const baseUnitValue = convertToBaseUnit(nutrientValue, nutrientInfo.unit);

      dailyIntake[date][nutrient] = (dailyIntake[date][nutrient] || 0) + baseUnitValue;
    }
  }

  // Aggregate to weekly totals (in base units - mg)
  const weeklyTotals: Record<NutrientKey, number> = {} as Record<NutrientKey, number>;

  for (const day of Object.keys(dailyIntake)) {
    for (const nutrient of Object.keys(dailyIntake[day]) as NutrientKey[]) {
      weeklyTotals[nutrient] = (weeklyTotals[nutrient] || 0) + dailyIntake[day][nutrient];
    }
  }

  // Get goals for the life stage (convert to base units)
  const stageGoals = goals[stage];
  if (!stageGoals) {
    throw new Error(`Goals not found for life stage '${stage}'`);
  }

  // Calculate report with provenance and confidence
  const nutrients: ReportJSON['nutrients'] = {} as ReportJSON['nutrients'];
  const provenance: Record<NutrientKey, NutrientProvenance> = {} as Record<NutrientKey, NutrientProvenance>;
  const confidence: Record<NutrientKey, number> = {} as Record<NutrientKey, number>;

  for (const nutrient of Object.keys(schema.nutrients) as NutrientKey[]) {
    const nutrientInfo = schema.nutrients[nutrient];
    const weeklyTotal = weeklyTotals[nutrient] || 0;
    const weeklyGoal = convertToBaseUnit(stageGoals[nutrient], nutrientInfo.unit);

    // Calculate percentage (capped at 999%)
    const percentTarget = Math.min(Math.round((weeklyTotal / weeklyGoal) * 100), 999);
    const gapSurplus = weeklyTotal - weeklyGoal;

    // Calculate provenance and confidence from food sources
    // For now, use a simplified approach - in a real implementation,
    // this would aggregate provenance from all foods that contributed to this nutrient
    const nutrientConfidence = calculateConfidence('derived', weeklyTotal, limits || { confidence_weights: {} } as Limits);
    const nutrientProvenance = createProvenance('derived', nutrientConfidence);

    nutrients[nutrient] = {
      weekly_total: weeklyTotal,
      weekly_goal: weeklyGoal,
      percent_target: percentTarget,
      gap_surplus: gapSurplus,
    };

    provenance[nutrient] = nutrientProvenance;
    confidence[nutrient] = nutrientConfidence;
  }

  // Calculate summary
  const deficientNutrients: NutrientKey[] = [];
  const surplusNutrients: NutrientKey[] = [];
  const ulWarnings: NutrientKey[] = [];
  const ulExceeded: NutrientKey[] = [];

  for (const nutrient of Object.keys(nutrients) as NutrientKey[]) {
    const { gap_surplus } = nutrients[nutrient];
    if (gap_surplus < 0) {
      deficientNutrients.push(nutrient);
    } else if (gap_surplus > 0) {
      surplusNutrients.push(nutrient);
    }
  }

  // Calculate UL alerts if limits are provided
  let ulAlerts: Record<NutrientKey, ULAlert> = {} as any;
  if (limits) {
    ulAlerts = evaluateULs({ nutrients }, stage, limits);

    // Extract warnings and exceeded nutrients
    for (const [nutrient, alert] of Object.entries(ulAlerts)) {
      if (alert.severity === 'warn') {
        ulWarnings.push(nutrient as NutrientKey);
      } else if (alert.severity === 'error') {
        ulExceeded.push(nutrient as NutrientKey);
      }
    }
  }

  // For now, no flags from food processing
  const allFlags: string[] = [];

  const totalGapSurplus = Object.values(nutrients)
    .reduce((sum, { gap_surplus }) => sum + Math.abs(gap_surplus), 0);

  return {
    stage,
    week_start: weekStart,
    week_end: weekEnd,
    nutrients,
    provenance,
    confidence,
    ulAlerts,
    flags: [...new Set(allFlags)], // Unique flags from all foods
  };
}

// Helper function to get deficient nutrients
export function getDeficientNutrients(report: ReportJSON, threshold = 0.9): NutrientKey[] {
  return Object.entries(report.nutrients)
    .filter(([_, data]) => data.percent_target < threshold * 100)
    .map(([nutrient, _]) => nutrient as NutrientKey);
}

/**
 * Compute a nutrition report from a barcode lookup
 * This is a convenience function that combines importer lookup with core computation
 */
export async function computeFromBarcode({
  barcode,
  stage,
  goals,
  schema,
  importers,
}: {
  barcode: string;
  stage: LifeStage;
  goals: Goals;
  schema: Schema;
  importers: {
    lookupByBarcode: (barcode: string) => Promise<any>;
  };
}): Promise<ReportJSON> {
  // Look up the food by barcode
  const normalizedFood = await importers.lookupByBarcode(barcode);

  if (!normalizedFood) {
    throw new Error(`Food not found for barcode: ${barcode}`);
  }

  // Convert to FoodItem format
  const { normalizeFromImporter } = await import('./normalize');
  const foodItem = normalizeFromImporter(normalizedFood, schema);

  // Create a temporary food database with just this item
  const foodDB = {
    [foodItem.food_name]: foodItem,
  };

  // Create a temporary log with 1 serving today
  const today = new Date().toISOString().split('T')[0];
  const logEntries = [{
    date: today,
    food_name: foodItem.food_name,
    servings: 1,
  }];

  // Create a temporary CSV content for the log
  const logCsv = 'date,food_name,servings\n' + logEntries.map(entry =>
    `${entry.date},${entry.food_name},${entry.servings}`
  ).join('\n');

  // Write to a temporary file
  const fs = require('fs');
  const tmpLogPath = `/tmp/barcode_log_${Date.now()}.csv`;
  fs.writeFileSync(tmpLogPath, logCsv);

  try {
    // Use the existing computeWeekly function
    return computeWeekly({
      logPath: tmpLogPath,
      stage,
      foodDB,
      goals,
      schema,
    });
  } finally {
    // Clean up temporary file
    if (fs.existsSync(tmpLogPath)) {
      fs.unlinkSync(tmpLogPath);
    }
  }
}
