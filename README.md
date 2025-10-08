# TypeScript Nutrition Engine

A TypeScript-based nutrition tracking system that loads food and nutrient data, aggregates daily intake to weekly totals, compares against life-stage targets, and identifies nutritional gaps and surpluses.

## Project Structure

```
/nutri
  /packages
    /nutri-core      # Pure TypeScript library (framework-agnostic)
    /nutri-cli       # CLI wrapper around nutri-core
    /nutri-importers # HTTP clients for FDC, Nutritionix, OFF
  /apps
    /nutri-web       # Next.js web app with search & reports
  /data              # Sample data files (CSV/YAML)
  /tests             # Vitest tests
  package.json
  pnpm-workspace.yaml
  README.md
```

## Features

- **Pure TypeScript**: Framework-agnostic library that can be used in Next.js, React Native, or any TypeScript project
- **CSV/YAML Data Loading**: Load food databases and nutrition goals from standard formats
- **Weekly Aggregation**: Convert daily food logs into weekly nutrient totals
- **Life-stage Targets**: Compare intake against specific nutritional goals for different life stages
- **Gap Analysis**: Identify deficient and surplus nutrients
- **Unit Conversion**: Proper handling of mg/µg conversions with branded types for type safety
- **CLI Interface**: Command-line tool for generating reports
- **Data Importers**: HTTP clients for USDA FDC, Nutritionix, and Open Food Facts with intelligent merging
- **Barcode Support**: Look up foods by barcode (EAN/UPC) across multiple data sources
- **Web Interface**: Next.js app for searching foods, scanning barcodes, and viewing reports

## Installation

```bash
pnpm install
```

## Building

```bash
pnpm -w build
```

## Testing

```bash
pnpm -w test
```

## Usage

### Library Usage

```typescript
import {
  loadSchema,
  loadGoals,
  loadFoods,
  computeWeekly,
  getDeficientNutrients
} from 'nutri-core';

// Load data
const schema = loadSchema('./data/schema.yml');
const goals = loadGoals('./data/goals.yml');
const foodDB = loadFoods('./data/sample_foods.csv', schema);

// Compute weekly report
const report = computeWeekly({
  logPath: './data/log_example.csv',
  stage: 'pregnancy_trimester2',
  foodDB,
  goals,
  schema,
});

// Get deficient nutrients (below 90% of target)
const deficient = getDeficientNutrients(report, 0.9);
```

### CLI Usage

```bash
# Generate weekly report from food log
pnpm --filter nutri-cli exec nutri report \
  --stage pregnancy_trimester2 \
  --log data/log_example.csv \
  --goals data/goals.yml \
  --schema data/schema.yml \
  --foods data/sample_foods.csv \
  --limits data/limits.yml \
  --out report.json

# Search for foods by name
pnpm --filter nutri-cli exec nutri find --query "salmon"

# Scan barcode and generate report (with safety features)
pnpm --filter nutri-cli exec nutri scan \
  --barcode 041196910184 \
  --stage pregnancy_trimester2 \
  --limits data/limits.yml \
  --out report.json
```

The CLI now includes:
- **UL Badges**: ✓ (good), ! (near UL), ✕ (exceeded UL)
- **Provenance Display**: Source and confidence scores for each nutrient
- **Safety Warnings**: Flags for implausible values and data conflicts

### Web Usage

```bash
# Start the web development server
pnpm run dev:web

# Open http://localhost:3000
```

The web app provides:
- **Onboarding**: Select your life stage (preconception, pregnancy trimesters, lactation)
- **Search Tab**: Search for foods by name with provenance and confidence indicators
- **Barcode Tab**: Enter barcode numbers for product lookup with safety validation
- **Log Tab**: Daily food logging with weekly reports showing UL compliance and data quality
- **Settings**: Life stage management, export options, and privacy controls

## Data Importers & Safety Model

The system includes HTTP clients for three major nutrition data sources with a sophisticated safety-aware merging strategy:

- **USDA FoodData Central (FDC)**: Government database with comprehensive, verified nutrient data
- **Nutritionix**: Commercial database with strong barcode and branded product coverage
- **Open Food Facts (OFF)**: Open-source database with global barcode coverage

### Safety-First Data Merging Strategy

When multiple sources provide data for the same product, the system applies a deterministic safety policy:

1. **FDC Priority for Micronutrients**: For safety-critical micronutrients (Vitamin A, Selenium, Iodine, Folate), FDC data is preferred when available
2. **Confidence-Weighted Selection**: For other nutrients, the highest-confidence source is selected
3. **Conflict Detection**: Values differing by >3× trigger conflict flags for review
4. **Plausibility Guards**: Implausible per-100g values are clamped to reasonable bounds
5. **Provenance Tracking**: Each nutrient value includes source, confidence score, and quality flags

### Safety Model

**Upper Limits (ULs)**: The system warns at 80% of established ULs and errors at 100%+ for pregnancy/lactation stages.

**Plausibility Bounds**: Nutrient values exceeding realistic per-100g thresholds are clamped and flagged.

**Confidence Scoring**: Each nutrient value is scored based on source reliability (FDC=1.0, Nutritionix=0.8, OFF=0.6) × data completeness.

**Provenance Chips**: All nutrient data includes source attribution and confidence indicators.

### Environment Setup

Create a `.env` file based on `.env.example`:

```bash
# Nutritionix API credentials (optional)
NUTRITIONIX_APP_ID=your_app_id
NUTRITIONIX_API_KEY=your_api_key
```

## Data Formats

### Schema (YAML)

```yaml
nutrients:
  DHA: { unit: mg, aliases: ["docosahexaenoic acid","n-3 DHA"] }
  Selenium: { unit: µg, aliases: ["Se"] }
  Vitamin_A_RAE: { unit: µg, aliases: ["VitA_RAE","Retinol Activity Equivalents"] }
serving_fields: [serving_size_g, serving_name]
food_fields_required: [food_name, brand, category, fdc_id]
```

### Goals (YAML)

```yaml
pregnancy_trimester2:
  DHA: 200
  Selenium: 60
  Vitamin_A_RAE: 770
  Zinc: 11
  Iron: 27
  Iodine: 220
  Choline: 450
  Folate_DFE: 600
```

### Foods (CSV)

```csv
food_name,brand,category,fdc_id,serving_name,serving_size_g,DHA_mg,Selenium_µg,Vitamin_A_RAE_µg,Zinc_mg,Iron_mg,Iodine_µg,Choline_mg,Folate_DFE_µg
Atlantic salmon,Fresh Market,Fish,123456,100g fillet,100,120,25,0,1.2,2.1,0,85,15
```

### Food Log (CSV)

```csv
date,food_name,servings
2025-10-01,Atlantic salmon,1
2025-10-01,Large egg,2
2025-10-02,Whole milk,1
```

## Development

- **TypeScript**: Strict mode with comprehensive type safety
- **Testing**: Vitest for unit tests with 100% coverage requirements
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier for consistent code style
- **Build**: tsup for fast TypeScript compilation

## License

MIT
