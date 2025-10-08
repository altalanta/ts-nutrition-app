import { NormalizedFood } from 'nutri-importers';
import { Schema, FoodItem } from './types';

/**
 * Convert a NormalizedFood from importers to a FoodItem for the core engine
 */
export function normalizeFromImporter(food: NormalizedFood, schema: Schema): FoodItem {
  // Initialize all nutrient fields to 0
  const nutrients: Record<string, number> = {};

  // Map nutrients from NormalizedFood to FoodItem format
  for (const [nutrientKey, value] of Object.entries(food.nutrients)) {
    const nutrientInfo = schema.nutrients[nutrientKey as keyof typeof schema.nutrients];
    if (nutrientInfo) {
      // Convert from base units back to the nutrient's native unit
      const unitValue = value; // Already in base units (mg/µg)
      nutrients[`${nutrientKey}_${nutrientInfo.unit}`] = unitValue;
    }
  }

  return {
    food_name: food.food_name,
    brand: food.brand || '',
    category: 'Imported', // Default category for imported foods
    fdc_id: parseInt(food.source_id) || 0, // Try to parse as number, fallback to 0
    serving_name: food.serving_name || '1 serving',
    serving_size_g: food.serving_size_g || 100,
    ...nutrients,
  } as FoodItem;
}

/**
 * Convert a FoodItem back to NormalizedFood format (for round-trip compatibility)
 */
export function foodItemToNormalized(foodItem: FoodItem, schema: Schema): NormalizedFood {
  const nutrients: Record<string, number> = {};

  // Map FoodItem nutrients back to base units
  for (const [nutrientKey, nutrientInfo] of Object.entries(schema.nutrients)) {
    const fieldName = `${nutrientKey}_${nutrientInfo.unit}`;
    const value = foodItem[fieldName as keyof FoodItem] as number || 0;
    nutrients[nutrientKey] = value; // Already in base units
  }

  return {
    source: 'FDC', // Default, could be enhanced to track original source
    source_id: foodItem.fdc_id.toString(),
    food_name: foodItem.food_name,
    brand: foodItem.brand,
    serving_name: foodItem.serving_name,
    serving_size_g: foodItem.serving_size_g,
    barcode: undefined, // Not stored in FoodItem
    nutrients,
  };
}

