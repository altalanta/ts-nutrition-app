import { z } from 'zod';
import { NutrientKey, LifeStage, Schema, Goals, FoodItem, FoodLogEntry } from './types';

// Schema validation for YAML files
export const NutrientInfoSchema = z.object({
  unit: z.enum(['mg', 'µg']),
  aliases: z.array(z.string()).optional(),
});

export const SchemaSchema = z.object({
  nutrients: z.record(NutrientInfoSchema),
  serving_fields: z.array(z.string()),
  food_fields_required: z.array(z.string()),
});

// Goals validation
export const GoalsSchema = z.record(z.record(z.number().positive()));

// Food item validation (for CSV parsing)
export const FoodItemSchema = z.object({
  food_name: z.string(),
  brand: z.string(),
  category: z.string(),
  fdc_id: z.number(),
  serving_name: z.string(),
  serving_size_g: z.number().positive(),
  DHA_mg: z.number().default(0),
  Selenium_µg: z.number().default(0),
  Vitamin_A_RAE_µg: z.number().default(0),
  Zinc_mg: z.number().default(0),
  Iron_mg: z.number().default(0),
  Iodine_µg: z.number().default(0),
  Choline_mg: z.number().default(0),
  Folate_DFE_µg: z.number().default(0),
});

// Food log entry validation
export const FoodLogEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  food_name: z.string(),
  servings: z.number().positive(),
});

// Load and validate schema from YAML
export function loadSchema(schemaPath: string): Schema {
  const fs = require('fs');
  const yaml = require('yaml');

  const yamlContent = fs.readFileSync(schemaPath, 'utf8');
  const parsed = yaml.parse(yamlContent);

  return SchemaSchema.parse(parsed);
}

// Load and validate goals from YAML
export function loadGoals(goalsPath: string): Goals {
  const fs = require('fs');
  const yaml = require('yaml');

  const yamlContent = fs.readFileSync(goalsPath, 'utf8');
  const parsed = yaml.parse(yamlContent);

  return GoalsSchema.parse(parsed);
}

// Load and validate food database from CSV
export function loadFoods(csvPath: string, schema: Schema): Record<string, FoodItem> {
  const fs = require('fs');
  const Papa = require('papaparse');

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => {
      // Remove units from headers to match our schema
      return header.replace(/_(mg|µg)$/, '');
    }
  });

  if (parsed.errors.length > 0) {
    throw new Error(`CSV parsing errors: ${parsed.errors.map((e: { message: string }) => e.message).join(', ')}`);
  }

  const foodDB: Record<string, FoodItem> = {};

  for (const row of parsed.data) {
    // Validate required fields
    for (const field of schema.food_fields_required) {
      if (!row[field] || row[field] === '') {
        throw new Error(`Missing required field '${field}' in food item`);
      }
    }

    // Parse the food item with default values for missing nutrients
    const foodItem = FoodItemSchema.parse({
      ...row,
      fdc_id: Number(row.fdc_id),
      serving_size_g: Number(row.serving_size_g),
      DHA_mg: Number(row.DHA) || 0,
      Selenium_µg: Number(row.Selenium) || 0,
      Vitamin_A_RAE_µg: Number(row.Vitamin_A_RAE) || 0,
      Zinc_mg: Number(row.Zinc) || 0,
      Iron_mg: Number(row.Iron) || 0,
      Iodine_µg: Number(row.Iodine) || 0,
      Choline_mg: Number(row.Choline) || 0,
      Folate_DFE_µg: Number(row.Folate_DFE) || 0,
    });

    foodDB[foodItem.food_name] = foodItem;
  }

  return foodDB;
}

// Load and validate food log from CSV
export function loadFoodLog(csvPath: string): FoodLogEntry[] {
  const fs = require('fs');
  const Papa = require('papaparse');

  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    throw new Error(`CSV parsing errors: ${parsed.errors.map((e: { message: string }) => e.message).join(', ')}`);
  }

  return parsed.data.map((row: any) => FoodLogEntrySchema.parse({
    date: row.date,
    food_name: row.food_name,
    servings: Number(row.servings),
  }));
}


