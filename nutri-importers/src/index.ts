// Main exports for nutri-importers
export * from './types';
export * from './fdc';
export * from './nutritionix';
export * from './openfoodfacts';
export * from './merging';
export * from './cache';

// Main API functions
import { fdcImporter } from './fdc';
import { createNutritionixImporter } from './nutritionix';
import { offImporter } from './openfoodfacts';
import { mergeNormalizedFoods, findRelatedFoods, MergedFoodWithProvenance } from './merging';
import { responseCache, generateSearchCacheKey, generateBarcodeCacheKey } from './cache';
import { NormalizedFood, SearchOptions, BarcodeOptions, DataSource } from './types';
import { NutrientKey } from 'nutri-core';

/**
 * Get confidence weight for a data source
 */
function getConfidenceForSource(source: DataSource): number {
  const weights = {
    FDC: 1.0,
    NUTRITIONIX: 0.8,
    OFF: 0.6,
  };
  return weights[source] || 0;
}

/**
 * Search for foods by name across all available data sources
 */
export async function searchByName(
  query: string,
  options: SearchOptions = {}
): Promise<NormalizedFood[]> {
  const cacheKey = generateSearchCacheKey(query, options);

  // Check cache first
  const cached = responseCache.get<NormalizedFood[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const results: NormalizedFood[] = [];

  // Try all sources in parallel
  const promises = [];

  // FDC search
  promises.push(
    fdcImporter.searchByName(query, options).catch(() => [])
  );

  // Nutritionix search (if credentials available)
  try {
    const nixImporter = createNutritionixImporter();
    promises.push(
      nixImporter.searchByName(query, options).catch(() => [])
    );
  } catch {
    // Skip Nutritionix if no credentials
  }

  // OFF search
  promises.push(
    offImporter.searchByName(query, options).catch(() => [])
  );

  const allResults = await Promise.all(promises);

  // Flatten results
  for (const resultSet of allResults) {
    results.push(...resultSet);
  }

  // Remove duplicates and merge related foods
  const uniqueResults = new Map<string, MergedFoodWithProvenance>();
  const processedIds = new Set<string>();

  for (const food of results) {
    const key = `${food.source}:${food.source_id}`;

    if (processedIds.has(key)) continue;

    // Find related foods from other sources
    const relatedFoods = findRelatedFoods(food, results);

    // Merge if we have related foods from other sources
    if (relatedFoods.length > 0) {
      const merged = mergeNormalizedFoods(food, relatedFoods);
      uniqueResults.set(key, merged);
    } else {
      // Convert to MergedFoodWithProvenance format
      const merged: MergedFoodWithProvenance = {
        ...food,
        provenance: {} as any,
        confidence: {} as any,
      };

      // Initialize provenance for all nutrients
      const allNutrients = Object.keys(food.nutrients) as NutrientKey[];
      for (const nutrient of allNutrients) {
        const confidence = getConfidenceForSource(food.source);
        merged.provenance[nutrient] = {
          source: food.source,
          confidence,
          flags: []
        };
        merged.confidence[nutrient] = confidence;
      }

      uniqueResults.set(key, merged);
    }

    processedIds.add(key);
  }

  const finalResults = Array.from(uniqueResults.values());

  // Cache the results
  responseCache.set(cacheKey, finalResults, 15 * 60 * 1000); // 15 minutes

  return finalResults;
}

/**
 * Look up a food by barcode across all available data sources
 * Priority: Nutritionix > OFF > FDC (fallback name search)
 */
export async function lookupByBarcode(
  barcode: string,
  options: BarcodeOptions = {}
): Promise<NormalizedFood | null> {
  const cacheKey = generateBarcodeCacheKey(barcode, options);

  // Check cache first
  const cached = responseCache.get<NormalizedFood | null>(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  // Try Nutritionix first (best barcode coverage)
  try {
    const nixImporter = createNutritionixImporter();
    const nixResult = await nixImporter.lookupByBarcode(barcode, options);
    if (nixResult) {
      // Try to enhance with other sources
      const relatedFoods = await findRelatedFoodsFromAllSources(nixResult);
      if (relatedFoods.length > 0) {
        const merged = mergeNormalizedFoods(nixResult, relatedFoods);
        responseCache.set(cacheKey, merged, 30 * 60 * 1000); // 30 minutes
        return merged;
      }
      // Convert to MergedFoodWithProvenance format
      const merged: MergedFoodWithProvenance = {
        ...nixResult,
        provenance: {} as any,
        confidence: {} as any,
      };

      // Initialize provenance for all nutrients
      const allNutrients = Object.keys(nixResult.nutrients) as NutrientKey[];
      for (const nutrient of allNutrients) {
        const confidence = getConfidenceForSource(nixResult.source);
        merged.provenance[nutrient] = {
          source: nixResult.source,
          confidence,
          flags: []
        };
        merged.confidence[nutrient] = confidence;
      }

      responseCache.set(cacheKey, merged, 30 * 60 * 1000);
      return merged;
    }
  } catch {
    // Skip if no credentials or error
  }

  // Try Open Food Facts next
  try {
    const offResult = await offImporter.lookupByBarcode(barcode, options);
    if (offResult) {
      // Try to enhance with other sources
      const relatedFoods = await findRelatedFoodsFromAllSources(offResult);
      if (relatedFoods.length > 0) {
        const merged = mergeNormalizedFoods(offResult, relatedFoods);
        responseCache.set(cacheKey, merged, 30 * 60 * 1000);
        return merged;
      }
      // Convert to MergedFoodWithProvenance format
      const merged: MergedFoodWithProvenance = {
        ...offResult,
        provenance: {} as any,
        confidence: {} as any,
      };

      // Initialize provenance for all nutrients
      const allNutrients = Object.keys(offResult.nutrients) as NutrientKey[];
      for (const nutrient of allNutrients) {
        const confidence = getConfidenceForSource(offResult.source);
        merged.provenance[nutrient] = {
          source: offResult.source,
          confidence,
          flags: []
        };
        merged.confidence[nutrient] = confidence;
      }

      responseCache.set(cacheKey, merged, 30 * 60 * 1000);
      return merged;
    }
  } catch {
    // Skip if error
  }

  // Fallback to FDC (limited barcode support)
  try {
    const fdcResult = await fdcImporter.lookupByBarcode(barcode, options);
    if (fdcResult) {
      // Convert to MergedFoodWithProvenance format
      const merged: MergedFoodWithProvenance = {
        ...fdcResult,
        provenance: {} as any,
        confidence: {} as any,
      };

      // Initialize provenance for all nutrients
      const allNutrients = Object.keys(fdcResult.nutrients) as NutrientKey[];
      for (const nutrient of allNutrients) {
        const confidence = getConfidenceForSource(fdcResult.source);
        merged.provenance[nutrient] = {
          source: fdcResult.source,
          confidence,
          flags: []
        };
        merged.confidence[nutrient] = confidence;
      }

      responseCache.set(cacheKey, merged, 30 * 60 * 1000);
      return merged;
    }
  } catch {
    // Skip if error
  }

  // Cache null result too
  responseCache.set(cacheKey, null, 30 * 60 * 1000);
  return null;
}

/**
 * Look up a food by FDC ID (direct FDC lookup)
 */
export async function lookupByFdcId(fdcId: string): Promise<NormalizedFood | null> {
  return fdcImporter.lookupByFdcId(fdcId);
}

/**
 * Find related foods from all sources for a given food
 */
async function findRelatedFoodsFromAllSources(targetFood: NormalizedFood): Promise<NormalizedFood[]> {
  const related: NormalizedFood[] = [];

  try {
    // Search other sources for similar foods
    const searchResults = await searchByName(targetFood.food_name, { limit: 5 });

    for (const result of searchResults) {
      if (result.source !== targetFood.source && result.source_id !== targetFood.source_id) {
        // Check if this is actually the same product (by barcode or name similarity)
        const isSameProduct =
          (targetFood.barcode && result.barcode === targetFood.barcode) ||
          (targetFood.food_name.toLowerCase().includes(result.food_name.toLowerCase()) ||
           result.food_name.toLowerCase().includes(targetFood.food_name.toLowerCase()));

        if (isSameProduct) {
          related.push(result);
        }
      }
    }
  } catch {
    // Ignore errors in finding related foods
  }

  return related;
}

// Re-export merging functions for advanced usage
export { mergeNormalizedFoods, findRelatedFoods };
