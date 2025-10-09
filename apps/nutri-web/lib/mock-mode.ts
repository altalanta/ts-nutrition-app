import { createImporter } from 'nutri-importers';

/**
 * Check if mock mode is enabled
 */
export function isMockMode(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_MODE === 'true';
}

/**
 * Get the appropriate importer based on mock mode setting
 */
export function getImporter() {
  return createImporter({ mock: isMockMode() });
}

/**
 * Wrapper for searchByName that uses mock mode if enabled
 */
export async function searchFoods(query: string, options = {}) {
  const importer = getImporter();
  return importer.searchByName(query, options);
}

/**
 * Wrapper for lookupByBarcode that uses mock mode if enabled
 */
export async function lookupBarcode(barcode: string, options = {}) {
  const importer = getImporter();
  return importer.lookupByBarcode(barcode, options);
}

