# 🤰 Maternal Nutrition Tracker

A TypeScript-based maternal nutrition platform providing evidence-informed guidance for conception, pregnancy, and breastfeeding. Track daily intake, compare against stage-specific nutrient targets, and receive personalized recommendations for optimal maternal and fetal health.

## Project Rules

See [AGENT_RULES.md](./AGENT_RULES.md) for canonical scope, safety, and contribution requirements.

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

### 🤰 Maternal Nutrition Mode
- **Life Stage Support**: Preconception, Trimester 1, Trimester 2, Trimester 3, and Breastfeeding stages
- **Evidence-Based Targets**: Stage-specific RDA/AI values for 10 key nutrients (Folate, Choline, Iron, Iodine, DHA, Calcium, Vitamin D, B12, Protein, Fiber)
- **Interactive Life Stage Picker**: Global selector that updates nutrient targets and persists in URL
- **Spotlight Nutrient Cards**: Prominent display of key nutrients for current stage with targets and food sources
- **Safety Badge System**: UL risk warnings, pregnancy cautions, and supplement guidance
- **Educational Disclaimers**: Clear messaging that content is educational, not medical advice

### Core Features
- **Pure TypeScript**: Framework-agnostic library that can be used in Next.js, React Native, or any TypeScript project
- **CSV/YAML Data Loading**: Load food databases and nutrition goals from standard formats
- **Weekly Aggregation**: Convert daily food logs into weekly nutrient totals
- **Gap Analysis**: Identify deficient and surplus nutrients with personalized recommendations
- **Unit Conversion**: Proper handling of mg/µg conversions with branded types for type safety
- **CLI Interface**: Command-line tool for generating reports
- **Data Importers**: HTTP clients for USDA FDC, Nutritionix, and Open Food Facts with intelligent merging
- **Barcode Support**: Look up foods by barcode (EAN/UPC) across multiple data sources
- **Web Interface**: Next.js app for searching foods, scanning barcodes, and viewing reports
- **Camera Scanning**: In-browser barcode scanning using ZXing library (EAN-13, EAN-8, UPC-A, UPC-E, CODE-128)
- **Progressive Web App (PWA)**: Installable app with offline support and service worker caching
- **Mock Mode**: Deterministic demo data for development/testing without external API dependencies
- **Safety-First Design**: Mercury warnings for pregnancy, Vitamin A UL compliance, and preference filtering

## 🤰 Maternal Nutrition Features

### Life Stage Selection
The app now prominently features a **Life Stage Picker** at the top of every page:

- **Preconception**: Planning for pregnancy
- **Trimester 1**: Weeks 1-12 (neural tube development)
- **Trimester 2**: Weeks 13-26 (rapid growth phase)
- **Trimester 3**: Weeks 27-40 (final development)
- **Breastfeeding**: Postpartum & nursing

### Key Nutrients by Stage
Each stage has tailored targets for 10 essential nutrients:

| Nutrient | Preconception | T1 | T2 | T3 | Breastfeeding |
|----------|---------------|----|----|----|---------------|
| **Folate (DFE)** | 400 mcg | 600 mcg | 600 mcg | 600 mcg | 500 mcg |
| **Choline** | 425 mg | 450 mg | 450 mg | 450 mg | 550 mg |
| **Iron** | 18 mg | 27 mg | 27 mg | 27 mg | 9 mg |
| **Iodine** | 150 mcg | 220 mcg | 220 mcg | 220 mcg | 290 mcg |
| **DHA** | 200 mg | 200 mg | 200 mg | 200 mg | 200 mg |
| **Calcium** | 1000 mg | 1000 mg | 1000 mg | 1000 mg | 1000 mg |
| **Vitamin D** | 600 IU | 600 IU | 600 IU | 600 IU | 600 IU |
| **B12** | 2.4 mcg | 2.6 mcg | 2.6 mcg | 2.6 mcg | 2.8 mcg |
| **Protein** | 46 g | 71 g | 71 g | 71 g | 71 g |
| **Fiber** | 25 g | 28 g | 28 g | 28 g | 29 g |

### Safety Features
- **UL Risk Badges**: Warnings when approaching Upper Limits (e.g., Vitamin A, Folic Acid)
- **Pregnancy Cautions**: Specific guidance for pregnancy (e.g., "Choose low-mercury fish")
- **Supplement Guidance**: Evidence-based recommendations for prenatal supplements

### URL Persistence
Life stage selection persists in the URL:
```
https://app.com/?stage=t2  # Trimester 2
https://app.com/?stage=breastfeeding  # Breastfeeding
```

## Data Model & Customization

### Maternal Nutrition Data Structure

Nutrient targets and guidance are defined in `apps/nutri-web/src/data/maternalNutrients.ts`:

```typescript
export type Stage = 'preconception' | 't1' | 't2' | 't3' | 'breastfeeding';

export interface NutrientMeta {
  id: 'folate' | 'choline' | 'iron' | 'iodine' | 'dha' | 'calcium' | 'vitamin_d' | 'b12' | 'protein' | 'fiber';
  label: string;
  spotlight: boolean; // Show in hero deck
  stages: Partial<Record<Stage, StageTarget>>;
  cautions?: string[]; // Safety warnings
  foodSources: { name: string; typicalServing: string; amount: string; }[];
}

export interface StageTarget {
  rda?: number;    // Recommended Dietary Allowance
  ai?: number;     // Adequate Intake
  ul?: number;     // Tolerable Upper Limit
  unit: Unit;      // 'mcg DFE' | 'mg' | 'IU' | 'g' | 'mcg' | '%'
  note?: string;   // Stage-specific guidance
}
```

### Updating Nutrient Targets

To modify targets for any life stage:

1. Edit `apps/nutri-web/src/data/maternalNutrients.ts`
2. Update the `rda`, `ai`, or `ul` values for specific stages
3. Add or modify `cautions` and `foodSources` arrays
4. Update the `note` field for stage-specific guidance

Example:
```typescript
stages: {
  t1: {
    rda: 600,           // Update RDA value
    ul: 1000,          // Update UL value
    unit: 'mcg DFE',
    note: 'Updated guidance for trimester 1'  // Update note
  }
}
```

### Component Architecture

- **`LifeStagePicker`**: Global stage selector with URL persistence
- **`SpotlightNutrients`**: Displays key nutrients for current stage
- **`SafetyBadge`**: Shows UL risks and pregnancy cautions
- **`EducationalOnlyNotice`**: Disclaimer component for educational content

## Try the Live Demo

🚀 **[Try the Maternal Nutrition Demo](https://your-vercel-app-url.vercel.app)**

The live demo includes:
- **Life Stage Selection**: Interactive picker for all maternal stages
- **Dynamic Nutrient Targets**: Spotlight cards update based on selected stage
- **Safety Warnings**: UL badges and pregnancy-specific cautions
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

## Local Auth & Persistence

The `nutri-web` app ships with a local SQLite database plus NextAuth credentials flow for demos.

1. `cd apps/nutri-web`
2. `cp .env.example .env.local` and update `NEXTAUTH_SECRET`
3. (Optional) set `NEXT_PUBLIC_MOCK_MODE=false` to use the database instead of localStorage
4. `pnpm --filter nutri-web exec prisma migrate deploy`
5. `pnpm --filter nutri-web dev`

Sign in with any email + password in development—the first login seeds the account automatically. When mock mode is `true`, the UI stays fully offline and ignores the database.

## Building

```bash
pnpm -w build
```

## Testing

```bash
pnpm -w test
```

To run the Playwright smoke test (requires the dev server):

```bash
pnpm --filter nutri-web test:e2e
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

## Recommendations (How it works)

The recommendations engine turns weekly reports into **actionable fixes** by suggesting specific foods and supplements to close nutrient gaps while respecting user preferences and safety guidelines.

### Core Features

- **Deficit Detection**: Identifies nutrients below 90% of weekly goals (configurable threshold)
- **Safety-First Scoring**: Penalizes suggestions that push Vitamin A or other nutrients toward UL limits
- **Preference Filtering**: Respects diet type (omnivore/pescetarian/vegetarian/vegan), allergies, and cultural preferences
- **Mercury Awareness**: Excludes high-mercury fish for pregnancy/lactation unless explicitly allowed
- **Supplement Intelligence**: Suggests supplements only when food-based fixes are insufficient
- **Deterministic Ranking**: Same inputs always produce same suggestions for reproducible results

### Safety Guards

**Vitamin A Retinol Protection**:
- Supplements containing retinol are down-weighted when Vitamin A intake ≥80% of UL
- Organ meats (liver) trigger warnings when approaching UL limits
- Beta-carotene only supplements are preferred for pregnancy

**Mercury Safety**:
- Fish categorized as "high" mercury are excluded during pregnancy/lactation
- "Moderate" mercury fish show warnings but are not excluded
- Based on FDA/EPA guidelines with species-specific mapping

**Preference Compliance**:
- Diet filters exclude incompatible foods (e.g., no meat for vegetarians)
- Allergy tags prevent suggestions containing allergens
- Cultural preferences prioritize familiar foods when available

### Recommendation Algorithm

```typescript
// Simplified scoring logic
score = Σ(weight[nutrient] × deltaTowardsGoal) -
        Σ(UL_pressure_penalties) -
        Σ(safety_penalties) -
        Σ(preference_penalties)
```

**Scoring Weights** (configurable in `data/reco/rules.yml`):
- DHA: 1.0 (highest priority for pregnancy brain development)
- Iron: 1.0 (critical for maternal health and fetal growth)
- Iodine: 0.9 (essential for thyroid function)
- Folate: 0.9 (neural tube development)
- Choline: 0.8 (brain development)
- Vitamin A: 0.8 (vision and immune function)
- Selenium: 0.7 (antioxidant)

**Safety Penalties**:
- Vitamin A UL proximity: -0.2 points per suggestion
- Mercury warnings: -0.3 points per suggestion
- Organ meat warnings: -0.2 points per suggestion

### Data Sources

**Food Catalog** (`data/reco/foods.yml`):
- Canonical foods with per-serving nutrient data
- Tags for diet compatibility, allergens, and cultural preferences
- Mercury classifications for safety filtering

**Supplement Catalog** (`data/reco/supplements.yml`):
- Common prenatal vitamins and single-nutrient supplements
- Form distinctions (retinol vs beta-carotene)
- Usage cautions and contraindications

**Mercury Database** (`data/reco/mercury.json`):
- FDA/EPA classifications: "low" | "moderate" | "high" | "avoid"
- Species-specific mappings for safety filtering

### User Preferences

**Diet Types**:
- **Omnivore**: All foods including meat, dairy, eggs
- **Pescetarian**: Includes fish/seafood but no other meat
- **Vegetarian**: No meat, includes dairy/eggs
- **Vegan**: No animal products

**Customization Options**:
- Allergies (comma-separated): "peanuts, shellfish, dairy"
- Foods to avoid: "organ_meat, high_mercury"
- Budget preference: "low" | "medium" | "high"
- Cultural preferences: "asian, mediterranean, latin"
- Maximum suggestions per day: 1-5 (default: 2)

### Integration Points

**Web Interface**:
- Settings page for preference management (auto-saves to localStorage)
- Recommendations panel in weekly reports
- "Add to Log" buttons for one-click logging

**PDF Reports**:
- "Suggested Next Steps" section with top 5 recommendations
- Safety warnings and rationale included
- Professional format suitable for clinician review

**API Endpoints**:
- `POST /api/reco` - Generate recommendations for a report
- `POST /api/report/pdf` - Include recommendations in PDF export

### Example Output

```json
{
  "id": "salmon_atlantic",
  "kind": "food",
  "display": "Atlantic salmon, cooked (3 oz)",
  "servings": 7,
  "nutrientDeltas": {
    "DHA": 8400,
    "Selenium": 280,
    "Vitamin_A_RAE": 140
  },
  "rationale": ["DHA deficit 75%", "low mercury"],
  "cautions": [],
  "score": 0.85
}
```

### Important Disclaimers

**Not Medical Advice**: Recommendations are informational tools based on nutritional science and should not replace professional healthcare guidance.

**Individual Variation**: Nutrient needs vary by individual factors including genetics, health conditions, and activity level.

**Supplement Caution**: Always consult healthcare providers before starting supplements, especially during pregnancy.

**Data Accuracy**: While we use authoritative sources (USDA, FDA), food nutrient content can vary by preparation, storage, and sourcing.

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
