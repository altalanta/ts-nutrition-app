import {
  __require,
  foodItemToNormalized,
  normalizeFromImporter
} from "./chunk-NOSSD5S7.mjs";

// src/types.ts
var NUTRIENT_KEYS = [
  "DHA",
  "Selenium",
  "Vitamin_A_RAE",
  "Zinc",
  "Iron",
  "Iodine",
  "Choline",
  "Folate_DFE"
];
function makeRecord(init) {
  return Object.fromEntries(NUTRIENT_KEYS.map((k) => [k, init(k)]));
}

// src/units.ts
function toMilligram(micrograms) {
  return micrograms / 1e3;
}
function toMicrogram(milligrams) {
  return milligrams * 1e3;
}
function convertToBaseUnit(value, fromUnit) {
  if (fromUnit === "mg") {
    return value;
  }
  return value / 1e3;
}
function convertFromBaseUnit(value, toUnit) {
  if (toUnit === "mg") {
    return value;
  }
  return value * 1e3;
}

// src/schema.ts
import { z } from "zod";
var NutrientInfoSchema = z.object({
  unit: z.enum(["mg", "\xB5g"]),
  aliases: z.array(z.string()).optional()
});
var SchemaSchema = z.object({
  nutrients: z.record(NutrientInfoSchema),
  serving_fields: z.array(z.string()),
  food_fields_required: z.array(z.string())
});
var GoalsSchema = z.record(z.record(z.number().positive()));
var FoodItemSchema = z.object({
  food_name: z.string(),
  brand: z.string(),
  category: z.string(),
  fdc_id: z.number(),
  serving_name: z.string(),
  serving_size_g: z.number().positive(),
  DHA_mg: z.number().default(0),
  Selenium_\u00B5g: z.number().default(0),
  Vitamin_A_RAE_\u00B5g: z.number().default(0),
  Zinc_mg: z.number().default(0),
  Iron_mg: z.number().default(0),
  Iodine_\u00B5g: z.number().default(0),
  Choline_mg: z.number().default(0),
  Folate_DFE_\u00B5g: z.number().default(0)
});
var FoodLogEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  food_name: z.string(),
  servings: z.number().positive()
});
function loadSchema(schemaPath) {
  const fs = __require("fs");
  const yaml = __require("yaml");
  const yamlContent = fs.readFileSync(schemaPath, "utf8");
  const parsed = yaml.parse(yamlContent);
  return SchemaSchema.parse(parsed);
}
function loadGoals(goalsPath) {
  const fs = __require("fs");
  const yaml = __require("yaml");
  const yamlContent = fs.readFileSync(goalsPath, "utf8");
  const parsed = yaml.parse(yamlContent);
  return GoalsSchema.parse(parsed);
}
function loadFoods(csvPath, schema) {
  const fs = __require("fs");
  const Papa = __require("papaparse");
  const csvContent = fs.readFileSync(csvPath, "utf8");
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => {
      return header.replace(/_(mg|µg)$/, "");
    }
  });
  if (parsed.errors.length > 0) {
    throw new Error(`CSV parsing errors: ${parsed.errors.map((e) => e.message).join(", ")}`);
  }
  const foodDB = {};
  for (const row of parsed.data) {
    for (const field of schema.food_fields_required) {
      if (!row[field] || row[field] === "") {
        throw new Error(`Missing required field '${field}' in food item`);
      }
    }
    const foodItem = FoodItemSchema.parse({
      ...row,
      fdc_id: Number(row.fdc_id),
      serving_size_g: Number(row.serving_size_g),
      DHA_mg: Number(row.DHA) || 0,
      Selenium_\u00B5g: Number(row.Selenium) || 0,
      Vitamin_A_RAE_\u00B5g: Number(row.Vitamin_A_RAE) || 0,
      Zinc_mg: Number(row.Zinc) || 0,
      Iron_mg: Number(row.Iron) || 0,
      Iodine_\u00B5g: Number(row.Iodine) || 0,
      Choline_mg: Number(row.Choline) || 0,
      Folate_DFE_\u00B5g: Number(row.Folate_DFE) || 0
    });
    foodDB[foodItem.food_name] = foodItem;
  }
  return foodDB;
}
function loadFoodLog(csvPath) {
  const fs = __require("fs");
  const Papa = __require("papaparse");
  const csvContent = fs.readFileSync(csvPath, "utf8");
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true
  });
  if (parsed.errors.length > 0) {
    throw new Error(`CSV parsing errors: ${parsed.errors.map((e) => e.message).join(", ")}`);
  }
  return parsed.data.map((row) => FoodLogEntrySchema.parse({
    date: row.date,
    food_name: row.food_name,
    servings: Number(row.servings)
  }));
}

// src/compute.ts
import dayjs from "dayjs";

// src/limits.ts
import { z as z2 } from "zod";
var rangeStr = z2.string().regex(/^\d+(\.\d+)?\.\.\d+(\.\d+)?$/);
var rangeToTuple = (s) => {
  const [lo, hi] = s.split("..").map(Number);
  return [lo, hi];
};
var limitsSchema = z2.object({
  units_base: z2.record(z2.string()),
  UL: z2.object({
    pregnancy: z2.record(z2.number().nullable()),
    lactation: z2.record(z2.number().nullable())
  }),
  plausibility_per_100g: z2.record(rangeStr.transform(rangeToTuple)),
  confidence_weights: z2.object({
    FDC: z2.number(),
    NUTRITIONIX: z2.number(),
    OFF: z2.number()
  })
});
function loadLimits(limitsPath) {
  const fs = __require("fs");
  const yaml = __require("yaml");
  const yamlContent = fs.readFileSync(limitsPath, "utf8");
  const parsed = yaml.parse(yamlContent);
  const validated = limitsSchema.parse(parsed);
  const plausibility = makeRecord((k) => validated.plausibility_per_100g[k] ?? [0, Infinity]);
  return {
    units_base: validated.units_base,
    UL: {
      pregnancy: makeRecord((k) => validated.UL.pregnancy[k] ?? null),
      lactation: makeRecord((k) => validated.UL.lactation[k] ?? null)
    },
    plausibility_per_100g: plausibility,
    confidence_weights: validated.confidence_weights
  };
}
function applyPlausibilityGuards(food, limits) {
  const flags = [];
  const guardedFood = { ...food };
  for (const [nutrientKey, [min, max]] of Object.entries(limits.plausibility_per_100g)) {
    const fieldName = `${nutrientKey}_${limits.units_base["\xB5g"] === "microgram" && nutrientKey.includes("Vitamin") ? "\xB5g" : "mg"}`;
    const value = guardedFood[fieldName];
    if (value !== void 0 && value !== null && guardedFood.serving_size_g > 0) {
      const per100g = value * 100 / guardedFood.serving_size_g;
      if (per100g > max) {
        const clampedValue = max * guardedFood.serving_size_g / 100;
        guardedFood[fieldName] = clampedValue;
        flags.push(`plausibility_clamped:${nutrientKey}:${per100g.toFixed(1)}>${max}`);
      } else if (per100g < min) {
        flags.push(`plausibility_low:${nutrientKey}:${per100g.toFixed(1)}<${min}`);
      }
    }
  }
  return { food: guardedFood, flags };
}
function evaluateULs(report, stage, limits) {
  const ulReport = makeRecord((k) => ({
    total: 0,
    ul: null,
    overBy: null,
    severity: "none"
  }));
  for (const nutrient of NUTRIENT_KEYS) {
    const ul = limits.UL[stage]?.[nutrient];
    const total = report.nutrients[nutrient]?.weekly_total || 0;
    let severity = "none";
    let overBy = null;
    if (ul && total > 0) {
      if (total > ul) {
        severity = "error";
        overBy = total - ul;
      } else if (total >= ul * 0.8) {
        severity = "warn";
        overBy = total - ul;
      }
    }
    ulReport[nutrient] = {
      total,
      ul,
      overBy,
      severity
    };
  }
  return ulReport;
}
function calculateConfidence(source, value, limits) {
  if (value === 0)
    return 0;
  const baseWeight = limits.confidence_weights[source] || 0;
  const completenessFactor = 1;
  return baseWeight * completenessFactor;
}
function createProvenance(source, confidence, flags = []) {
  return {
    source,
    confidence,
    flags
  };
}

// src/compute.ts
function computeWeekly({
  logPath,
  stage,
  foodDB,
  goals,
  schema,
  limits
}) {
  const fs = __require("fs");
  const Papa = __require("papaparse");
  const csvContent = fs.readFileSync(logPath, "utf8");
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true
  });
  if (parsed.errors.length > 0) {
    throw new Error(`CSV parsing errors: ${parsed.errors.map((e) => e.message).join(", ")}`);
  }
  const logEntries = parsed.data.map((row) => ({
    date: row.date,
    food_name: row.food_name,
    servings: Number(row.servings)
  }));
  if (logEntries.length === 0) {
    throw new Error("No log entries found");
  }
  const firstDate = dayjs(logEntries[0].date);
  const weekStart = firstDate.startOf("week").format("YYYY-MM-DD");
  const weekEnd = firstDate.endOf("week").format("YYYY-MM-DD");
  const dailyIntake = {};
  for (const entry of logEntries) {
    const date = entry.date;
    const foodItem = foodDB[entry.food_name];
    if (!foodItem) {
      throw new Error(`Food item '${entry.food_name}' not found in database`);
    }
    if (!dailyIntake[date]) {
      dailyIntake[date] = {};
    }
    const servings = entry.servings;
    let guardedFood = foodItem;
    let plausibilityFlags = [];
    if (limits) {
      const guardResult = applyPlausibilityGuards(foodItem, limits);
      guardedFood = guardResult.food;
      plausibilityFlags = guardResult.flags;
    }
    for (const nutrient of Object.keys(schema.nutrients)) {
      const nutrientInfo = schema.nutrients[nutrient];
      const fieldName = `${nutrient}_${nutrientInfo.unit}`;
      const servingMultiplier = servings;
      const nutrientValue = guardedFood[fieldName] * servingMultiplier;
      const baseUnitValue = convertToBaseUnit(nutrientValue, nutrientInfo.unit);
      dailyIntake[date][nutrient] = (dailyIntake[date][nutrient] || 0) + baseUnitValue;
    }
  }
  const weeklyTotals = {};
  for (const day of Object.keys(dailyIntake)) {
    for (const nutrient of Object.keys(dailyIntake[day])) {
      weeklyTotals[nutrient] = (weeklyTotals[nutrient] || 0) + dailyIntake[day][nutrient];
    }
  }
  const stageGoals = goals[stage];
  if (!stageGoals) {
    throw new Error(`Goals not found for life stage '${stage}'`);
  }
  const nutrients = {};
  const provenance = {};
  const confidence = {};
  for (const nutrient of Object.keys(schema.nutrients)) {
    const nutrientInfo = schema.nutrients[nutrient];
    const weeklyTotal = weeklyTotals[nutrient] || 0;
    const weeklyGoal = convertToBaseUnit(stageGoals[nutrient], nutrientInfo.unit);
    const percentTarget = Math.min(Math.round(weeklyTotal / weeklyGoal * 100), 999);
    const gapSurplus = weeklyTotal - weeklyGoal;
    const nutrientConfidence = calculateConfidence("derived", weeklyTotal, limits || { confidence_weights: {} });
    const nutrientProvenance = createProvenance("derived", nutrientConfidence);
    nutrients[nutrient] = {
      weekly_total: weeklyTotal,
      weekly_goal: weeklyGoal,
      percent_target: percentTarget,
      gap_surplus: gapSurplus
    };
    provenance[nutrient] = nutrientProvenance;
    confidence[nutrient] = nutrientConfidence;
  }
  const deficientNutrients = [];
  const surplusNutrients = [];
  const ulWarnings = [];
  const ulExceeded = [];
  for (const nutrient of Object.keys(nutrients)) {
    const { gap_surplus } = nutrients[nutrient];
    if (gap_surplus < 0) {
      deficientNutrients.push(nutrient);
    } else if (gap_surplus > 0) {
      surplusNutrients.push(nutrient);
    }
  }
  let ulAlerts = {};
  if (limits) {
    ulAlerts = evaluateULs({ nutrients }, stage, limits);
    for (const [nutrient, alert] of Object.entries(ulAlerts)) {
      if (alert.severity === "warn") {
        ulWarnings.push(nutrient);
      } else if (alert.severity === "error") {
        ulExceeded.push(nutrient);
      }
    }
  }
  const allFlags = [];
  const totalGapSurplus = Object.values(nutrients).reduce((sum, { gap_surplus }) => sum + Math.abs(gap_surplus), 0);
  return {
    stage,
    week_start: weekStart,
    week_end: weekEnd,
    nutrients,
    provenance,
    confidence,
    ulAlerts,
    flags: [...new Set(allFlags)]
    // Unique flags from all foods
  };
}
function getDeficientNutrients(report, threshold = 0.9) {
  return Object.entries(report.nutrients).filter(([_, data]) => data.percent_target < threshold * 100).map(([nutrient, _]) => nutrient);
}
async function computeFromBarcode({
  barcode,
  stage,
  goals,
  schema,
  importers
}) {
  const normalizedFood = await importers.lookupByBarcode(barcode);
  if (!normalizedFood) {
    throw new Error(`Food not found for barcode: ${barcode}`);
  }
  const { normalizeFromImporter: normalizeFromImporter2 } = await import("./normalize-O44MYD46.mjs");
  const foodItem = normalizeFromImporter2(normalizedFood, schema);
  const foodDB = {
    [foodItem.food_name]: foodItem
  };
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const logEntries = [{
    date: today,
    food_name: foodItem.food_name,
    servings: 1
  }];
  const logCsv = "date,food_name,servings\n" + logEntries.map(
    (entry) => `${entry.date},${entry.food_name},${entry.servings}`
  ).join("\n");
  const fs = __require("fs");
  const tmpLogPath = `/tmp/barcode_log_${Date.now()}.csv`;
  fs.writeFileSync(tmpLogPath, logCsv);
  try {
    return computeWeekly({
      logPath: tmpLogPath,
      stage,
      foodDB,
      goals,
      schema
    });
  } finally {
    if (fs.existsSync(tmpLogPath)) {
      fs.unlinkSync(tmpLogPath);
    }
  }
}
export {
  FoodItemSchema,
  FoodLogEntrySchema,
  GoalsSchema,
  NUTRIENT_KEYS,
  NutrientInfoSchema,
  SchemaSchema,
  applyPlausibilityGuards,
  calculateConfidence,
  computeFromBarcode,
  computeWeekly,
  convertFromBaseUnit,
  convertToBaseUnit,
  createProvenance,
  evaluateULs,
  foodItemToNormalized,
  getDeficientNutrients,
  limitsSchema,
  loadFoodLog,
  loadFoods,
  loadGoals,
  loadLimits,
  loadSchema,
  makeRecord,
  normalizeFromImporter,
  toMicrogram,
  toMilligram
};
