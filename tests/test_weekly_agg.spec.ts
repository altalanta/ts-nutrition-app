import { describe, it, expect } from 'vitest';
import { computeWeekly, loadSchema, loadGoals, loadFoods } from '../packages/nutri-core/src';
import path from 'path';

describe('Weekly Aggregation', () => {
  // Test data paths (relative to project root)
  const schemaPath = path.join(__dirname, '../data/schema.yml');
  const goalsPath = path.join(__dirname, '../data/goals.yml');
  const foodsPath = path.join(__dirname, '../data/sample_foods.csv');
  const logPath = path.join(__dirname, '../data/log_example.csv');

  it('should compute DHA and Iron totals correctly for pregnancy_trimester2', () => {
    const schema = loadSchema(schemaPath);
    const goals = loadGoals(goalsPath);
    const foodDB = loadFoods(foodsPath, schema);

    const report = computeWeekly({
      logPath,
      stage: 'pregnancy_trimester2',
      foodDB,
      goals,
      schema,
    });

    // Expected DHA calculation:
    // Day 1: Atlantic salmon (1 serving) = 120mg * 1 = 120mg
    // Total DHA: 120mg
    // Goal: 200mg
    // % Target: (120/200) * 100 = 60%

    expect(report.nutrients.DHA.weekly_total).toBe(120);
    expect(report.nutrients.DHA.weekly_goal).toBe(200);
    expect(report.nutrients.DHA.percent_target).toBe(60);

    // Expected Iron calculation:
    // Day 1: Large egg (2 servings) = 0.9mg * 2 = 1.8mg
    // Day 4: Fortified cereal (1 serving) = 4.5mg * 1 = 4.5mg
    // Day 6: Black beans (2 servings) = 1.8mg * 2 = 3.6mg
    // Total Iron: 1.8 + 4.5 + 3.6 = 9.9mg
    // Goal: 27mg
    // % Target: (9.9/27) * 100 ≈ 37%

    expect(report.nutrients.Iron.weekly_total).toBeCloseTo(9.9, 1);
    expect(report.nutrients.Iron.weekly_goal).toBe(27);
    expect(report.nutrients.Iron.percent_target).toBe(37);
  });

  it('should identify deficient nutrients correctly', () => {
    const schema = loadSchema(schemaPath);
    const goals = loadGoals(goalsPath);
    const foodDB = loadFoods(foodsPath, schema);

    const report = computeWeekly({
      logPath,
      stage: 'pregnancy_trimester2',
      foodDB,
      goals,
      schema,
    });

    // DHA should be deficient (60% < 100%)
    // Iron should be deficient (37% < 100%)
    expect(report.summary.deficient_nutrients).toContain('DHA');
    expect(report.summary.deficient_nutrients).toContain('Iron');

    // Check that nutrients with surplus or on track are not in deficient list
    expect(report.summary.deficient_nutrients).not.toContain('Selenium');
    expect(report.summary.deficient_nutrients).not.toContain('Vitamin_A_RAE');
  });

  it('should handle week boundaries correctly', () => {
    const schema = loadSchema(schemaPath);
    const goals = loadGoals(goalsPath);
    const foodDB = loadFoods(foodsPath, schema);

    const report = computeWeekly({
      logPath,
      stage: 'pregnancy_trimester2',
      foodDB,
      goals,
      schema,
    });

    // The week should start on Monday (2025-09-30) and end on Sunday (2025-10-05)
    // based on the first log entry being 2025-10-01 (Wednesday)
    expect(report.week_start).toBe('2025-09-30');
    expect(report.week_end).toBe('2025-10-05');
  });

  it('should calculate gap/surplus correctly', () => {
    const schema = loadSchema(schemaPath);
    const goals = loadGoals(goalsPath);
    const foodDB = loadFoods(foodsPath, schema);

    const report = computeWeekly({
      logPath,
      stage: 'pregnancy_trimester2',
      foodDB,
      goals,
      schema,
    });

    // DHA: 120 - 200 = -80 (deficit)
    expect(report.nutrients.DHA.gap_surplus).toBe(-80);

    // Iron: 9.9 - 27 ≈ -17.1 (deficit)
    expect(report.nutrients.Iron.gap_surplus).toBeCloseTo(-17.1, 1);
  });
});
