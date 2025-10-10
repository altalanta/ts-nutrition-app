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
- **Camera Scanning**: In-browser barcode scanning using ZXing library (EAN-13, EAN-8, UPC-A, UPC-E, CODE-128)
- **Progressive Web App (PWA)**: Installable app with offline support and service worker caching
- **Mock Mode**: Deterministic demo data for development/testing without external API dependencies

## Try the Live Demo

🚀 **[Try the Nutrition Tracker Demo](https://your-vercel-app-url.vercel.app)**

The live demo includes:
- **Camera Barcode Scanning**: Use your device's camera to scan product barcodes
- **Offline Support**: Install as a PWA for offline nutrition tracking
- **Sample Data**: Pre-loaded with 7 days of sample nutrition data
- **PDF Reports**: Generate clinician-ready reports with full provenance
- **Safety Features**: UL compliance warnings and data quality indicators

### Demo Features
- **Camera Scanning**: Click "Scan Barcode" and allow camera access to scan EAN/UPC codes
- **PWA Installation**: Look for the install prompt or use browser menu to install the app
- **Offline Mode**: The demo works without internet connection using mock data
- **Sample Log**: Pre-loaded with realistic nutrition data for testing reports

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

# Export PDF report for clinicians
pnpm --filter nutri-cli exec nutri export-pdf \
  --stage pregnancy_trimester2 \
  --log data/log_example.csv \
  --goals data/goals.yml \
  --schema data/schema.yml \
  --limits data/limits.yml \
  --week-start 2025-10-01 \
  --out report.pdf
```

The CLI now includes:
- **UL Badges**: ✓ (good), ! (near UL ≥80%), ✕ (exceeded UL >100%)
- **Provenance Display**: Source and confidence scores for each nutrient
- **Safety Warnings**: Flags for implausible values and data conflicts
- **PDF Export**: Clinician-ready reports with citations and provenance

### Web Usage

```bash
# Start the web development server
pnpm run dev:web

# Open http://localhost:3000
```

The web app provides:
- **Onboarding**: Select your life stage (preconception, pregnancy trimesters, lactation)
- **Search Tab**: Search for foods by name with provenance and confidence indicators
- **Barcode Tab**: Camera scanning or manual entry of barcode numbers with safety validation
- **PWA Features**: Install as an app with offline support and quick access from home screen
- **Log Tab**: Daily food logging with weekly reports showing UL compliance and data quality
- **PDF Export**: Generate clinician-ready PDF reports with full provenance and citations
- **Settings**: Life stage management, export options, and privacy controls

### Camera Barcode Scanning
- **Browser Support**: Works in modern browsers with camera access (Chrome, Firefox, Safari, Edge)
- **Supported Formats**: EAN-13, EAN-8, UPC-A, UPC-E, CODE-128 barcodes
- **Permission Handling**: Graceful fallback to manual input if camera access is denied
- **Feature Flag**: Controlled by `NEXT_PUBLIC_ENABLE_CAMERA` environment variable

### PWA & Offline Support
- **Service Worker**: Caches static assets and API responses for offline functionality
- **Install Prompt**: Smart installation prompt that appears when appropriate
- **Offline Mode**: Mock data ensures the demo works without internet connection
- **App-like Experience**: Standalone display mode with custom theme colors

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

**Data Source Hierarchy:**
- **FDC (1.0)**: Government-verified, highest confidence
- **Nutritionix (0.8)**: Commercial database with verified ingredients
- **OFF (0.6)**: User-contributed data, variable quality

**Safety Features:**
- **UL Compliance**: Warns at 80% of established ULs, errors at 100%+
- **Plausibility Checks**: Clamps impossible values (e.g., selenium >2000µg/100g)
- **Quality Flags**: Surfaces data conflicts and implausible values
- **Clinical Citations**: All values include authoritative source references


### PDF Report Export

Both CLI and web app support exporting clinician-ready PDF reports with:

- **Weekly nutrient summaries** with goals and % target achievement
- **UL compliance indicators** with clear warnings for safety concerns
- **Data provenance tracking** showing source and confidence for each nutrient
- **Quality flags** highlighting implausible values or data conflicts
- **Full citations** from authoritative sources (IOM, WHO, etc.)
- **Privacy protection** - no personal identifiers included

### Safety Model & Citations

**Data Provenance & Confidence Scoring:**
- **FDC (USDA FoodData Central)**: Government-verified data, highest confidence (1.0)
- **Nutritionix**: Commercial database with verified ingredients (0.8 confidence)
- **Open Food Facts**: User-contributed data, variable quality (0.6 confidence)

**Upper Limits (ULs):** Based on IOM DRI reports with citations:
- Vitamin A: 3000 µg RAE/day (IOM 2001)
- Iodine: 1100 µg/day (IOM 2001, WHO 2007)
- Selenium: 400 µg/day (IOM 2000)
- Zinc: 40 mg/day (IOM 2001)
- Iron: 45 mg/day (IOM 2001)

**Plausibility Guards:** Values exceeding realistic per-100g thresholds are clamped:
- Selenium: 2000 µg/100g max (Brazil nuts)
- Iodine: 5000 µg/100g max (seaweed)
- Vitamin A: 5000 µg/100g max (liver)

**Merge Policy:**
1. For micronutrients (Vitamin A, Selenium, Iodine, Folate): Prefer FDC when available
2. For other nutrients: Choose highest confidence source
3. Flag conflicts when values differ by >3× between high-confidence sources

**Clinical Citations:** All goals and ULs include full citations from:
- Institute of Medicine (IOM) Dietary Reference Intakes
- World Health Organization (WHO) guidelines
- American College of Obstetricians and Gynecologists (ACOG)

### Environment Setup

Create a `.env` file based on `.env.example`:

```bash
# Nutritionix API credentials (optional)
NUTRITIONIX_APP_ID=your_app_id
NUTRITIONIX_API_KEY=your_api_key

# Web App Configuration
NEXT_PUBLIC_MOCK_MODE=true          # Enable deterministic mock data
NEXT_PUBLIC_ENABLE_CAMERA=true      # Enable camera barcode scanning
SHARE_SECRET=your_32_char_secret    # For share link generation
SHARE_TTL_SECONDS=604800            # 7 days in seconds
```

### Mock Mode
When `NEXT_PUBLIC_MOCK_MODE=true`, the application:
- Returns deterministic sample data for all API endpoints
- Seeds a 7-day nutrition log on first load
- Works without external API keys or internet connection
- Provides consistent data for testing and demonstrations

### Camera Scanning
When `NEXT_PUBLIC_ENABLE_CAMERA=true`:
- Enables in-browser barcode scanning using device camera
- Supports EAN-13, EAN-8, UPC-A, UPC-E, and CODE-128 formats
- Requires user permission for camera access
- Falls back gracefully to manual barcode entry if disabled

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
