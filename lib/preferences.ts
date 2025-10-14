import type { UserPreferences } from 'nutri-core';

export type RecommendationPreferences = NonNullable<UserPreferences['recommendations']>;

const PREFERENCES_STORAGE_KEY = 'nutri.recommendation_preferences';
const DEFAULT_PREFERENCES: RecommendationPreferences = {
  enabled: true,
  diet: 'omnivore',
  allergies: [],
  avoid_tags: [],
  budget: 'medium',
  cultural_tags: [],
  max_additions_per_day: 2
};

/**
 * Load recommendation preferences from localStorage
 */
export function loadRecommendationPreferences(): RecommendationPreferences {
  try {
    const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to handle missing fields from older versions
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch (error) {
    console.warn('Failed to load recommendation preferences:', error);
  }

  return DEFAULT_PREFERENCES;
}

/**
 * Save recommendation preferences to localStorage
 */
export function saveRecommendationPreferences(prefs: RecommendationPreferences): void {
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.warn('Failed to save recommendation preferences:', error);
  }
}

/**
 * Reset recommendation preferences to defaults
 */
export function resetRecommendationPreferences(): void {
  try {
    localStorage.removeItem(PREFERENCES_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to reset recommendation preferences:', error);
  }
}

/**
 * Convert recommendation preferences to the format expected by the reco engine
 */
export function preferencesToRecoPrefs(prefs: RecommendationPreferences) {
  return {
    diet: prefs.diet,
    allergies: prefs.allergies,
    avoid_tags: prefs.avoid_tags,
    budget: prefs.budget,
    cultural_tags: prefs.cultural_tags,
    max_additions_per_day: prefs.max_additions_per_day
  };
}

/**
 * Merge recommendation preferences into full user preferences
 */
export function mergePreferencesWithRecommendations(
  userPrefs: UserPreferences,
  recoPrefs: RecommendationPreferences
): UserPreferences {
  return {
    ...userPrefs,
    recommendations: recoPrefs
  };
}

/**
 * Extract recommendation preferences from full user preferences
 */
export function extractRecommendationPreferences(
  userPrefs: UserPreferences
): RecommendationPreferences {
  return userPrefs.recommendations || DEFAULT_PREFERENCES;
}
