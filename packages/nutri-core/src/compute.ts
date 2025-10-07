import dayjs from 'dayjs';
import { NutrientKey, LifeStage, FoodDB, Goals, Schema, ReportJSON, FoodLogEntry } from './types';
import { convertToBaseUnit } from './units';

// Compute weekly nutrition report
export function computeWeekly({
  logPath,
  stage,
  foodDB,
  goals,
  schema,
}: {
  logPath: string;
  stage: LifeStage;
  foodDB: FoodDB;
  goals: Goals;
  schema: Schema;
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
    throw new Error(`CSV parsing errors: ${parsed.errors.map(e => e.message).join(', ')}`);
  }

  const logEntries: FoodLogEntry[] = parsed.data.map((row: any) => ({
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

    // Calculate nutrient intake for each nutrient
    for (const nutrient of Object.keys(schema.nutrients) as NutrientKey[]) {
      const nutrientInfo = schema.nutrients[nutrient];
      const fieldName = `${nutrient}_${nutrientInfo.unit}` as keyof typeof foodItem;

      // Convert serving size to actual intake based on servings
      const servingMultiplier = servings;
      const nutrientValue = (foodItem[fieldName] as number) * servingMultiplier;

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

  // Calculate report
  const nutrients: ReportJSON['nutrients'] = {} as ReportJSON['nutrients'];

  for (const nutrient of Object.keys(schema.nutrients) as NutrientKey[]) {
    const nutrientInfo = schema.nutrients[nutrient];
    const weeklyTotal = weeklyTotals[nutrient] || 0;
    const weeklyGoal = convertToBaseUnit(stageGoals[nutrient], nutrientInfo.unit);

    // Calculate percentage (capped at 999%)
    const percentTarget = Math.min(Math.round((weeklyTotal / weeklyGoal) * 100), 999);
    const gapSurplus = weeklyTotal - weeklyGoal;

    nutrients[nutrient] = {
      weekly_total: weeklyTotal,
      weekly_goal: weeklyGoal,
      percent_target: percentTarget,
      gap_surplus: gapSurplus,
    };
  }

  // Calculate summary
  const deficientNutrients: NutrientKey[] = [];
  const surplusNutrients: NutrientKey[] = [];

  for (const nutrient of Object.keys(nutrients) as NutrientKey[]) {
    const { gap_surplus } = nutrients[nutrient];
    if (gap_surplus < 0) {
      deficientNutrients.push(nutrient);
    } else if (gap_surplus > 0) {
      surplusNutrients.push(nutrient);
    }
  }

  const totalGapSurplus = Object.values(nutrients)
    .reduce((sum, { gap_surplus }) => sum + Math.abs(gap_surplus), 0);

  return {
    stage,
    week_start: weekStart,
    week_end: weekEnd,
    nutrients,
    summary: {
      deficient_nutrients: deficientNutrients,
      surplus_nutrients: surplusNutrients,
      total_gap_surplus: totalGapSurplus,
    },
  };
}

// Helper function to get deficient nutrients
export function getDeficientNutrients(report: ReportJSON, threshold = 0.9): NutrientKey[] {
  return Object.entries(report.nutrients)
    .filter(([_, data]) => data.percent_target < threshold * 100)
    .map(([nutrient, _]) => nutrient as NutrientKey);
}
