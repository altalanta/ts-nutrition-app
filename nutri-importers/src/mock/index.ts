import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { NormalizedFood, SearchOptions, BarcodeOptions, DataSource } from '../types';
import { NutrientKey } from 'nutri-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Mock implementation of importers for deterministic testing
 */
class MockImporter {
  private fixturesPath: string;

  constructor() {
    this.fixturesPath = join(__dirname, 'fixtures');
  }

  /**
   * Search for foods by name (mock implementation)
   */
  async searchByName(query: string, options: SearchOptions = {}): Promise<NormalizedFood[]> {
    const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Simple keyword matching for demo fixtures
    const matchingFiles = [
      normalizedQuery.includes('salmon') && 'search-salmon.json',
      normalizedQuery.includes('yogurt') && 'search-yogurt.json',
      normalizedQuery.includes('spinach') && 'search-spinach.json',
    ].filter(Boolean) as string[];

    if (matchingFiles.length === 0) {
      return [];
    }

    const results: NormalizedFood[] = [];
    for (const file of matchingFiles) {
      try {
        const filePath = join(this.fixturesPath, file);
        const content = readFileSync(filePath, 'utf8');
        const foods: NormalizedFood[] = JSON.parse(content);
        results.push(...foods);
      } catch (error) {
        console.warn(`Failed to load mock fixture ${file}:`, error);
      }
    }

    // Apply limit if specified
    const limit = options.limit || results.length;
    return results.slice(0, limit);
  }

  /**
   * Look up food by barcode (mock implementation)
   */
  async lookupByBarcode(barcode: string, options: BarcodeOptions = {}): Promise<NormalizedFood | null> {
    try {
      const fileName = `barcode-${barcode}.json`;
      const filePath = join(this.fixturesPath, fileName);
      const content = readFileSync(filePath, 'utf8');
      const food: NormalizedFood = JSON.parse(content);
      return food;
    } catch (error) {
      return null;
    }
  }

  /**
   * Look up food by FDC ID (mock implementation)
   */
  async lookupByFdcId(fdcId: string): Promise<NormalizedFood | null> {
    // For mock mode, we'll simulate this by searching for foods that might match
    // In a real implementation, you'd have a fixture for this too
    return null;
  }
}

/**
 * Factory function to create importers based on configuration
 */
export function createImporter({ mock }: { mock: boolean }) {
  if (mock) {
    return new MockImporter();
  }

  // For non-mock mode, return a combined interface that uses the real importers
  return {
    async searchByName(query: string, options: SearchOptions = {}) {
      const { searchByName: realSearch } = await import('../index');
      return realSearch(query, options);
    },

    async lookupByBarcode(barcode: string, options: BarcodeOptions = {}) {
      const { lookupByBarcode: realLookup } = await import('../index');
      return realLookup(barcode, options);
    },

    async lookupByFdcId(fdcId: string) {
      const { lookupByFdcId: realLookup } = await import('../index');
      return realLookup(fdcId);
    }
  };
}

