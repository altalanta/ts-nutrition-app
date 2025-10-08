import { describe, it, expect } from 'vitest'
import { loadLimits, applyPlausibilityGuards, evaluateULs } from '../limits'
import path from 'path'

describe('Limits and Safety', () => {
  const limitsPath = path.join(__dirname, '../../data/limits.yml')

  it('should load limits configuration', () => {
    const limits = loadLimits(limitsPath)

    expect(limits.units_base).toBeDefined()
    expect(limits.UL).toBeDefined()
    expect(limits.plausibility_per_100g).toBeDefined()
    expect(limits.confidence_weights).toBeDefined()

    // Check specific values
    expect(limits.UL.pregnancy.Vitamin_A_RAE_µg).toBe(3000)
    expect(limits.UL.pregnancy.Selenium_µg).toBe(400)
    expect(limits.plausibility_per_100g.Selenium_µg).toEqual([0, 2000])
    expect(limits.confidence_weights.FDC).toBe(1.0)
    expect(limits.confidence_weights.NUTRITIONIX).toBe(0.8)
    expect(limits.confidence_weights.OFF).toBe(0.6)
  })

  it('should apply plausibility guards to food items', () => {
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

  it('should evaluate UL compliance correctly', () => {
    const limits = loadLimits(limitsPath)

    const report = {
      nutrients: {
        Vitamin_A_RAE: { weekly_total: 3500 }, // Over UL
        Selenium: { weekly_total: 500 },      // Over UL warning threshold
        DHA: { weekly_total: 150 },           // Below UL
      }
    }

    const ulAlerts = evaluateULs(report, 'pregnancy', limits)

    expect(ulAlerts.Vitamin_A_RAE.severity).toBe('exceeded')
    expect(ulAlerts.Vitamin_A_RAE.over_by).toBe(500) // 3500 - 3000

    expect(ulAlerts.Selenium.severity).toBe('warning')
    expect(ulAlerts.Selenium.over_by).toBe(100) // 500 - 400

    expect(ulAlerts.DHA.severity).toBe('none')
    expect(ulAlerts.DHA.over_by).toBeNull()
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
})



