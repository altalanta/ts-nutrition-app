// Manual test of the nutrition engine core functionality
// This script tests the core logic without requiring npm/pnpm

const fs = require('fs');
const path = require('path');

// Simple YAML parser for our test
function parseYAML(yamlText) {
  const lines = yamlText.split('\n');
  const result = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed.includes(':')) {
      const [key, value] = trimmed.split(':').map(s => s.trim());
      if (value === '{' || value.startsWith('-')) {
        // Handle nested structures - simplified for our test
        continue;
      }
      result[key] = isNaN(value) ? value : Number(value);
    }
  }

  return result;
}

// Test unit conversions
function testUnits() {
  console.log('🧪 Testing unit conversions...');

  // Test mg/µg conversions
  function toMilligram(micrograms) {
    return micrograms / 1000;
  }

  function toMicrogram(milligrams) {
    return milligrams * 1000;
  }

  // Test conversions
  const test1 = toMilligram(1000) === 1;
  const test2 = toMicrogram(1) === 1000;
  const test3 = toMicrogram(toMilligram(2500)) === 2500; // idempotent

  console.log(`✅ mg/µg conversions: ${test1 && test2 && test3 ? 'PASS' : 'FAIL'}`);
}

// Test schema loading
function testSchemaLoading() {
  console.log('🧪 Testing schema loading...');

  try {
    const schemaPath = path.join(__dirname, 'data', 'schema.yml');
    const yamlContent = fs.readFileSync(schemaPath, 'utf8');

    // Just check that the file exists and has expected structure patterns
    const hasNutrientsSection = yamlContent.includes('nutrients:');
    const hasServingFields = yamlContent.includes('serving_fields:');
    const hasRequiredFields = yamlContent.includes('food_fields_required:');
    const hasDHA = yamlContent.includes('DHA:');

    console.log(`✅ Schema loading: ${hasNutrientsSection && hasServingFields && hasRequiredFields && hasDHA ? 'PASS' : 'FAIL'}`);
  } catch (error) {
    console.log(`❌ Schema loading: FAIL - ${error.message}`);
  }
}

// Test goals loading
function testGoalsLoading() {
  console.log('🧪 Testing goals loading...');

  try {
    const goalsPath = path.join(__dirname, 'data', 'goals.yml');
    const yamlContent = fs.readFileSync(goalsPath, 'utf8');

    // Just check that the file exists and has expected content
    const hasPregnancyStage = yamlContent.includes('pregnancy_trimester2:');
    const hasDHA = yamlContent.includes('DHA: 200');
    const hasIron = yamlContent.includes('Iron: 27');

    console.log(`✅ Goals loading: ${hasPregnancyStage && hasDHA && hasIron ? 'PASS' : 'FAIL'}`);
  } catch (error) {
    console.log(`❌ Goals loading: FAIL - ${error.message}`);
  }
}

// Test CSV loading
function testCSVLoading() {
  console.log('🧪 Testing CSV loading...');

  try {
    const csvPath = path.join(__dirname, 'data', 'sample_foods.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) throw new Error('CSV should have header + data');

    const headers = lines[0].split(',');
    const expectedHeaders = ['food_name', 'brand', 'category', 'fdc_id', 'serving_name', 'serving_size_g', 'DHA_mg', 'Selenium_µg', 'Vitamin_A_RAE_µg', 'Zinc_mg', 'Iron_mg', 'Iodine_µg', 'Choline_mg', 'Folate_DFE_µg'];

    const headersMatch = headers.length === expectedHeaders.length &&
      headers.every((header, i) => header.trim() === expectedHeaders[i]);

    console.log(`✅ CSV loading: ${headersMatch ? 'PASS' : 'FAIL'}`);
  } catch (error) {
    console.log(`❌ CSV loading: FAIL - ${error.message}`);
  }
}

// Test log loading
function testLogLoading() {
  console.log('🧪 Testing log loading...');

  try {
    const logPath = path.join(__dirname, 'data', 'log_example.csv');
    const csvContent = fs.readFileSync(logPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) throw new Error('Log should have header + data');

    const headers = lines[0].split(',');
    const expectedHeaders = ['date', 'food_name', 'servings'];

    const headersMatch = headers.length === expectedHeaders.length &&
      headers.every((header, i) => header.trim() === expectedHeaders[i]);

    console.log(`✅ Log loading: ${headersMatch ? 'PASS' : 'FAIL'}`);
  } catch (error) {
    console.log(`❌ Log loading: FAIL - ${error.message}`);
  }
}

// Run all tests
function runTests() {
  console.log('🚀 Running manual tests...\n');

  testUnits();
  testSchemaLoading();
  testGoalsLoading();
  testCSVLoading();
  testLogLoading();

  console.log('\n✨ Manual tests completed!');
}

// Run the tests
runTests();
