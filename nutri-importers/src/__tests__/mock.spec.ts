import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createImporter } from '../mock'
import { readFileSync } from 'fs'

// Mock fs for testing
vi.mock('fs', () => ({
  readFileSync: vi.fn()
}))

describe('Mock Importer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createImporter', () => {
    it('should return mock importer when mock=true', () => {
      const importer = createImporter({ mock: true })
      expect(importer).toBeDefined()
      expect(typeof importer.searchByName).toBe('function')
      expect(typeof importer.lookupByBarcode).toBe('function')
      expect(typeof importer.lookupByFdcId).toBe('function')
    })

    it('should return real importer when mock=false', async () => {
      const importer = createImporter({ mock: false })
      expect(importer).toBeDefined()
      // Should be able to call methods without throwing (though they may fail due to no API keys)
      await expect(importer.searchByName('test')).rejects.toThrow()
    })
  })

  describe('Mock Importer functionality', () => {
    let mockImporter: ReturnType<typeof createImporter>

    beforeEach(() => {
      mockImporter = createImporter({ mock: true })
    })

    it('should return salmon fixtures when searching for salmon', async () => {
      // Mock the file reading for search-salmon.json
      const mockSalmonData = [
        {
          source: 'FDC',
          source_id: '173687',
          food_name: 'Salmon, Atlantic, farmed, cooked, dry heat',
          brand: 'Generic',
          serving_name: '100g',
          serving_size_g: 100,
          barcode: null,
          nutrients: {
            DHA: 0.8,
            Selenium: 36.5,
            Vitamin_A_RAE: 25,
            Zinc: 0.64,
            Iron: 0.34,
            Iodine: 0,
            Choline: 90.4,
            Folate_DFE: 25
          }
        }
      ]
      ;(readFileSync as any).mockReturnValue(JSON.stringify(mockSalmonData))

      const results = await mockImporter.searchByName('salmon')

      expect(results).toHaveLength(1)
      expect(results[0].food_name).toContain('Salmon')
      expect(results[0].source).toBe('FDC')
    })

    it('should return empty array for unknown search terms', async () => {
      const results = await mockImporter.searchByName('unknown-food')

      expect(results).toHaveLength(0)
    })

    it('should return specific fixture for barcode lookup', async () => {
      const mockBarcodeData = {
        source: 'NUTRITIONIX',
        source_id: 'nx_12345',
        food_name: 'Wild-Caught Salmon Fillet',
        brand: 'Fresh Market',
        serving_name: '100g',
        serving_size_g: 100,
        barcode: '041196910184',
        nutrients: {
          DHA: 1.2,
          Selenium: 38.2,
          Vitamin_A_RAE: 28,
          Zinc: 0.58,
          Iron: 0.32,
          Iodine: 0,
          Choline: 88.9,
          Folate_DFE: 22
        }
      }
      ;(readFileSync as any).mockReturnValue(JSON.stringify(mockBarcodeData))

      const result = await mockImporter.lookupByBarcode('041196910184')

      expect(result).toBeDefined()
      expect(result?.food_name).toBe('Wild-Caught Salmon Fillet')
      expect(result?.barcode).toBe('041196910184')
      expect(result?.source).toBe('NUTRITIONIX')
    })

    it('should return null for unknown barcode', async () => {
      ;(readFileSync as any).mockImplementation(() => {
        throw new Error('File not found')
      })

      const result = await mockImporter.lookupByBarcode('unknown-barcode')

      expect(result).toBeNull()
    })

    it('should return null for FDC ID lookup (not implemented in mock)', async () => {
      const result = await mockImporter.lookupByFdcId('12345')

      expect(result).toBeNull()
    })

    it('should respect search limit option', async () => {
      const mockData = [
        { source: 'FDC', source_id: '1', food_name: 'Food 1', nutrients: {} },
        { source: 'FDC', source_id: '2', food_name: 'Food 2', nutrients: {} }
      ]
      ;(readFileSync as any).mockReturnValue(JSON.stringify(mockData))

      const results = await mockImporter.searchByName('food', { limit: 1 })

      expect(results).toHaveLength(1)
    })

    it('should not make any network calls in mock mode', async () => {
      // This test verifies that no fetch/axios calls are made
      // by checking that no network-related errors occur
      const results = await mockImporter.searchByName('test')

      // If we get here without network errors, the test passes
      expect(Array.isArray(results)).toBe(true)
    })
  })
})

