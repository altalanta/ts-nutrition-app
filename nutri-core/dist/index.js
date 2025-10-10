"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/normalize.ts
var normalize_exports = {};
__export(normalize_exports, {
  foodItemToNormalized: () => foodItemToNormalized,
  normalizeFromImporter: () => normalizeFromImporter
});
function normalizeFromImporter(food, schema) {
  const nutrients = {};
  for (const [nutrientKey, value] of Object.entries(food.nutrients)) {
    const nutrientInfo = schema.nutrients[nutrientKey];
    if (nutrientInfo) {
      const unitValue = value;
      nutrients[`${nutrientKey}_${nutrientInfo.unit}`] = unitValue;
    }
  }
  return {
    food_name: food.food_name,
    brand: food.brand || "",
    category: "Imported",
    // Default category for imported foods
    fdc_id: parseInt(food.source_id) || 0,
    // Try to parse as number, fallback to 0
    serving_name: food.serving_name || "1 serving",
    serving_size_g: food.serving_size_g || 100,
    ...nutrients
  };
}
function foodItemToNormalized(foodItem, schema) {
  const nutrients = {};
  for (const [nutrientKey, nutrientInfo] of Object.entries(schema.nutrients)) {
    const fieldName = `${nutrientKey}_${nutrientInfo.unit}`;
    const value = foodItem[fieldName] || 0;
    nutrients[nutrientKey] = value;
  }
  return {
    source: "FDC",
    // Default, could be enhanced to track original source
    source_id: foodItem.fdc_id.toString(),
    food_name: foodItem.food_name,
    brand: foodItem.brand,
    serving_name: foodItem.serving_name,
    serving_size_g: foodItem.serving_size_g,
    barcode: void 0,
    // Not stored in FoodItem
    nutrients
  };
}
var init_normalize = __esm({
  "src/normalize.ts"() {
    "use strict";
  }
});

// src/index.ts
var src_exports = {};
__export(src_exports, {
  FoodItemSchema: () => FoodItemSchema,
  FoodLogEntrySchema: () => FoodLogEntrySchema,
  GoalsSchema: () => GoalsSchema,
  NUTRIENT_KEYS: () => NUTRIENT_KEYS,
  NutrientInfoSchema: () => NutrientInfoSchema,
  SchemaSchema: () => SchemaSchema,
  applyPlausibilityGuards: () => applyPlausibilityGuards,
  calculateConfidence: () => calculateConfidence,
  computeFromBarcode: () => computeFromBarcode,
  computeWeekly: () => computeWeekly,
  convertFromBaseUnit: () => convertFromBaseUnit,
  convertToBaseUnit: () => convertToBaseUnit,
  createProvenance: () => createProvenance,
  evaluateULs: () => evaluateULs,
  foodItemToNormalized: () => foodItemToNormalized,
  getDeficientNutrients: () => getDeficientNutrients,
  limitsSchema: () => limitsSchema,
  loadFoodLog: () => loadFoodLog,
  loadFoods: () => loadFoods,
  loadGoals: () => loadGoals,
  loadLimits: () => loadLimits,
  loadSchema: () => loadSchema,
  makeRecord: () => makeRecord,
  normalizeFromImporter: () => normalizeFromImporter,
  toMicrogram: () => toMicrogram,
  toMilligram: () => toMilligram
});
module.exports = __toCommonJS(src_exports);

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
var import_zod = require("zod");
var NutrientInfoSchema = import_zod.z.object({
  unit: import_zod.z.enum(["mg", "\xB5g"]),
  aliases: import_zod.z.array(import_zod.z.string()).optional()
});
var SchemaSchema = import_zod.z.object({
  nutrients: import_zod.z.record(NutrientInfoSchema),
  serving_fields: import_zod.z.array(import_zod.z.string()),
  food_fields_required: import_zod.z.array(import_zod.z.string())
});
var GoalsSchema = import_zod.z.record(import_zod.z.record(import_zod.z.number().positive()));
var FoodItemSchema = import_zod.z.object({
  food_name: import_zod.z.string(),
  brand: import_zod.z.string(),
  category: import_zod.z.string(),
  fdc_id: import_zod.z.number(),
  serving_name: import_zod.z.string(),
  serving_size_g: import_zod.z.number().positive(),
  DHA_mg: import_zod.z.number().default(0),
  Selenium_\u00B5g: import_zod.z.number().default(0),
  Vitamin_A_RAE_\u00B5g: import_zod.z.number().default(0),
  Zinc_mg: import_zod.z.number().default(0),
  Iron_mg: import_zod.z.number().default(0),
  Iodine_\u00B5g: import_zod.z.number().default(0),
  Choline_mg: import_zod.z.number().default(0),
  Folate_DFE_\u00B5g: import_zod.z.number().default(0)
});
var FoodLogEntrySchema = import_zod.z.object({
  date: import_zod.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  food_name: import_zod.z.string(),
  servings: import_zod.z.number().positive()
});
function loadSchema(schemaPath) {
  const fs = require("fs");
  const yaml = require("yaml");
  const yamlContent = fs.readFileSync(schemaPath, "utf8");
  const parsed = yaml.parse(yamlContent);
  return SchemaSchema.parse(parsed);
}
function loadGoals(goalsPath) {
  const fs = require("fs");
  const yaml = require("yaml");
  const yamlContent = fs.readFileSync(goalsPath, "utf8");
  const parsed = yaml.parse(yamlContent);
  return GoalsSchema.parse(parsed);
}
function loadFoods(csvPath, schema) {
  const fs = require("fs");
  const Papa = require("papaparse");
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
  const fs = require("fs");
  const Papa = require("papaparse");
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
var import_dayjs = __toESM(require("dayjs"));

// src/limits.ts
var import_zod2 = require("zod");
var rangeStr = import_zod2.z.string().regex(/^\d+(\.\d+)?\.\.\d+(\.\d+)?$/);
var rangeToTuple = (s) => {
  const [lo, hi] = s.split("..").map(Number);
  return [lo, hi];
};
var limitsSchema = import_zod2.z.object({
  units_base: import_zod2.z.record(import_zod2.z.string()),
  UL: import_zod2.z.object({
    pregnancy: import_zod2.z.record(import_zod2.z.number().nullable()),
    lactation: import_zod2.z.record(import_zod2.z.number().nullable())
  }),
  plausibility_per_100g: import_zod2.z.record(rangeStr.transform(rangeToTuple)),
  confidence_weights: import_zod2.z.object({
    FDC: import_zod2.z.number(),
    NUTRITIONIX: import_zod2.z.number(),
    OFF: import_zod2.z.number()
  })
});
function loadLimits(limitsPath) {
  const fs = require("fs");
  const yaml = require("yaml");
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
  const fs = require("fs");
  const Papa = require("papaparse");
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
  const firstDate = (0, import_dayjs.default)(logEntries[0].date);
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
  const { normalizeFromImporter: normalizeFromImporter2 } = await Promise.resolve().then(() => (init_normalize(), normalize_exports));
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
  const fs = require("fs");
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

// src/index.ts
init_normalize();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
