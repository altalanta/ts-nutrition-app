import { describe, it, expect } from 'vitest'
import { mergeNormalizedFoods, MergedFoodWithProvenance } from '../merging'
import { NormalizedFood } from '../types'

describe('Merge Policy - FDC Priority for Micronutrients', () => {
  const fdcSalmon: NormalizedFood = {
    source: 'FDC',
    source_id: '12345',
    food_name: 'Atlantic Salmon',
    brand: 'Fresh Catch',
    serving_name: '100g fillet',
    serving_size_g: 100,
    barcode: '041196910184',
    nutrients: {
      DHA: 120,
      Selenium: 25,      // Micronutrient - FDC should win
      Vitamin_A_RAE: 0,  // Micronutrient - FDC should win
      Zinc: 1.2,         // Not micronutrient - highest value wins
      Iron: 0,
      Iodine: 0,
      Choline: 0,
      Folate_DFE: 0,
    }
  }

  const nixSalmon: NormalizedFood = {
    source: 'NUTRITIONIX',
    source_id: '67890',
    food_name: 'Atlantic Salmon',
    brand: 'Premium Seafood',
    serving_name: '4oz serving',
    serving_size_g: 113,
    barcode: '041196910184',
    nutrients: {
      DHA: 110,          // Lower than FDC
      Selenium: 30,      // Higher than FDC but FDC should win for micronutrients
      Vitamin_A_RAE: 15, // Higher than FDC but FDC should win for micronutrients
      Zinc: 1.5,         // Higher than FDC - should win for non-micronutrient
      Iron: 0.8,
      Iodine: 0,
      Choline: 85,
      Folate_DFE: 15,
    }
  }

  it('should prefer FDC for micronutrients (Vitamin_A_RAE, Selenium)', () => {
    const merged = mergeNormalizedFoods(fdcSalmon, [nixSalmon]) as MergedFoodWithProvenance

    // FDC should win for micronutrients
    expect(merged.nutrients.Selenium).toBe(25) // FDC value
    expect(merged.nutrients.Vitamin_A_RAE).toBe(0) // FDC value

    // Nutritionix should win for non-micronutrients
    expect(merged.nutrients.Zinc).toBe(1.5) // Nix value (higher)
    expect(merged.nutrients.Choline).toBe(85) // Nix value
    expect(merged.nutrients.Folate_DFE).toBe(15) // Nix value

    // FDC should win for DHA (not micronutrient but FDC higher)
    expect(merged.nutrients.DHA).toBe(120) // FDC value

    // Check provenance
    expect(merged.provenance.Selenium.source).toBe('FDC')
    expect(merged.provenance.Vitamin_A_RAE.source).toBe('FDC')
    expect(merged.provenance.Zinc.source).toBe('NUTRITIONIX')
  })

  it('should detect conflicts when values differ wildly', () => {
    const lowSeleniumFood: NormalizedFood = {
      ...fdcSalmon,
      nutrients: {
        ...fdcSalmon.nutrients,
        Selenium: 5, // Very low selenium
      }
    }

    const highSeleniumFood: NormalizedFood = {
      ...nixSalmon,
      nutrients: {
        ...nixSalmon.nutrients,
        Selenium: 100, // Very high selenium (20x difference)
      }
    }

    const merged = mergeNormalizedFoods(lowSeleniumFood, [highSeleniumFood]) as MergedFoodWithProvenance

    // Should pick the higher confidence source (FDC)
    expect(merged.nutrients.Selenium).toBe(5) // FDC value

    // Should flag the conflict
    expect(merged.provenance.Selenium.flags).toContain('conflict:NUTRITIONIX:100.0')
  })

  it('should handle single food without fallbacks', () => {
    const merged = mergeNormalizedFoods(fdcSalmon, []) as MergedFoodWithProvenance

    // Should have provenance for all nutrients
    expect(merged.provenance.Selenium.source).toBe('FDC')
    expect(merged.provenance.DHA.source).toBe('FDC')
    expect(merged.confidence.Selenium).toBeGreaterThan(0)
    expect(merged.confidence.DHA).toBeGreaterThan(0)
  })

  it('should merge metadata correctly', () => {
    const merged = mergeNormalizedFoods(fdcSalmon, [nixSalmon]) as MergedFoodWithProvenance

    expect(merged.food_name).toBe('Atlantic Salmon')
    expect(merged.brand).toBe('Fresh Catch') // FDC brand (primary)
    expect(merged.barcode).toBe('041196910184')
    expect(merged.serving_name).toBe('100g fillet') // FDC serving name
  })

  it('should calculate completeness factor correctly', () => {
    // Test with a food that has only some nutrients
    const partialFood: NormalizedFood = {
      ...fdcSalmon,
      nutrients: {
        DHA: 120,
        Selenium: 25,
        Vitamin_A_RAE: 0,
        Zinc: 0,
        Iron: 0,
        Iodine: 0,
        Choline: 0,
        Folate_DFE: 0,
      }
    }

    const merged = mergeNormalizedFoods(partialFood, []) as MergedFoodWithProvenance

    // Completeness factor should be 2/8 = 0.25, confidence should be 1.0 * 0.25 = 0.25
    expect(merged.confidence.DHA).toBe(0.25)
    expect(merged.confidence.Selenium).toBe(0.25)
  })
})

