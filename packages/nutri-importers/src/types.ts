import { NutrientKey } from 'nutri-core';

// Types for the importers package
export type DataSource = 'FDC' | 'NUTRITIONIX' | 'OFF';

export interface NormalizedFood {
  source: DataSource;
  source_id: string;
  food_name: string;
  brand?: string;
  serving_name?: string;
  serving_size_g?: number;
  barcode?: string;           // EAN/UPC if available
  nutrients: Record<NutrientKey, number>; // already in schema base units
}

export interface SearchOptions {
  limit?: number;
  dataSources?: DataSource[];
}

export interface BarcodeOptions {
  dataSources?: DataSource[];
}

export interface FDCFood {
  fdcId: number;
  description: string;
  brandName?: string;
  foodCategory?: string;
  foodNutrients: Array<{
    nutrient: {
      id: number;
      name: string;
      unitName: string;
    };
    amount: number;
  }>;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  gtinUpc?: string;
}

export interface FDCResponse {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  foods: FDCFood[];
}

export interface NutritionixItem {
  food_name: string;
  brand_name?: string;
  serving_qty: number;
  serving_unit: string;
  serving_weight_grams?: number;
  nf_calories?: number;
  full_nutrients: Array<{
    attr_id: number;
    value: number;
  }>;
  nix_brand_id?: string;
  nix_item_id?: string;
  upc?: string;
}

export interface NutritionixResponse {
  foods: NutritionixItem[];
}

export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  brands?: string;
  serving_size?: string;
  nutrition_data_per?: string;
  nutriments: Record<string, number>;
  ecoscore_grade?: string;
  nova_group?: number;
}

export interface OpenFoodFactsResponse {
  product: OpenFoodFactsProduct;
  status: number;
  status_verbose: string;
}

export interface OpenFoodFactsSearchResponse {
  products: OpenFoodFactsProduct[];
  count: number;
  page: number;
  pages: number;
}

// Nutrient mapping tables
export const FDC_NUTRIENT_MAP: Record<number, NutrientKey> = {
  1003: 'Zinc',        // Zinc, Zn
  1004: 'Iron',        // Iron, Fe
  1005: 'Selenium',    // Selenium, Se
  1051: 'Vitamin_A_RAE', // Vitamin A, RAE
  1090: 'Choline',     // Choline
  1175: 'Vitamin_B6',  // Vitamin B-6
  1177: 'Folate_DFE',  // Folate, DFE
  1185: 'DHA',         // DHA
  1240: 'Iodine',      // Iodine, I
};

export const NUTRITIONIX_NUTRIENT_MAP: Record<number, NutrientKey> = {
  301: 'Iron',         // Iron
  303: 'Zinc',         // Zinc
  317: 'Selenium',     // Selenium
  320: 'Vitamin_A_RAE', // Vitamin A
  421: 'Choline',      // Choline
  435: 'Folate_DFE',   // Folate
  621: 'DHA',          // DHA
  301: 'Iodine',       // Iodine (if available)
};

export const OFF_NUTRIENT_MAP: Record<string, NutrientKey> = {
  'iron': 'Iron',
  'zinc': 'Zinc',
  'selenium': 'Selenium',
  'vitamin-a': 'Vitamin_A_RAE',
  'choline': 'Choline',
  'folates': 'Folate_DFE',
  'dha': 'DHA',
  'iodine': 'Iodine',
};

