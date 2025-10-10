import { describe, it, expect } from 'vitest'
import { mergeNormalizedFoods, findRelatedFoods } from '../merging'
import { NormalizedFood } from '../types'

describe('Food Merging', () => {
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
      Selenium: 25,
      Vitamin_A_RAE: 0,
      Zinc: 0,
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
      DHA: 0,
      Selenium: 0,
      Vitamin_A_RAE: 0,
      Zinc: 1.2,
      Iron: 0.8,
      Iodine: 0,
      Choline: 85,
      Folate_DFE: 15,
    }
  }

  const offSalmon: NormalizedFood = {
    source: 'OFF',
    source_id: '041196910184',
    food_name: 'Saumon Atlantique',
    brand: 'Fresh Catch',
    serving_name: '100g',
    serving_size_g: 100,
    barcode: '041196910184',
    nutrients: {
      DHA: 0,
      Selenium: 0,
      Vitamin_A_RAE: 10,
      Zinc: 0,
      Iron: 0.5,
      Iodine: 0,
      Choline: 0,
      Folate_DFE: 0,
    }
  }

  it('should merge foods with max nutrient values', () => {
    const merged = mergeNormalizedFoods(fdcSalmon, [nixSalmon, offSalmon])

    expect(merged.food_name).toBe('Atlantic Salmon')
    expect(merged.brand).toBe('Fresh Catch') // From FDC (primary)
    expect(merged.barcode).toBe('041196910184')
    expect(merged.serving_name).toBe('100g fillet') // From FDC

    // Should take max values for nutrients
    expect(merged.nutrients.DHA).toBe(120) // From FDC
    expect(merged.nutrients.Selenium).toBe(25) // From FDC
    expect(merged.nutrients.Zinc).toBe(1.2) // From Nutritionix (higher than OFF)
    expect(merged.nutrients.Iron).toBe(0.8) // From Nutritionix
    expect(merged.nutrients.Choline).toBe(85) // From Nutritionix
    expect(merged.nutrients.Folate_DFE).toBe(15) // From Nutritionix
    expect(merged.nutrients.Vitamin_A_RAE).toBe(10) // From OFF (only non-zero)
  })

  it('should handle single food without fallbacks', () => {
    const merged = mergeNormalizedFoods(fdcSalmon, [])

    expect(merged).toEqual(fdcSalmon)
  })

  it('should find related foods by barcode', () => {
    const allFoods = [fdcSalmon, nixSalmon, offSalmon]
    const related = findRelatedFoods(fdcSalmon, allFoods)

    expect(related).toHaveLength(2)
    expect(related.map(f => f.source)).toEqual(['NUTRITIONIX', 'OFF'])
  })

  it('should find related foods by name similarity', () => {
    const differentBarcodeFood: NormalizedFood = {
      ...nixSalmon,
      barcode: undefined,
      source_id: '99999'
    }

    const allFoods = [fdcSalmon, differentBarcodeFood]
    const related = findRelatedFoods(fdcSalmon, allFoods)

    expect(related).toHaveLength(1)
    expect(related[0].source).toBe('NUTRITIONIX')
  })

  it('should not find unrelated foods', () => {
    const unrelatedFood: NormalizedFood = {
      source: 'FDC',
      source_id: '99999',
      food_name: 'Chicken Breast',
      nutrients: { DHA: 0, Selenium: 0, Vitamin_A_RAE: 0, Zinc: 0, Iron: 0, Iodine: 0, Choline: 0, Folate_DFE: 0 }
    }

    const allFoods = [fdcSalmon, unrelatedFood]
    const related = findRelatedFoods(fdcSalmon, allFoods)

    expect(related).toHaveLength(0)
  })
})




