/**
 * Demo seed data for the nutrition app
 * This preloads sample data when NEXT_PUBLIC_MOCK_MODE=true and no log exists
 */

export interface DemoLogEntry {
  date: string;
  food_name: string;
  servings: number;
}

export interface DemoSeedData {
  lifeStage: string;
  logEntries: DemoLogEntry[];
}

// Sample 7-day log with realistic entries for pregnancy_trimester2
export const DEMO_SEED: DemoSeedData = {
  lifeStage: 'pregnancy_trimester2',
  logEntries: [
    // Day 1
    { date: '2025-01-01', food_name: 'Salmon, Atlantic, farmed, cooked, dry heat', servings: 1 },
    { date: '2025-01-01', food_name: 'Yogurt, Greek, plain, nonfat', servings: 1.5 },

    // Day 2
    { date: '2025-01-02', food_name: 'Spinach, raw', servings: 2 },
    { date: '2025-01-02', food_name: 'Salmon, Atlantic, farmed, cooked, dry heat', servings: 0.8 },

    // Day 3
    { date: '2025-01-03', food_name: 'Yogurt, Greek, plain, nonfat', servings: 2 },
    { date: '2025-01-03', food_name: 'Wild-Caught Salmon Fillet', servings: 1 },

    // Day 4
    { date: '2025-01-04', food_name: 'Spinach, raw', servings: 1.5 },

    // Day 5
    { date: '2025-01-05', food_name: 'Salmon, Atlantic, farmed, cooked, dry heat', servings: 1.2 },
    { date: '2025-01-05', food_name: 'Yogurt, Greek, plain, nonfat', servings: 1 },

    // Day 6
    { date: '2025-01-06', food_name: 'Wild-Caught Salmon Fillet', servings: 0.9 },

    // Day 7
    { date: '2025-01-07', food_name: 'Spinach, raw', servings: 2.5 },
    { date: '2025-01-07', food_name: 'Yogurt, Greek, plain, nonfat', servings: 1.8 },
  ]
};

/**
 * Check if demo seed should be injected
 */
export function shouldInjectDemoSeed(): boolean {
  // Only inject in mock mode and when no existing log data
  if (typeof window === 'undefined') return false;

  const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
  const hasExistingLog = localStorage.getItem('nutrition-log');

  return isMockMode && !hasExistingLog;
}

/**
 * Inject demo seed data into localStorage
 */
export function injectDemoSeed(): void {
  if (!shouldInjectDemoSeed()) return;

  try {
    // Store life stage preference (use correct key)
    localStorage.setItem('nutrition-life-stage', DEMO_SEED.lifeStage);

    // Store log entries (use correct key)
    localStorage.setItem('nutrition-log', JSON.stringify(DEMO_SEED.logEntries.map(entry => ({
      food_name: entry.food_name,
      servings: entry.servings,
      date: entry.date
    }))));

    console.log('✅ Demo seed data injected for mock mode');
  } catch (error) {
    console.warn('Failed to inject demo seed:', error);
  }
}

/**
 * Client-side initialization for demo seed
 */
export function initializeDemoSeed(): void {
  if (typeof window !== 'undefined') {
    // Inject on first load
    injectDemoSeed();

    // Also inject when storage is cleared (for demo purposes)
    window.addEventListener('storage', (e) => {
      if (e.key === 'nutrition-log' && !e.newValue) {
        setTimeout(() => injectDemoSeed(), 100);
      }
    });
  }
}
