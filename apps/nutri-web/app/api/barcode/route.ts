import { NextRequest, NextResponse } from 'next/server'
import { lookupByBarcode } from 'nutri-importers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const barcode = searchParams.get('ean')

  if (!barcode) {
    return NextResponse.json({ error: 'Barcode parameter "ean" is required' }, { status: 400 })
  }

  try {
    const food = await lookupByBarcode(barcode)

    if (!food) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 })
    }

    return NextResponse.json({ food })
  } catch (error) {
    console.error('Barcode lookup API error:', error)
    return NextResponse.json(
      { error: 'Failed to lookup barcode' },
      { status: 500 }
    )
  }
}
