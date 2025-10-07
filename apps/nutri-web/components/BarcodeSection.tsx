'use client'

import { useState } from 'react'
import { NormalizedFood } from 'nutri-importers'

interface BarcodeSectionProps {
  onAddToLog: (food: NormalizedFood, servings?: number) => void
}

export default function BarcodeSection({ onAddToLog }: BarcodeSectionProps) {
  const [barcode, setBarcode] = useState('')
  const [result, setResult] = useState<NormalizedFood | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLookup = async () => {
    if (!barcode.trim()) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(`/api/barcode?ean=${encodeURIComponent(barcode)}`)
      const data = await response.json()

      if (response.ok) {
        setResult(data.food)
      } else {
        setError(data.error || 'Barcode lookup failed')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLookup()
    }
  }

  const handleAddToLog = () => {
    if (result) {
      const servings = prompt('Servings?', '1')
      if (servings) {
        onAddToLog(result, parseFloat(servings))
        setResult(null)
        setBarcode('')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Scan Barcode</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter barcode (EAN/UPC)..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleLookup}
            disabled={loading || !barcode.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Looking up...' : 'Lookup'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Enter a barcode number (e.g., 04963406 for a product)
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Product Found</h3>

          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <span className="ml-2">{result.food_name}</span>
            </div>

            {result.brand && (
              <div>
                <span className="font-medium text-gray-700">Brand:</span>
                <span className="ml-2">{result.brand}</span>
              </div>
            )}

            {result.barcode && (
              <div>
                <span className="font-medium text-gray-700">Barcode:</span>
                <span className="ml-2">{result.barcode}</span>
              </div>
            )}

            <div>
              <span className="font-medium text-gray-700">Source:</span>
              <span className="ml-2">{result.source} ({result.source_id})</span>
            </div>

            <div>
              <span className="font-medium text-gray-700">Serving:</span>
              <span className="ml-2">{result.serving_name}</span>
            </div>

            {/* Show nutrients */}
            {Object.entries(result.nutrients).filter(([_, value]) => value > 0).length > 0 && (
              <div>
                <span className="font-medium text-gray-700">Key nutrients:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(result.nutrients)
                    .filter(([_, value]) => value > 0)
                    .map(([key, value]) => (
                      <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">
                        {key}: {value.toFixed(1)}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleAddToLog}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add to Log
            </button>
            <button
              onClick={() => {
                setResult(null)
                setBarcode('')
              }}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
