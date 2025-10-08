import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { rest } from 'msw'
import { setupServer } from 'msw/node'
import { fdcImporter } from '../fdc'

// Mock server for testing
const server = setupServer(
  rest.get('https://api.nal.usda.gov/fdc/v1/foods/search', (req, res, ctx) => {
    const query = req.url.searchParams.get('query')

    if (query === 'salmon') {
      return res(ctx.json({
        totalHits: 1,
        currentPage: 1,
        totalPages: 1,
        foods: [{
          fdcId: 12345,
          description: 'Atlantic Salmon',
          brandName: 'Fresh Catch',
          foodCategory: 'Fish',
          foodNutrients: [
            {
              nutrient: { id: 1005, name: 'Selenium, Se', unitName: 'µg' },
              amount: 25.0
            },
            {
              nutrient: { id: 1185, name: 'DHA', unitName: 'mg' },
              amount: 120.0
            }
          ],
          servingSize: 100,
          servingSizeUnit: 'g',
          householdServingFullText: '100g fillet',
          gtinUpc: '041196910184'
        }]
      }))
    }

    return res(ctx.json({ totalHits: 0, foods: [] }))
  }),

  rest.get('https://api.nal.usda.gov/fdc/v1/food/12345', (req, res, ctx) => {
    return res(ctx.json({
      fdcId: 12345,
      description: 'Atlantic Salmon',
      brandName: 'Fresh Catch',
      foodCategory: 'Fish',
      foodNutrients: [
        {
          nutrient: { id: 1005, name: 'Selenium, Se', unitName: 'µg' },
          amount: 25.0
        },
        {
          nutrient: { id: 1185, name: 'DHA', unitName: 'mg' },
          amount: 120.0
        }
      ],
      servingSize: 100,
      servingSizeUnit: 'g',
      householdServingFullText: '100g fillet',
      gtinUpc: '041196910184'
    }))
  })
)

describe('FDC Importer', () => {
  beforeAll(() => server.listen())
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  it('should search for foods by name', async () => {
    const results = await fdcImporter.searchByName('salmon', { limit: 5 })

    expect(results).toHaveLength(1)
    expect(results[0].food_name).toBe('Atlantic Salmon')
    expect(results[0].source).toBe('FDC')
    expect(results[0].source_id).toBe('12345')
    expect(results[0].brand).toBe('Fresh Catch')
    expect(results[0].barcode).toBe('041196910184')
    expect(results[0].serving_name).toBe('100g fillet')
    expect(results[0].nutrients.Selenium).toBe(25) // Should be converted to base units
    expect(results[0].nutrients.DHA).toBe(120) // Should be converted to base units
  })

  it('should lookup food by FDC ID', async () => {
    const result = await fdcImporter.lookupByFdcId('12345')

    expect(result).toBeTruthy()
    expect(result!.food_name).toBe('Atlantic Salmon')
    expect(result!.source).toBe('FDC')
    expect(result!.source_id).toBe('12345')
    expect(result!.nutrients.Selenium).toBe(25)
    expect(result!.nutrients.DHA).toBe(120)
  })

  it('should return null for non-existent FDC ID', async () => {
    const result = await fdcImporter.lookupByFdcId('99999')
    expect(result).toBeNull()
  })

  it('should return empty array for non-matching search', async () => {
    const results = await fdcImporter.searchByName('nonexistent', { limit: 5 })
    expect(results).toHaveLength(0)
  })
})

