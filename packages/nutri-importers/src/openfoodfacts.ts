import axios from 'axios';
import { NutrientKey, convertToBaseUnit } from 'nutri-core';
import {
  OpenFoodFactsProduct,
  OpenFoodFactsResponse,
  OpenFoodFactsSearchResponse,
  NormalizedFood,
  OFF_NUTRIENT_MAP,
  SearchOptions,
  BarcodeOptions
} from './types';

export class OpenFoodFactsImporter {
  private baseURL = 'https://world.openfoodfacts.org';

  /**
   * Search for foods by name using Open Food Facts
   */
  async searchByName(query: string, options: SearchOptions = {}): Promise<NormalizedFood[]> {
    try {
      const response = await axios.get<OpenFoodFactsSearchResponse>(
        `${this.baseURL}/cgi/search.pl`,
        {
          params: {
            search_terms: query.trim(),
            search_simple: 1,
            action: 'process',
            json: 1,
            page: 1,
            size: options.limit || 10,
          },
        }
      );

      return response.data.products
        .slice(0, options.limit || 10)
        .map(product => this.normalizeOFFProduct(product));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Open Food Facts API error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Look up a specific food by barcode using Open Food Facts
   */
  async lookupByBarcode(barcode: string, options: BarcodeOptions = {}): Promise<NormalizedFood | null> {
    try {
      const response = await axios.get<OpenFoodFactsResponse>(
        `${this.baseURL}/api/v2/product/${barcode}.json`
      );

      if (response.data.status === 0) {
        return null;
      }

      return this.normalizeOFFProduct(response.data.product);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      if (axios.isAxiosError(error)) {
        throw new Error(`Open Food Facts API error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Convert Open Food Facts product to NormalizedFood format
   */
  private normalizeOFFProduct(product: OpenFoodFactsProduct): NormalizedFood {
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

    // Map OFF nutrients to our schema
    for (const [offKey, nutrientKey] of Object.entries(OFF_NUTRIENT_MAP)) {
      const value = product.nutriments[`${offKey}_100g`] || product.nutriments[offKey];

      if (value && typeof value === 'number') {
        // OFF values are typically per 100g, but we need to check serving size
        // For now, assume per 100g and adjust if we have serving info
        let amount = value;

        // If we have serving size info, convert from per 100g to per serving
        if (product.serving_size && product.nutrition_data_per === '100g') {
          const servingMatch = product.serving_size.match(/(\d+(?:\.\d+)?)\s*g/i);
          if (servingMatch) {
            const servingGrams = parseFloat(servingMatch[1]);
            amount = (value * servingGrams) / 100;
          }
        }

        // Convert to base units if needed
        const unit = this.getNutrientUnit(nutrientKey);
        nutrients[nutrientKey] = convertToBaseUnit(amount, unit);
      }
    }

    // Determine serving size
    let servingSizeG: number | undefined;
    if (product.serving_size) {
      const servingMatch = product.serving_size.match(/(\d+(?:\.\d+)?)\s*g/i);
      if (servingMatch) {
        servingSizeG = parseFloat(servingMatch[1]);
      }
    }

    return {
      source: 'OFF',
      source_id: product.code,
      food_name: product.product_name,
      brand: product.brands?.split(',')[0]?.trim(),
      serving_name: product.serving_size || '100g',
      serving_size_g: servingSizeG,
      barcode: product.code,
      nutrients,
    };
  }

  /**
   * Get the unit for a nutrient key (simplified - in reality this would be in schema)
   */
  private getNutrientUnit(nutrientKey: NutrientKey): 'mg' | 'µg' {
    const mgNutrients = ['DHA', 'Zinc', 'Iron', 'Iodine', 'Choline'];
    return mgNutrients.includes(nutrientKey) ? 'mg' : 'µg';
  }
}

// Singleton instance
export const offImporter = new OpenFoodFactsImporter();

