import { NextRequest, NextResponse } from 'next/server'
import { searchByName, createImporter } from 'nutri-importers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
  }

  // Check if mock mode is enabled
  const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

  try {
    let results

    if (isMockMode) {
      // Use mock importer for deterministic responses
      const importer = createImporter({ mock: true })
      results = await importer.searchByName(query, { limit: 20 })

      // If no mock data found, return sample foods
      if (!results || results.length === 0) {
        results = [
          {
            source: 'MOCK',
            source_id: 'mock_salmon',
            food_name: 'Atlantic Salmon Fillet',
            brand: 'Fresh Market',
            serving_name: '100g',
            serving_size_g: 100,
            barcode: null,
            nutrients: {
              'DHA': 1.2,
              'Selenium': 38.2,
              'Vitamin_A_RAE': 28,
              'Zinc': 0.58,
              'Iron': 0.32,
              'Iodine': 0,
              'Choline': 88.9,
              'Folate_DFE': 22,
              'Protein': 20.4,
              'Fat': 12.4,
              'Energy': 208
            }
          },
          {
            source: 'MOCK',
            source_id: 'mock_spinach',
            food_name: 'Fresh Spinach',
            brand: 'Organic Farms',
            serving_name: '100g',
            serving_size_g: 100,
            barcode: null,
            nutrients: {
              'Vitamin_A_RAE': 469,
              'Vitamin_C': 28.1,
              'Folate_DFE': 194,
              'Iron': 2.71,
              'Magnesium': 79,
              'Potassium': 558,
              'Fiber': 2.2,
              'Protein': 2.9,
              'Energy': 23
            }
          }
        ]
      }
    } else {
      results = await searchByName(query, { limit: 20 })
    }

    return NextResponse.json({ foods: results })
  } catch (error) {
    console.error('Search API error:', error)

    // In mock mode, return a consistent error response
    if (isMockMode) {
      return NextResponse.json(
        { error: 'Mock search failed', foods: [] },
        { status: 200 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to search foods' },
      { status: 500 }
    )
  }
}
