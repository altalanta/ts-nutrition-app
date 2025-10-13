'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { NormalizedFood } from 'nutri-importers'

interface SearchSectionProps {
  onAddToLog: (food: NormalizedFood, servings?: number) => void
}

export default function SearchSection({ onAddToLog }: SearchSectionProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NormalizedFood[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Load search history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nutrition-search-history')
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to parse search history:', error)
      }
    }
  }, [])

  // Save search history to localStorage
  const saveSearchHistory = useCallback((history: string[]) => {
    localStorage.setItem('nutrition-search-history', JSON.stringify(history))
  }, [])

  const addToSearchHistory = useCallback((searchQuery: string) => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) return

    setSearchHistory(prev => {
      const filtered = prev.filter(q => q !== trimmedQuery)
      const updated = [trimmedQuery, ...filtered].slice(0, 10) // Keep last 10 searches
      saveSearchHistory(updated)
      return updated
    })
  }, [saveSearchHistory])

  const handleSearch = async (searchQuery?: string) => {
    const queryToSearch = searchQuery || query
    if (!queryToSearch.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(queryToSearch)}`)
      const data = await response.json()

      if (response.ok) {
        setResults(data.foods)
        addToSearchHistory(queryToSearch)
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

  // Debounced search function
  const debouncedSearch = useMemo(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    return (searchQuery: string) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (searchQuery.trim()) {
          handleSearch(searchQuery)
        }
      }, 300)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Foods</h2>
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  debouncedSearch(e.target.value)
                  setShowHistory(true)
                }}
                onFocus={() => setShowHistory(true)}
                onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                onKeyPress={handleKeyPress}
                placeholder="Search for foods (e.g., salmon, greek yogurt)..."
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('')
                    setResults([])
                    setError(null)
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Searching...
                </div>
              ) : (
                'Search'
              )}
            </button>
          </div>

          {/* Search History Dropdown */}
          {showHistory && searchHistory.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
              {searchHistory.slice(0, 5).map((searchTerm, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setQuery(searchTerm)
                    handleSearch(searchTerm)
                    setShowHistory(false)
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">🕒</span>
                    <span className="text-sm text-gray-700">{searchTerm}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Searching food database...</span>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Found {results.length} foods
            </h3>
            <div className="text-sm text-gray-500">
              Showing top matches • Click any food to add to your log
            </div>
          </div>
          <div className="grid gap-3">
            {results.map((food, index) => (
              <div key={`${food.source}-${food.source_id}`} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{food.food_name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        food.source === 'FDC' ? 'bg-green-100 text-green-800' :
                        food.source === 'NUTRITIONIX' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {food.source}
                      </span>
                    </div>
                    {food.brand && (
                      <p className="text-sm text-gray-600 mb-1">Brand: {food.brand}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                      <span>{food.serving_name}</span>
                      {food.barcode && (
                        <span className="font-mono text-xs">Barcode: {food.barcode}</span>
                      )}
                    </div>

                    {/* Show key nutrients */}
                    {Object.entries(food.nutrients).filter(([_, value]) => (value as number) > 0).length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Key nutrients per serving:</p>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(food.nutrients)
                            .filter(([_, value]) => (value as number) > 0)
                            .slice(0, 6)
                            .map(([key, value]) => (
                              <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                                {key}: {(value as number).toFixed(1)}
                              </span>
                            ))}
                          {Object.keys(food.nutrients).length > 6 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                              +{Object.keys(food.nutrients).length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      const servings = prompt('Servings?', '1')
                      if (servings && !isNaN(parseFloat(servings))) {
                        onAddToLog(food, parseFloat(servings))
                        // Clear search after adding
                        setQuery('')
                        setResults([])
                      }
                    }}
                    className="ml-4 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Add to Log
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && query && results.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🔍</div>
          <p>No foods found for "{query}"</p>
          <p className="text-sm mt-1">Try different keywords or check spelling</p>
        </div>
      )}
    </div>
  )
}


