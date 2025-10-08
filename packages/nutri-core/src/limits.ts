import { z } from 'zod';
import { NutrientKey, Limits, FoodItem, ULReport, NutrientProvenance, LifeStage } from './types';

// Schema validation for limits.yml (after processing)
export const LimitsSchema = z.object({
  units_base: z.record(z.string()),
  UL: z.record(z.record(z.number().nullable())),
  plausibility_per_100g: z.record(z.tuple([z.number(), z.number()])),
  confidence_weights: z.record(z.number()),
});

// Load and validate limits from YAML
export function loadLimits(limitsPath: string): Limits {
  const fs = require('fs');
  const yaml = require('yaml');

  const yamlContent = fs.readFileSync(limitsPath, 'utf8');
  const parsed = yaml.parse(yamlContent);

  // Convert string ranges to tuples
  const processed = {
    ...parsed,
    plausibility_per_100g: Object.fromEntries(
      Object.entries(parsed.plausibility_per_100g as Record<string, string>).map(([key, value]: [string, string]) => {
        const match = value.match(/^(\d+)\.\.(\d+)$/);
        if (!match) throw new Error(`Invalid plausibility range format: ${value}`);
        return [key, [parseInt(match[1]), parseInt(match[2])] as [number, number]];
      })
    )
  };

  return LimitsSchema.parse(processed);
}

/**
 * Apply plausibility guards to a food item
 * Clamps implausible values and returns flags
 */
export function applyPlausibilityGuards(food: FoodItem, limits: Limits): { food: FoodItem; flags: string[] } {
  const flags: string[] = [];
  const guardedFood = { ...food };

  // Check each nutrient against plausibility bounds
  for (const [nutrientKey, [min, max]] of Object.entries(limits.plausibility_per_100g)) {
    const fieldName = `${nutrientKey}_${limits.units_base['µg'] === 'microgram' && nutrientKey.includes('Vitamin') ? 'µg' : 'mg'}`;
    const value = (guardedFood as any)[fieldName];

    if (value !== undefined && value !== null && guardedFood.serving_size_g > 0) {
      // Calculate per-100g value (current value is per serving)
      const per100g = (value * 100) / guardedFood.serving_size_g;

      if (per100g > max) {
        // Clamp to maximum plausible value
        const clampedValue = (max * guardedFood.serving_size_g) / 100;
        (guardedFood as any)[fieldName] = clampedValue;
        flags.push(`plausibility_clamped:${nutrientKey}:${per100g.toFixed(1)}>${max}`);
      } else if (per100g < min) {
        // Values below minimum might be legitimate (e.g., trace amounts)
        // but flag for review
        flags.push(`plausibility_low:${nutrientKey}:${per100g.toFixed(1)}<${min}`);
      }
    }
  }

  return { food: guardedFood, flags };
}

/**
 * Evaluate UL compliance for a nutrition report
 */
export function evaluateULs(
  report: { nutrients: Record<NutrientKey, { weekly_total: number }> },
  stage: LifeStage,
  limits: Limits
): ULReport {
  const ulReport: ULReport = {} as ULReport;

  for (const nutrient of Object.keys(limits.UL[stage] || {}) as NutrientKey[]) {
    const ul = limits.UL[stage]?.[nutrient];
    const total = report.nutrients[nutrient]?.weekly_total || 0;

    let severity: 'none' | 'warn' | 'error' = 'none';
    let overBy: number | null = null;

    if (ul && total > 0) {
      if (total > ul) {
        severity = 'error';
        overBy = total - ul;
      } else if (total >= ul * 0.8) {
        severity = 'warn';
        overBy = total - ul;
      }
    }

    ulReport[nutrient] = {
      total,
      ul,
      overBy,
      severity,
    };
  }

  return ulReport;
}

/**
 * Calculate confidence score for a nutrient value
 */
export function calculateConfidence(
  source: 'FDC' | 'NUTRITIONIX' | 'OFF' | 'none',
  value: number,
  limits: Limits
): number {
  if (value === 0) return 0;

  const baseWeight = limits.confidence_weights[source] || 0;

  // Data completeness factor (simplified)
  // In a real implementation, this would consider how complete the nutrient profile is
  const completenessFactor = 1.0;

  return baseWeight * completenessFactor;
}

/**
 * Create provenance record for a nutrient
 */
export function createProvenance(
  source: 'FDC' | 'NUTRITIONIX' | 'OFF' | 'derived' | 'none',
  confidence: number,
  flags: string[] = []
): NutrientProvenance {
  return {
    source,
    confidence,
    flags,
  };
}

