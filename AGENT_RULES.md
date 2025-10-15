# Agent Rules (ts-nutrition-app)

## Scope & Priorities
1) **Safety-first nutrition** for preconception → pregnancy (T1–T3) → lactation → interpregnancy.
2) Single source of truth: `data/*.yml` — goals, ULs, plausibility, citations. **Never** hardcode clinical numbers in code.
3) **Deterministic** outputs (tests + goldens). Mock mode must be fully offline and stable.

## Data & Merging Policy
- Prefer **FDC** for safety-critical micros; fallback by **confidence-weighted** sources (Nutritionix, OFF).  
- Clamp implausible per-100g values; flag conflicts; surface **provenance** & **confidence** in reports.
- Vitamin A: use **RAE** only; IU not converted; near-UL → warn.

## Architecture Rules
- **No Node APIs in client bundles.** All `fs/yaml` in server code or API routes. `nutri-core/node` is the only entry with loaders.
- Web UI uses server routes for file-backed data; client uses JSON only.
- Keep `nutri-core` pure and framework-agnostic.

## Testing & Build
- All external HTTP mocked via **MSW**.  
- CI must run: `pnpm -w build`, unit tests, and Playwright smoke (web) in mock mode.
- Accept PRs only if typechecks pass (`tsc --noEmit`) and coverage doesn’t regress.

## Privacy & Sharing
- No PHI in logs by default.  
- Share links are signed, time-limited; audit logs store **hashed** IP only.

## UX Defaults
- On first run in mock mode: seed demo week, show hints.  
- Always show **UL badges** and **provenance chips** on report rows.

## Recommendations (if implemented)
- Foods first, supplements second; respect prefs (diet, allergies, avoid tags) and mercury table; refuse risky items near UL.

## Coding Style
- TypeScript strict; no `any` in exported types.  
- Prefer `Record<NutrientKey, T>` with `NUTRIENT_KEYS` constants.  
- Zod for parsing untyped inputs.

## Deployment & Config
- Vercel demo uses `NEXT_PUBLIC_MOCK_MODE=true`.  
- Secrets via env; never committed.

## Commit & PR Hygiene
- Conventional commits (`feat:`, `fix:`, `chore:`).  
- Link PRs to issues; include screenshots for UI changes.
