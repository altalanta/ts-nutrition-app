import { describe, it, expect } from 'vitest'
import { loadLimits, loadGoals } from '../packages/nutri-core/src'
import path from 'path'

describe('UL Values and Units', () => {
  const limitsPath = path.join(__dirname, '../data/limits.yml')
  const goalsPath = path.join(__dirname, '../data/goals.yml')

  it('should load limits with correct units and structure', () => {
    const limits = loadLimits(limitsPath)

    expect(limits.units_base).toEqual({
      µg: 'microgram',
      mg: 'milligram'
    })

    expect(limits.UL.pregnancy.Vitamin_A_RAE_µg).toBe(3000)
    expect(limits.UL.pregnancy.Iodine_µg).toBe(1100)
    expect(limits.UL.pregnancy.Selenium_µg).toBe(400)
    expect(limits.UL.pregnancy.Zinc_mg).toBe(40)
    expect(limits.UL.pregnancy.Iron_mg).toBe(45)

    expect(limits.UL.lactation.Vitamin_A_RAE_µg).toBe(3000)
    expect(limits.UL.lactation.Iodine_µg).toBe(1100)
    expect(limits.UL.lactation.Selenium_µg).toBe(400)

    // DHA should be null (no established UL)
    expect(limits.UL.pregnancy.DHA_mg).toBeNull()
    expect(limits.UL.lactation.DHA_mg).toBeNull()
  })

  it('should load goals for all life stages', () => {
    const goals = loadGoals(goalsPath)

    const expectedStages = [
      'pregnancy_trimester1',
      'pregnancy_trimester2',
      'pregnancy_trimester3',
      'lactation',
      'preconception',
      'interpregnancy'
    ]

    expectedStages.forEach(stage => {
      expect(goals[stage]).toBeDefined()
      expect(typeof goals[stage]).toBe('object')
    })
  })

  it('should have monotonic ULs (pregnancy ≤ lactation)', () => {
    const limits = loadLimits(limitsPath)

    // Vitamin A should be same for pregnancy and lactation
    expect(limits.UL.pregnancy.Vitamin_A_RAE_µg).toBe(limits.UL.lactation.Vitamin_A_RAE_µg)

    // Iodine should be same
    expect(limits.UL.pregnancy.Iodine_µg).toBe(limits.UL.lactation.Iodine_µg)

    // Selenium should be same
    expect(limits.UL.pregnancy.Selenium_µg).toBe(limits.UL.lactation.Selenium_µg)

    // Zinc should be same
    expect(limits.UL.pregnancy.Zinc_mg).toBe(limits.UL.lactation.Zinc_mg)

    // Iron should be same
    expect(limits.UL.pregnancy.Iron_mg).toBe(limits.UL.lactation.Iron_mg)
  })

  it('should have UL ≥ RDA for nutrients where both exist', () => {
    const limits = loadLimits(limitsPath)
    const goals = loadGoals(goalsPath)

    // For pregnancy trimester 2 (where we have both UL and RDA)
    const pregnancyGoals = goals.pregnancy_trimester2
    const pregnancyULs = limits.UL.pregnancy

    // Vitamin A: UL (3000) ≥ RDA (770)
    expect(pregnancyULs.Vitamin_A_RAE_µg).toBeGreaterThanOrEqual(pregnancyGoals.Vitamin_A_RAE)

    // Iodine: UL (1100) ≥ RDA (220)
    expect(pregnancyULs.Iodine_µg).toBeGreaterThanOrEqual(pregnancyGoals.Iodine)

    // Selenium: UL (400) ≥ RDA (60)
    expect(pregnancyULs.Selenium_µg).toBeGreaterThanOrEqual(pregnancyGoals.Selenium)

    // Zinc: UL (40) ≥ RDA (11)
    expect(pregnancyULs.Zinc_mg).toBeGreaterThanOrEqual(pregnancyGoals.Zinc)

    // Iron: UL (45) ≥ RDA (27)
    expect(pregnancyULs.Iron_mg).toBeGreaterThanOrEqual(pregnancyGoals.Iron)

    // Folate: UL (1000) ≥ RDA (600)
    expect(pregnancyULs.Folate_DFE_µg).toBeGreaterThanOrEqual(pregnancyGoals.Folate_DFE)

    // Choline: UL (3500) ≥ RDA (450)
    expect(pregnancyULs.Choline_mg).toBeGreaterThanOrEqual(pregnancyGoals.Choline)
  })

  it('should have plausible per-100g bounds', () => {
    const limits = loadLimits(limitsPath)

    // Selenium bounds should be reasonable (Brazil nuts ~2000µg/100g)
    expect(limits.plausibility_per_100g.Selenium_µg[1]).toBe(2000)

    // Iodine bounds should be reasonable (seaweed ~5000µg/100g)
    expect(limits.plausibility_per_100g.Iodine_µg[1]).toBe(5000)

    // Vitamin A bounds should be reasonable (liver ~5000µg/100g)
    expect(limits.plausibility_per_100g.Vitamin_A_RAE_µg[1]).toBe(5000)

    // All bounds should be [0, max] format
    Object.values(limits.plausibility_per_100g).forEach(bounds => {
      expect(bounds).toHaveLength(2)
      expect(bounds[0]).toBe(0) // minimum
      expect(bounds[1]).toBeGreaterThan(0) // maximum
    })
  })

  it('should have correct confidence weights', () => {
    const limits = loadLimits(limitsPath)

    expect(limits.confidence_weights.FDC).toBe(1.0)
    expect(limits.confidence_weights.NUTRITIONIX).toBe(0.8)
    expect(limits.confidence_weights.OFF).toBe(0.6)

    // Weights should be in descending order
    const weights = Object.values(limits.confidence_weights)
    for (let i = 1; i < weights.length; i++) {
      expect(weights[i]).toBeLessThanOrEqual(weights[i - 1])
    }
  })
})
