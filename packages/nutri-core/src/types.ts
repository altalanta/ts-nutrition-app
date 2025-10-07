export type NutrientKey =
  | 'DHA'
  | 'Selenium'
  | 'Vitamin_A_RAE'
  | 'Zinc'
  | 'Iron'
  | 'Iodine'
  | 'Choline'
  | 'Folate_DFE';

export type LifeStage = 'pregnancy_trimester2';

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

export interface ReportJSON {
  stage: LifeStage;
  week_start: string;
  week_end: string;
  nutrients: WeeklyReport;
  summary: {
    deficient_nutrients: NutrientKey[];
    surplus_nutrients: NutrientKey[];
    total_gap_surplus: number;
  };
}
