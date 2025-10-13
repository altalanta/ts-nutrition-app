import { NextRequest, NextResponse } from 'next/server'
import { lookupByBarcode, createImporter } from 'nutri-importers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const barcode = searchParams.get('ean')

  if (!barcode) {
    return NextResponse.json({ error: 'Barcode parameter "ean" is required' }, { status: 400 })
  }

  // Check if mock mode is enabled
  const isMockMode = process.env.NEXT_PUBLIC_MOCK_MODE === 'true'

  try {
    let food

    if (isMockMode) {
      // Use mock importer for deterministic responses
      const importer = createImporter({ mock: true })
      food = await importer.lookupByBarcode(barcode)

      // If no mock data found, return a sample food with the barcode
      if (!food) {
        food = {
          source: 'MOCK',
          source_id: 'mock_' + barcode,
          food_name: 'Sample Product',
          brand: 'Mock Brand',
          serving_name: '100g',
          serving_size_g: 100,
          barcode: barcode,
          nutrients: {
            'Energy': 250,
            'Protein': 15,
            'Carbohydrates': 30,
            'Fat': 8,
            'Fiber': 3,
            'Sodium': 400
          }
        }
      }
    } else {
      food = await lookupByBarcode(barcode)

      if (!food) {
        return NextResponse.json({ error: 'Food not found' }, { status: 404 })
      }
    }

    return NextResponse.json({ food })
  } catch (error) {
    console.error('Barcode lookup API error:', error)

    // In mock mode, return a consistent error response
    if (isMockMode) {
      return NextResponse.json(
        { error: 'Mock barcode lookup failed' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to lookup barcode' },
      { status: 500 }
    )
  }
}
