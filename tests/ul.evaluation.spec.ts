import { describe, it, expect } from 'vitest'
import { loadLimits, applyPlausibilityGuards, evaluateULs } from '../packages/nutri-core/src'
import path from 'path'

describe('UL Evaluation and Plausibility Guards', () => {
  const limitsPath = path.join(__dirname, '../data/limits.yml')

  it('should load limits and evaluate ULs correctly for pregnancy', () => {
    const limits = loadLimits(limitsPath)

    const report = {
      nutrients: {
        Vitamin_A_RAE: { weekly_total: 3500 }, // Over UL (3000)
        Selenium: { weekly_total: 500 },      // Over warning threshold (400 * 0.8 = 320)
        DHA: { weekly_total: 150 },           // Below UL (no UL set)
      }
    }

    const ulAlerts = evaluateULs(report, 'pregnancy', limits)

    expect(ulAlerts.Vitamin_A_RAE.severity).toBe('error')
    expect(ulAlerts.Vitamin_A_RAE.overBy).toBe(500) // 3500 - 3000

    expect(ulAlerts.Selenium.severity).toBe('warn')
    expect(ulAlerts.Selenium.overBy).toBe(100) // 500 - 400

    expect(ulAlerts.DHA.severity).toBe('none')
    expect(ulAlerts.DHA.overBy).toBeNull()
  })

  it('should apply plausibility guards and clamp outrageous values', () => {
    const limits = loadLimits(limitsPath)

    const foodItem = {
      food_name: 'Test Food',
      brand: 'Test Brand',
      category: 'Test',
      fdc_id: 123,
      serving_name: '100g',
      serving_size_g: 100,
      DHA_mg: 0,
      Selenium_µg: 3000, // This should be clamped (over 2000 µg/100g)
      Vitamin_A_RAE_µg: 0,
      Zinc_mg: 0,
      Iron_mg: 0,
      Iodine_µg: 0,
      Choline_mg: 0,
      Folate_DFE_µg: 0,
    }

    const result = applyPlausibilityGuards(foodItem, limits)

    expect(result.flags).toContain('plausibility_clamped:Selenium:30>2000')
    expect(result.food.Selenium_µg).toBe(2000) // Should be clamped to max
  })

  it('should handle missing UL values gracefully', () => {
    const limits = loadLimits(limitsPath)

    const report = {
      nutrients: {
        DHA: { weekly_total: 1000 }, // No UL established
      }
    }

    const ulAlerts = evaluateULs(report, 'pregnancy', limits)

    expect(ulAlerts.DHA.ul).toBeNull()
    expect(ulAlerts.DHA.severity).toBe('none')
  })

  it('should handle zero or negative serving sizes gracefully', () => {
    const limits = loadLimits(limitsPath)

    const foodItem = {
      food_name: 'Test Food',
      brand: 'Test Brand',
      category: 'Test',
      fdc_id: 123,
      serving_name: '100g',
      serving_size_g: 0, // Zero serving size
      DHA_mg: 0,
      Selenium_µg: 3000,
      Vitamin_A_RAE_µg: 0,
      Zinc_mg: 0,
      Iron_mg: 0,
      Iodine_µg: 0,
      Choline_mg: 0,
      Folate_DFE_µg: 0,
    }

    const result = applyPlausibilityGuards(foodItem, limits)

    // Should not apply guards for zero serving size
    expect(result.food.Selenium_µg).toBe(3000)
    expect(result.flags).toHaveLength(0)
  })

  it('should handle nutrients not in plausibility bounds', () => {
    const limits = loadLimits(limitsPath)

    const foodItem = {
      food_name: 'Test Food',
      brand: 'Test Brand',
      category: 'Test',
      fdc_id: 123,
      serving_name: '100g',
      serving_size_g: 100,
      DHA_mg: 2000, // DHA is in bounds (max 1000mg/100g)
      Selenium_µg: 0,
      Vitamin_A_RAE_µg: 0,
      Zinc_mg: 0,
      Iron_mg: 0,
      Iodine_µg: 0,
      Choline_mg: 0,
      Folate_DFE_µg: 0,
    }

    const result = applyPlausibilityGuards(foodItem, limits)

    // DHA should not be clamped since it's within bounds
    expect(result.food.DHA_mg).toBe(2000)
    expect(result.flags).toHaveLength(0)
  })
})
