import { describe, it, expect } from 'vitest';
import { loadFoods } from '../packages/nutri-core/src';
import path from 'path';

describe('Missing Values Handling', () => {
  const schemaPath = path.join(__dirname, '../data/schema.yml');

  it('should treat blank cells as 0 (not NaN)', () => {
    // Create a test CSV with missing values
    const testCsv = `food_name,brand,category,fdc_id,serving_name,serving_size_g,DHA_mg,Selenium_µg,Vitamin_A_RAE_µg,Zinc_mg,Iron_mg,Iodine_µg,Choline_mg,Folate_DFE_µg
Test Food,Test Brand,Test Category,12345,100g serving,100,,25,150,1.0,,50,30,75
Another Food,Another Brand,Another Category,67890,50g serving,50,0,0,0,0,0,0,0,0`;

    // Write test CSV to temp file
    const fs = require('fs');
    const testCsvPath = path.join(__dirname, 'test_missing.csv');
    fs.writeFileSync(testCsvPath, testCsv);

    try {
      const schema = require('../data/schema.yml');
      const foodDB = loadFoods(testCsvPath, schema);

      // Check that missing values become 0
      expect(foodDB['Test Food'].DHA_mg).toBe(0);
      expect(foodDB['Test Food'].Selenium_µg).toBe(25);
      expect(foodDB['Test Food'].Vitamin_A_RAE_µg).toBe(150);
      expect(foodDB['Test Food'].Zinc_mg).toBe(1.0);
      expect(foodDB['Test Food'].Iron_mg).toBe(0); // Empty cell should be 0
      expect(foodDB['Test Food'].Iodine_µg).toBe(50);
      expect(foodDB['Test Food'].Choline_mg).toBe(30);
      expect(foodDB['Test Food'].Folate_DFE_µg).toBe(75);

      // Check explicit zeros
      expect(foodDB['Another Food'].DHA_mg).toBe(0);
      expect(foodDB['Another Food'].Selenium_µg).toBe(0);
      expect(foodDB['Another Food'].Vitamin_A_RAE_µg).toBe(0);
      expect(foodDB['Another Food'].Zinc_mg).toBe(0);
      expect(foodDB['Another Food'].Iron_mg).toBe(0);
      expect(foodDB['Another Food'].Iodine_µg).toBe(0);
      expect(foodDB['Another Food'].Choline_mg).toBe(0);
      expect(foodDB['Another Food'].Folate_DFE_µg).toBe(0);

    } finally {
      // Clean up temp file
      if (fs.existsSync(testCsvPath)) {
        fs.unlinkSync(testCsvPath);
      }
    }
  });

  it('should ensure all report fields exist with zeros (not NaN)', () => {
    // This test ensures that when we compute a report, all nutrients have values
    // even if some foods have missing data
    const { loadSchema, loadGoals, computeWeekly } = require('../packages/nutri-core/src');

    const schema = loadSchema(schemaPath);
    const goals = loadGoals(path.join(__dirname, '../data/goals.yml'));

    // Create a food database with some missing values
    const foodDB = {
      'Test Food': {
        food_name: 'Test Food',
        brand: 'Test Brand',
        category: 'Test Category',
        fdc_id: 12345,
        serving_name: '100g serving',
        serving_size_g: 100,
        DHA_mg: 0,
        Selenium_µg: 0,
        Vitamin_A_RAE_µg: 0,
        Zinc_mg: 0,
        Iron_mg: 0,
        Iodine_µg: 0,
        Choline_mg: 0,
        Folate_DFE_µg: 0,
      }
    };

    // Create a simple log
    const logCsv = 'date,food_name,servings\n2025-10-01,Test Food,1';
    const logPath = path.join(__dirname, 'test_log.csv');
    fs.writeFileSync(logPath, logCsv);

    try {
      const report = computeWeekly({
        logPath,
        stage: 'pregnancy_trimester2',
        foodDB,
        goals,
        schema,
      });

      // Ensure all nutrients have valid numeric values (not NaN)
      Object.values(report.nutrients).forEach(nutrient => {
        expect(typeof nutrient.weekly_total).toBe('number');
        expect(typeof nutrient.weekly_goal).toBe('number');
        expect(typeof nutrient.percent_target).toBe('number');
        expect(typeof nutrient.gap_surplus).toBe('number');

        expect(isNaN(nutrient.weekly_total)).toBe(false);
        expect(isNaN(nutrient.weekly_goal)).toBe(false);
        expect(isNaN(nutrient.percent_target)).toBe(false);
        expect(isNaN(nutrient.gap_surplus)).toBe(false);

        // All should be zero since we consumed a food with all zeros
        expect(nutrient.weekly_total).toBe(0);
        expect(nutrient.gap_surplus).toBe(-nutrient.weekly_goal);
      });

    } finally {
      // Clean up
      if (fs.existsSync(logPath)) {
        fs.unlinkSync(logPath);
      }
    }
  });
});

