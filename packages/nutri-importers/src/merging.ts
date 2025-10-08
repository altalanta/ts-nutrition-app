import { NutrientKey } from 'nutri-core';
import { NormalizedFood, DataSource } from './types';

/**
 * Merge policy configuration
 */
const MICRONUTRIENTS = ['Vitamin_A_RAE', 'Selenium', 'Iodine', 'Folate_DFE'];
const CONFLICT_THRESHOLD = 3.0; // 3x difference indicates potential conflict

/**
 * Determine if a nutrient is a micronutrient (prefer FDC for these)
 */
function isMicronutrient(nutrient: NutrientKey): boolean {
  return MICRONUTRIENTS.includes(nutrient);
}

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
 * Check if two values conflict (difference > threshold)
 */
function valuesConflict(value1: number, value2: number, threshold: number = CONFLICT_THRESHOLD): boolean {
  if (value1 === 0 || value2 === 0) return false;
  const ratio = Math.max(value1, value2) / Math.min(value1, value2);
  return ratio > threshold;
}

/**
 * Calculate completeness factor for a food entry
 * Based on how many nutrients are present vs tracked
 */
function calculateCompletenessFactor(food: NormalizedFood, totalTrackedNutrients: number): number {
  const presentNutrients = Object.values(food.nutrients).filter(v => v > 0).length;
  return Math.min(presentNutrients / totalTrackedNutrients, 1.0);
}

/**
 * Enhanced merge result with provenance and confidence tracking
 */
export interface MergedFoodWithProvenance extends NormalizedFood {
  provenance: Record<NutrientKey, { source: DataSource; confidence: number; flags: string[] }>;
  confidence: Record<NutrientKey, number>;
}

/**
 * Merge multiple NormalizedFood items from different sources into one
 * New policy: prefer FDC for micronutrients, else highest confidence non-zero
 * Returns provenance and confidence for each nutrient
 */
export function mergeNormalizedFoods(
  primary: NormalizedFood,
  fallbacks: NormalizedFood[]
): MergedFoodWithProvenance {
  // Start with primary source
  const merged: MergedFoodWithProvenance = {
    source: primary.source,
    source_id: primary.source_id,
    food_name: primary.food_name,
    brand: primary.brand,
    serving_name: primary.serving_name,
    serving_size_g: primary.serving_size_g,
    barcode: primary.barcode,
    nutrients: { ...primary.nutrients },
    provenance: {} as Record<NutrientKey, { source: DataSource; confidence: number; flags: string[] }>,
    confidence: {} as Record<NutrientKey, number>,
  };

  // Initialize provenance and confidence for all nutrients
  const allNutrients = Object.keys(primary.nutrients) as NutrientKey[];
  for (const nutrient of allNutrients) {
    merged.provenance[nutrient] = { source: 'none', confidence: 0, flags: [] };
    merged.confidence[nutrient] = 0;
  }

  // Merge fallbacks in priority order
  const allFoods = [primary, ...fallbacks];

  // Determine best metadata from each source
  for (const food of allFoods) {
    // Use best available brand (prefer branded sources)
    if (!merged.brand && food.brand) {
      merged.brand = food.brand;
    }

    // Use best available serving name
    if (!merged.serving_name && food.serving_name) {
      merged.serving_name = food.serving_name;
    }

    // Use best available serving size
    if (!merged.serving_size_g && food.serving_size_g) {
      merged.serving_size_g = food.serving_size_g;
    }

    // Use best available barcode
    if (!merged.barcode && food.barcode) {
      merged.barcode = food.barcode;
    }
  }

  // For nutrients, apply the new merge policy with provenance tracking
  for (const nutrient of allNutrients) {
    const nutrientChoices: Array<{ value: number; source: DataSource; confidence: number; completeness: number }> = [];

    // Collect all non-zero values for this nutrient
    for (const food of allFoods) {
      const value = food.nutrients[nutrient];
      if (value > 0) {
        const baseConfidence = getConfidenceForSource(food.source);
        const completeness = calculateCompletenessFactor(food, allNutrients.length);
        const confidence = baseConfidence * completeness;
        nutrientChoices.push({ value, source: food.source, confidence, completeness });
      }
    }

    if (nutrientChoices.length === 0) {
      // No data for this nutrient
      merged.provenance[nutrient] = { source: 'none', confidence: 0, flags: ['no_data'] };
      merged.confidence[nutrient] = 0;
      continue;
    }

    // Sort by confidence (highest first) for tie-breaking
    nutrientChoices.sort((a, b) => b.confidence - a.confidence);

    let chosenValue: number;
    let chosenSource: DataSource;
    let chosenConfidence: number;
    let flags: string[] = [];

    // Apply merge policy
    if (isMicronutrient(nutrient)) {
      // For micronutrients, prefer FDC if available
      const fdcChoice = nutrientChoices.find(choice => choice.source === 'FDC');
      if (fdcChoice) {
        chosenValue = fdcChoice.value;
        chosenSource = fdcChoice.source;
        chosenConfidence = fdcChoice.confidence;
      } else {
        // No FDC data, use highest confidence
        const bestChoice = nutrientChoices[0];
        chosenValue = bestChoice.value;
        chosenSource = bestChoice.source;
        chosenConfidence = bestChoice.confidence;
        flags.push('no_fdc_data');
      }
    } else {
      // For non-micronutrients, use highest confidence
      const bestChoice = nutrientChoices[0];
      chosenValue = bestChoice.value;
      chosenSource = bestChoice.source;
      chosenConfidence = bestChoice.confidence;
    }

    // Check for conflicts with other high-confidence sources
    const otherHighConfidence = nutrientChoices.filter(choice =>
      choice.source !== chosenSource && choice.confidence > 0.7
    );

    for (const other of otherHighConfidence) {
      if (valuesConflict(chosenValue, other.value)) {
        flags.push(`conflict:${other.source}:${other.value.toFixed(1)}`);
      }
    }

    // Set the chosen values
    merged.nutrients[nutrient] = chosenValue;
    merged.provenance[nutrient] = {
      source: chosenSource,
      confidence: chosenConfidence,
      flags
    };
    merged.confidence[nutrient] = chosenConfidence;
  }

  return merged;
}

/**
 * Create a lookup map for cross-referencing between sources
 */
export function createSourceCrosswalk(foods: NormalizedFood[]): Map<string, NormalizedFood[]> {
  const crosswalk = new Map<string, NormalizedFood[]>();

  for (const food of foods) {
    // Index by barcode if available
    if (food.barcode) {
      if (!crosswalk.has(food.barcode)) {
        crosswalk.set(food.barcode, []);
      }
      crosswalk.get(food.barcode)!.push(food);
    }

    // Index by normalized name (for fuzzy matching)
    const normalizedName = food.food_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!crosswalk.has(normalizedName)) {
      crosswalk.set(normalizedName, []);
    }
    crosswalk.get(normalizedName)!.push(food);
  }

  return crosswalk;
}

/**
 * Find related foods across sources using barcode/name matching
 */
export function findRelatedFoods(
  targetFood: NormalizedFood,
  allFoods: NormalizedFood[]
): NormalizedFood[] {
  const related: NormalizedFood[] = [];
  const crosswalk = createSourceCrosswalk(allFoods);

  // Find by barcode
  if (targetFood.barcode) {
    const barcodeMatches = crosswalk.get(targetFood.barcode) || [];
    for (const match of barcodeMatches) {
      if (match.source_id !== targetFood.source_id) {
        related.push(match);
      }
    }
  }

  // Find by name similarity (if no barcode matches)
  if (related.length === 0) {
    const normalizedName = targetFood.food_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const nameMatches = crosswalk.get(normalizedName) || [];
    for (const match of nameMatches) {
      if (match.source_id !== targetFood.source_id) {
        related.push(match);
      }
    }
  }

  return related;
}
