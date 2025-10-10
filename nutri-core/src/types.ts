
export type LifeStage = 'pregnancy_trimester2' | 'pregnancy_trimester1' | 'pregnancy_trimester3' | 'lactation' | 'preconception' | 'interpregnancy';

export interface NutrientInfo {
  unit: 'mg' | 'µg';
  aliases?: string[];
}

export interface Schema {
  nutrients: Record<NutrientKey, NutrientInfo>;
  serving_fields: string[];
  food_fields_required: string[];
}

export interface Goals {
  [lifeStage: string]: Record<NutrientKey, number>;
}

// Nutrient key list and derived types
export const NUTRIENT_KEYS = [
  'DHA',
  'Selenium',
  'Vitamin_A_RAE',
  'Zinc',
  'Iron',
  'Iodine',
  'Choline',
  'Folate_DFE'
] as const;

export type NutrientKey = typeof NUTRIENT_KEYS[number];

// Helper to build typed records
export function makeRecord<T>(init: (k: NutrientKey) => T): Record<NutrientKey, T> {
  return Object.fromEntries(NUTRIENT_KEYS.map(k => [k, init(k)])) as Record<NutrientKey, T>;
}

export interface FoodItem {
  food_name: string;
  brand: string;
  category: string;
  fdc_id: number;
  serving_name: string;
  serving_size_g: number;
  DHA_mg: number;
  Selenium_µg: number;
  Vitamin_A_RAE_µg: number;
  Zinc_mg: number;
  Iron_mg: number;
  Iodine_µg: number;
  Choline_mg: number;
  Folate_DFE_µg: number;
}

export interface FoodLogEntry {
  date: string;
  food_name: string;
  servings: number;
}

export interface FoodDB {
  [foodName: string]: FoodItem;
}

export type NutrientIntake = Record<NutrientKey, number>;

export type WeeklyReport = Record<NutrientKey, {
  weekly_total: number;
  weekly_goal: number;
  percent_target: number;
  gap_surplus: number;
}>;

export interface Limits {
  units_base: Record<string, string>;
  UL: Record<string, Record<NutrientKey, number | null>>;
  plausibility_per_100g: Record<NutrientKey, [number, number]>;
  confidence_weights: Record<string, number>;
}

export type ULStatus = 'none' | 'warn' | 'error';

export type ULRow = {
  total: number;
  ul: number | null;
  overBy: number | null;
  severity: ULStatus;
};

export type ULAlert = ULRow;

export type ULReport = Record<NutrientKey, ULAlert>;

export type NutrientProvenanceSource = 'FDC' | 'NUTRITIONIX' | 'OFF' | 'derived' | 'none';

export interface NutrientProvenance {
  source: NutrientProvenanceSource;
  confidence: number; // 0-1
  flags: string[]; // e.g., ['plausibility_clamped', 'conflict_detected']
}

export interface ReportJSON {
  stage: LifeStage;
  week_start: string;
  week_end: string;
  nutrients: WeeklyReport;
  provenance: Record<NutrientKey, NutrientProvenance>;
  confidence: Record<NutrientKey, number>; // 0..1
  ulAlerts: Record<NutrientKey, ULAlert>;
  flags: string[]; // aggregated plausibility/merge flags
}
