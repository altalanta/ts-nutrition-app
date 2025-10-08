import axios from 'axios';
import { NutrientKey, convertToBaseUnit } from 'nutri-core';
import {
  NutritionixItem,
  NutritionixResponse,
  NormalizedFood,
  NUTRITIONIX_NUTRIENT_MAP,
  SearchOptions,
  BarcodeOptions
} from './types';

export class NutritionixImporter {
  private baseURL = 'https://trackapi.nutritionix.com/v2';

  constructor(
    private appId?: string,
    private apiKey?: string
  ) {}

  /**
   * Search for foods by name using Nutritionix
   */
  async searchByName(query: string, options: SearchOptions = {}): Promise<NormalizedFood[]> {
    if (!this.appId || !this.apiKey) {
      throw new Error('Nutritionix API credentials not provided');
    }

    try {
      const response = await axios.post<NutritionixResponse>(
        `${this.baseURL}/search/instant`,
        {
          query: query.trim(),
          detailed: true,
          branded: true,
        },
        {
          headers: {
            'x-app-id': this.appId,
            'x-app-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.foods
        .slice(0, options.limit || 10)
        .map(item => this.normalizeNutritionixItem(item));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Nutritionix API error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Look up a specific food by barcode using Nutritionix
   */
  async lookupByBarcode(barcode: string, options: BarcodeOptions = {}): Promise<NormalizedFood | null> {
    if (!this.appId || !this.apiKey) {
      throw new Error('Nutritionix API credentials not provided');
    }

    try {
      const response = await axios.get<NutritionixResponse>(
        `${this.baseURL}/search/item`,
        {
          params: {
            upc: barcode,
          },
          headers: {
            'x-app-id': this.appId,
            'x-app-key': this.apiKey,
          },
        }
      );

      if (response.data.foods.length === 0) {
        return null;
      }

      return this.normalizeNutritionixItem(response.data.foods[0]);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      if (axios.isAxiosError(error)) {
        throw new Error(`Nutritionix API error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Convert Nutritionix item to NormalizedFood format
   */
  private normalizeNutritionixItem(item: NutritionixItem): NormalizedFood {
    // Initialize all nutrients to 0
    const nutrients: Record<NutrientKey, number> = {
      DHA: 0,
      Selenium: 0,
      Vitamin_A_RAE: 0,
      Zinc: 0,
      Iron: 0,
      Iodine: 0,
      Choline: 0,
      Folate_DFE: 0,
    };

    // Map Nutritionix nutrients to our schema
    for (const fullNutrient of item.full_nutrients) {
      const attrId = fullNutrient.attr_id;
      const nutrientKey = NUTRITIONIX_NUTRIENT_MAP[attrId];

      if (nutrientKey) {
        // Nutritionix values are typically per serving, but we need to check the serving size
        // For now, assume the values are already in appropriate units per serving
        // This may need adjustment based on actual API responses
        nutrients[nutrientKey] = fullNutrient.value;
      }
    }

    // Determine serving size
    let servingSizeG: number | undefined;
    if (item.serving_weight_grams) {
      servingSizeG = item.serving_weight_grams;
    }

    return {
      source: 'NUTRITIONIX',
      source_id: item.nix_item_id || item.nix_brand_id || item.food_name,
      food_name: item.food_name,
      brand: item.brand_name,
      serving_name: `${item.serving_qty} ${item.serving_unit}`,
      serving_size_g: servingSizeG,
      barcode: item.upc,
      nutrients,
    };
  }
}

// Factory function for creating instances with environment variables
export function createNutritionixImporter(): NutritionixImporter {
  return new NutritionixImporter(
    process.env.NUTRITIONIX_APP_ID,
    process.env.NUTRITIONIX_API_KEY
  );
}

