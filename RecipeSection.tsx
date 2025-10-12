'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Recipe, NutrientKey, NUTRIENT_KEYS, ReportJSON } from 'nutri-core'
import MealPlanSection from './MealPlanSection'

interface RecipeSectionProps {
  onAddRecipeToLog?: (recipe: Recipe, servings?: number) => void
  currentReport?: ReportJSON | null
}

interface RecipeResponse {
  recipes: Recipe[]
  total: number
}

export default function RecipeSection({ onAddRecipeToLog, currentReport }: RecipeSectionProps) {
  const [query, setQuery] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [maxPrepTime, setMaxPrepTime] = useState<number>(60)
  const [showFilters, setShowFilters] = useState(false)

  // Available categories from sample data
  const categories = [
    'All',
    'Breakfast',
    'Main Dishes',
    'Beverages'
  ]

  // Load recipes on mount and when filters change
  useEffect(() => {
    loadRecipes()
  }, [query, selectedCategory, maxPrepTime])

  const loadRecipes = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (query.trim()) params.append('q', query.trim())
      if (selectedCategory && selectedCategory !== 'All') params.append('category', selectedCategory)
      if (maxPrepTime < 60) params.append('maxPrepTime', maxPrepTime.toString())

      const response = await fetch(`/api/recipes?${params}`)
      const data: RecipeResponse = await response.json()

      if (response.ok) {
        setRecipes(data.recipes)
      } else {
        setError(data.total?.toString() || 'Failed to load recipes')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      loadRecipes()
    }
  }

  // Debounced search function
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout
    return (searchQuery: string) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (searchQuery.trim()) {
          // Update query state, effect will trigger loadRecipes
        }
      }, 300)
    }
  }, [])

  const clearFilters = () => {
    setQuery('')
    setSelectedCategory('')
    setMaxPrepTime(60)
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
  }

  return (
    <div className="space-y-6">
      {/* Meal Planning Suggestions */}
      <MealPlanSection
        currentReport={currentReport}
        allRecipes={recipes}
        onAddRecipeToLog={onAddRecipeToLog}
      />

      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Browse All Recipes</h2>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  debouncedSearch(e.target.value)
                }}
                onKeyPress={handleKeyPress}
                placeholder="Search recipes (e.g., salmon, iron-rich)..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Filters {showFilters ? '▼' : '▶'}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat === 'All' ? '' : cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Prep Time: {formatTime(maxPrepTime)}
                </label>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={maxPrepTime}
                  onChange={(e) => setMaxPrepTime(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>5min</span>
                  <span>2hrs</span>
                </div>
              </div>

              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
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
            <span>Loading recipes...</span>
          </div>
        </div>
      )}

      {recipes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} found
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-lg mb-1">{recipe.name}</h4>
                    {recipe.description && (
                      <p className="text-sm text-gray-600 mb-2">{recipe.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {recipe.category}
                  </span>
                  {recipe.prep_time_minutes && (
                    <span className="flex items-center gap-1">
                      <span>⏱️</span>
                      {formatTime(recipe.prep_time_minutes)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <span>🍽️</span>
                    {recipe.servings} serving{recipe.servings !== 1 ? 's' : ''}
                  </span>
                </div>

                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {recipe.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        {tag}
                      </span>
                    ))}
                    {recipe.tags.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                        +{recipe.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Show key nutrients */}
                {recipe.nutrition_per_serving && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Key nutrients per serving:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(recipe.nutrition_per_serving)
                        .filter(([_, value]) => value > 0)
                        .slice(0, 4)
                        .map(([key, value]) => (
                          <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-medium">
                            {key}: {value.toFixed(1)}
                          </span>
                        ))}
                      {Object.keys(recipe.nutrition_per_serving).length > 4 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          +more nutrients
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      // For now, just show recipe details - in a real app, this would open a modal
                      alert(`Recipe: ${recipe.name}\n\nIngredients: ${recipe.ingredients.length} items\n\nInstructions available in full view`)
                    }}
                    className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    View Recipe
                  </button>

                  {onAddRecipeToLog && (
                    <button
                      onClick={() => {
                        const servings = prompt('Servings?', '1')
                        if (servings && !isNaN(parseFloat(servings))) {
                          onAddRecipeToLog(recipe, parseFloat(servings))
                        }
                      }}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Add to Log
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && query && recipes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🍳</div>
          <p>No recipes found for "{query}"</p>
          <p className="text-sm mt-1">Try different keywords or adjust your filters</p>
        </div>
      )}
    </div>
  )
}
