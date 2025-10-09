import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as searchHandler } from '../app/api/search/route'
import { GET as barcodeHandler } from '../app/api/barcode/route'

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NEXT_PUBLIC_MOCK_MODE: 'true'
  }
}))

// Mock the mock-mode module
vi.mock('../lib/mock-mode', () => ({
  searchFoods: vi.fn(),
  lookupBarcode: vi.fn()
}))

describe('API Routes with Mock Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('/api/search', () => {
    it('should return search results in mock mode', async () => {
      const mockResults = [
        {
          source: 'FDC',
          source_id: '173687',
          food_name: 'Salmon, Atlantic, farmed, cooked, dry heat',
          brand: 'Generic',
          nutrients: {
            DHA: 0.8,
            Selenium: 36.5,
            Vitamin_A_RAE: 25
          }
        }
      ]

      const { searchFoods } = await import('../lib/mock-mode')
      ;(searchFoods as any).mockResolvedValue(mockResults)

      const request = new NextRequest('http://localhost:3000/api/search?q=salmon')
      const response = await searchHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.foods).toEqual(mockResults)
      expect(searchFoods).toHaveBeenCalledWith('salmon')
    })

    it('should return error for missing query parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/search')
      const response = await searchHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Query parameter "q" is required')
    })

    it('should handle search errors gracefully', async () => {
      const { searchFoods } = await import('../lib/mock-mode')
      ;(searchFoods as any).mockRejectedValue(new Error('Search failed'))

      const request = new NextRequest('http://localhost:3000/api/search?q=salmon')
      const response = await searchHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to search foods')
    })
  })

  describe('/api/barcode', () => {
    it('should return barcode lookup results in mock mode', async () => {
      const mockResult = {
        source: 'NUTRITIONIX',
        source_id: 'nx_12345',
        food_name: 'Wild-Caught Salmon Fillet',
        brand: 'Fresh Market',
        barcode: '041196910184',
        nutrients: {
          DHA: 1.2,
          Selenium: 38.2,
          Vitamin_A_RAE: 28
        }
      }

      const { lookupBarcode } = await import('../lib/mock-mode')
      ;(lookupBarcode as any).mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost:3000/api/barcode?ean=041196910184')
      const response = await barcodeHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.food).toEqual(mockResult)
      expect(lookupBarcode).toHaveBeenCalledWith('041196910184')
    })

    it('should return error for missing barcode parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/barcode')
      const response = await barcodeHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Barcode parameter "ean" is required')
    })

    it('should return 404 for not found barcode', async () => {
      const { lookupBarcode } = await import('../lib/mock-mode')
      ;(lookupBarcode as any).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/barcode?ean=unknown')
      const response = await barcodeHandler(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Food not found')
    })

    it('should handle barcode lookup errors gracefully', async () => {
      const { lookupBarcode } = await import('../lib/mock-mode')
      ;(lookupBarcode as any).mockRejectedValue(new Error('Lookup failed'))

      const request = new NextRequest('http://localhost:3000/api/barcode?ean=041196910184')
      const response = await barcodeHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to lookup barcode')
    })
  })
})

