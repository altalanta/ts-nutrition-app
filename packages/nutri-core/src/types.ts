export type NutrientKey =
  | 'DHA'
  | 'Selenium'
  | 'Vitamin_A_RAE'
  | 'Zinc'
  | 'Iron'
  | 'Iodine'
  | 'Choline'
  | 'Folate_DFE';

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

export interface FoodItem {
  food_name: string;
  brand: string;
  category: string;
  fdc_id: number;
  serving_name: string;
  serving_size_g: number;
  [key: `DHA_mg`]: number;
  [key: `Selenium_µg`]: number;
  [key: `Vitamin_A_RAE_µg`]: number;
  [key: `Zinc_mg`]: number;
  [key: `Iron_mg`]: number;
  [key: `Iodine_µg`]: number;
  [key: `Choline_mg`]: number;
  [key: `Folate_DFE_µg`]: number;
}

export interface FoodLogEntry {
  date: string;
  food_name: string;
  servings: number;
}

export interface FoodDB {
  [foodName: string]: FoodItem;
}

export interface NutrientIntake {
  [nutrient: NutrientKey]: number;
}

export interface WeeklyReport {
  [nutrient: NutrientKey]: {
    weekly_total: number;
    weekly_goal: number;
    percent_target: number;
    gap_surplus: number;
  };
}

export interface Limits {
  units_base: Record<string, string>;
  UL: Record<string, Record<NutrientKey, number | null>>;
  plausibility_per_100g: Record<NutrientKey, [number, number]>;
  confidence_weights: Record<string, number>;
}

export interface ULReport {
  [nutrient: NutrientKey]: {
    total: number;
    ul: number | null;
    overBy: number | null;
    severity: 'none' | 'warning' | 'exceeded';
  };
}

export interface NutrientProvenance {
  source: 'FDC' | 'NUTRITIONIX' | 'OFF' | 'derived' | 'none';
  confidence: number; // 0-1
  flags: string[]; // e.g., ['plausibility_clamped', 'conflict_detected']
}

export interface ReportJSON {
  stage: LifeStage;
  week_start: string;
  week_end: string;
  nutrients: WeeklyReport;
  provenance: Record<NutrientKey, 'FDC'|'NUTRITIONIX'|'OFF'|'derived'|'none'>;
  confidence: Record<NutrientKey, number>; // 0..1
  ulAlerts: Record<NutrientKey, { total: number; UL: number|null; overBy: number; severity: 'none'|'warn'|'error' }>;
  flags: string[]; // aggregated plausibility/merge flags
}
