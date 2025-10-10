import axios from 'axios';
import { NutrientKey, convertToBaseUnit } from 'nutri-core';
import {
  FDCResponse,
  FDCFood,
  NormalizedFood,
  FDC_NUTRIENT_MAP,
  SearchOptions,
  BarcodeOptions
} from './types';
import { responseCache, generateSearchCacheKey, generateFdcCacheKey } from './cache';

export class FDCImporter {
  private baseURL = 'https://api.nal.usda.gov/fdc/v1';

  /**
   * Search for foods by name using USDA FoodData Central
   */
  async searchByName(query: string, options: SearchOptions = {}): Promise<NormalizedFood[]> {
    const cacheKey = generateSearchCacheKey(query, options);

    // Check cache first
    const cached = responseCache.get<NormalizedFood[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await axios.get<FDCResponse>(`${this.baseURL}/foods/search`, {
        params: {
          query: query.trim(),
          pageSize: options.limit || 10,
          dataType: ['Foundation', 'SR Legacy', 'Branded'],
          sortBy: 'dataType.keyword',
          sortOrder: 'asc',
        },
      });

      const results = response.data.foods.map(food => this.normalizeFDCFood(food));

      // Cache the results
      responseCache.set(cacheKey, results, 10 * 60 * 1000); // 10 minutes

      return results;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`FDC API error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Look up a specific food by FDC ID
   */
  async lookupByFdcId(fdcId: string): Promise<NormalizedFood | null> {
    const cacheKey = generateFdcCacheKey(fdcId);

    // Check cache first
    const cached = responseCache.get<NormalizedFood | null>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const response = await axios.get<FDCFood>(`${this.baseURL}/food/${fdcId}`);
      const result = this.normalizeFDCFood(response.data);

      // Cache the result (including null for not found)
      responseCache.set(cacheKey, result, 30 * 60 * 1000); // 30 minutes

      return result;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // Cache 404 responses too
        responseCache.set(cacheKey, null, 30 * 60 * 1000);
        return null;
      }
      if (axios.isAxiosError(error)) {
        throw new Error(`FDC API error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Look up by barcode (if available in FDC)
   */
  async lookupByBarcode(barcode: string, options: BarcodeOptions = {}): Promise<NormalizedFood | null> {
    const cacheKey = `barcode_fdc:${barcode}:${JSON.stringify(options)}`;

    // Check cache first
    const cached = responseCache.get<NormalizedFood | null>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    try {
      // FDC doesn't have a direct barcode search, so we'll search by name patterns
      // This is a fallback - Nutritionix and OFF are better for barcodes
      const response = await axios.get<FDCResponse>(`${this.baseURL}/foods/search`, {
        params: {
          query: barcode,
          pageSize: 1,
          dataType: ['Branded'],
        },
      });

      if (response.data.foods.length === 0) {
        responseCache.set(cacheKey, null, 30 * 60 * 1000);
        return null;
      }

      const result = this.normalizeFDCFood(response.data.foods[0]);
      responseCache.set(cacheKey, result, 30 * 60 * 1000);

      return result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`FDC API error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Convert FDC food data to NormalizedFood format
   */
  private normalizeFDCFood(fdcFood: FDCFood): NormalizedFood {
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

    // Map FDC nutrients to our schema
    for (const foodNutrient of fdcFood.foodNutrients) {
      const nutrientId = foodNutrient.nutrient.id;
      const nutrientKey = FDC_NUTRIENT_MAP[nutrientId];

      if (nutrientKey) {
        // Convert to base units (mg or µg based on nutrient)
        const amount = convertToBaseUnit(foodNutrient.amount, foodNutrient.nutrient.unitName as any);
        nutrients[nutrientKey] = amount;
      }
    }

    // Determine serving size
    let servingSizeG: number | undefined;
    if (fdcFood.servingSize && fdcFood.servingSizeUnit) {
      if (fdcFood.servingSizeUnit.toLowerCase().includes('g')) {
        servingSizeG = fdcFood.servingSize;
      }
    }

    return {
      source: 'FDC',
      source_id: fdcFood.fdcId.toString(),
      food_name: fdcFood.description,
      brand: fdcFood.brandName,
      serving_name: fdcFood.householdServingFullText || `${fdcFood.servingSize || 100} ${fdcFood.servingSizeUnit || 'g'}`,
      serving_size_g: servingSizeG,
      barcode: fdcFood.gtinUpc,
      nutrients,
    };
  }
}

// Singleton instance
export const fdcImporter = new FDCImporter();
