'use client'

import { useState } from 'react'
import { NormalizedFood } from 'nutri-importers'

interface SearchSectionProps {
  onAddToLog: (food: NormalizedFood, servings?: number) => void
}

export default function SearchSection({ onAddToLog }: SearchSectionProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NormalizedFood[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (response.ok) {
        setResults(data.foods)
      } else {
        setError(data.error || 'Search failed')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Foods</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for foods (e.g., salmon, greek yogurt)..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Found {results.length} foods
          </h3>
          <div className="grid gap-4">
            {results.map((food, index) => (
              <div key={`${food.source}-${food.source_id}`} className="bg-white p-4 rounded-lg shadow border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{food.food_name}</h4>
                    {food.brand && (
                      <p className="text-sm text-gray-600">Brand: {food.brand}</p>
                    )}
                    {food.barcode && (
                      <p className="text-sm text-gray-600">Barcode: {food.barcode}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Source: {food.source} • {food.serving_name}
                    </p>

                    {/* Show key nutrients */}
                    {Object.entries(food.nutrients).filter(([_, value]) => value > 0).length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Key nutrients:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Object.entries(food.nutrients)
                            .filter(([_, value]) => value > 0)
                            .slice(0, 4)
                            .map(([key, value]) => (
                              <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                {key}: {value.toFixed(1)}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      const servings = prompt('Servings?', '1')
                      if (servings) {
                        onAddToLog(food, parseFloat(servings))
                      }
                    }}
                    className="ml-4 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                  >
                    Add to Log
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
