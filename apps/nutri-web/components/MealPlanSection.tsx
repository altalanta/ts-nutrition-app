'use client'

import { useState, useEffect } from 'react'
import { Recipe, MealPlanSuggestion, ReportJSON, RecipeDB } from 'nutri-core'

interface MealPlanSectionProps {
  currentReport?: ReportJSON | null
  allRecipes: Recipe[]
  onAddRecipeToLog?: (recipe: Recipe, servings?: number) => void
}

export default function MealPlanSection({ currentReport, allRecipes, onAddRecipeToLog }: MealPlanSectionProps) {
  const [suggestions, setSuggestions] = useState<MealPlanSuggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentReport && allRecipes.length > 0) {
      generateSuggestions()
    }
  }, [currentReport, allRecipes])

  const generateSuggestions = async () => {
    if (!currentReport || allRecipes.length === 0) return

    setLoading(true)

    try {
      // Convert recipes array to RecipeDB format
      const recipeDB: RecipeDB = {}
      allRecipes.forEach(recipe => {
        recipeDB[recipe.id] = recipe
      })

      // Mock foodDB - in a real app, this would come from the actual food database
      const foodDB = {
        'Atlantic salmon': { food_name: 'Atlantic salmon', serving_size_g: 100, DHA_mg: 120, Selenium_µg: 25, Vitamin_A_RAE_µg: 0, Zinc_mg: 1.2, Iron_mg: 2.1, Iodine_µg: 0, Choline_mg: 85, Folate_DFE_µg: 15 },
        'Spinach': { food_name: 'Spinach', serving_size_g: 30, DHA_mg: 0, Selenium_µg: 1, Vitamin_A_RAE_µg: 141, Zinc_mg: 0.2, Iron_mg: 0.8, Iodine_µg: 0, Choline_mg: 18, Folate_DFE_µg: 58 },
        'Large egg': { food_name: 'Large egg', serving_size_g: 50, DHA_mg: 0, Selenium_µg: 15, Vitamin_A_RAE_µg: 74, Zinc_mg: 0.6, Iron_mg: 0.9, Iodine_µg: 25, Choline_mg: 147, Folate_DFE_µg: 22 },
        'Black beans': { food_name: 'Black beans', serving_size_g: 86, DHA_mg: 0, Selenium_µg: 2, Vitamin_A_RAE_µg: 0, Zinc_mg: 1.0, Iron_mg: 1.8, Iodine_µg: 0, Choline_mg: 45, Folate_DFE_µg: 128 },
        'Greek yogurt': { food_name: 'Greek yogurt', serving_size_g: 245, DHA_mg: 0, Selenium_µg: 25, Vitamin_A_RAE_µg: 0, Zinc_mg: 1.5, Iron_mg: 0.2, Iodine_µg: 0, Choline_mg: 40, Folate_DFE_µg: 20 },
        'Fortified cereal': { food_name: 'Fortified cereal', serving_size_g: 30, DHA_mg: 0, Selenium_µg: 20, Vitamin_A_RAE_µg: 150, Zinc_mg: 3.0, Iron_mg: 4.5, Iodine_µg: 0, Choline_mg: 25, Folate_DFE_µg: 100 },
        'Seaweed (nori)': { food_name: 'Seaweed (nori)', serving_size_g: 3, DHA_mg: 0, Selenium_µg: 0.9, Vitamin_A_RAE_µg: 9, Zinc_mg: 0.1, Iron_mg: 0.2, Iodine_µg: 42, Choline_mg: 0, Folate_DFE_µg: 10 },
        'Whole milk': { food_name: 'Whole milk', serving_size_g: 240, DHA_mg: 0, Selenium_µg: 3, Vitamin_A_RAE_µg: 149, Zinc_mg: 1.0, Iron_mg: 0.1, Iodine_µg: 0, Choline_mg: 38, Folate_DFE_µg: 12 }
      }

      // Mock schema - in a real app, this would come from the actual schema
      const schema = {
        nutrients: {
          DHA: { unit: 'mg' as const, aliases: ['docosahexaenoic acid', 'n-3 DHA'] },
          Selenium: { unit: 'µg' as const, aliases: ['Se'] },
          Vitamin_A_RAE: { unit: 'µg' as const, aliases: ['VitA_RAE', 'Retinol Activity Equivalents'] },
          Zinc: { unit: 'mg' as const, aliases: ['Zn'] },
          Iron: { unit: 'mg' as const, aliases: ['Fe'] },
          Iodine: { unit: 'µg' as const, aliases: ['I'] },
          Choline: { unit: 'mg' as const, aliases: ['choline'] },
          Folate_DFE: { unit: 'µg' as const, aliases: ['folate', 'DFE'] }
        }
      }

      // Use the suggestRecipesForGaps function
      const { suggestRecipesForGaps } = await import('nutri-core')
      const mealSuggestions = suggestRecipesForGaps(currentReport, recipeDB, foodDB, schema, 3)

      setSuggestions(mealSuggestions)
    } catch (error) {
      console.error('Error generating meal suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!currentReport) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <div className="text-blue-600 text-4xl mb-2">🎯</div>
        <h3 className="font-medium text-blue-900 mb-2">Personalized Meal Planning</h3>
        <p className="text-blue-700">Generate a nutrition report to get personalized recipe suggestions based on your nutritional gaps.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-blue-600 text-2xl">🎯</div>
          <div>
            <h3 className="font-semibold text-blue-900">Smart Meal Suggestions</h3>
            <p className="text-sm text-blue-700">Based on your current nutritional gaps</p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-blue-700">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Analyzing your nutrition data...</span>
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Recommended for You</h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <h5 className="font-medium text-gray-900">{suggestion.recipe.name}</h5>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                    {Math.round(suggestion.priority * 100)}% match
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-3">{suggestion.reason}</p>

                {suggestion.nutritional_benefit.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-700 mb-1">Helps with:</p>
                    <div className="flex flex-wrap gap-1">
                      {suggestion.nutritional_benefit.map(nutrient => (
                        <span key={nutrient} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {nutrient}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {suggestion.recipe.category}
                  </span>
                  {suggestion.recipe.prep_time_minutes && (
                    <span className="flex items-center gap-1">
                      <span>⏱️</span>
                      {suggestion.recipe.prep_time_minutes}min
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      alert(`Recipe: ${suggestion.recipe.name}\n\n${suggestion.recipe.description || 'No description available.'}\n\nIngredients: ${suggestion.recipe.ingredients.length} items`)
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    View Recipe
                  </button>

                  {onAddRecipeToLog && (
                    <button
                      onClick={() => {
                        const servings = prompt('Servings?', '1')
                        if (servings && !isNaN(parseFloat(servings))) {
                          onAddRecipeToLog(suggestion.recipe, parseFloat(servings))
                        }
                      }}
                      className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
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

      {suggestions.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">✅</div>
          <p>No specific suggestions needed!</p>
          <p className="text-sm mt-1">Your nutrition is well-balanced. Browse all recipes for variety.</p>
        </div>
      )}
    </div>
  )
}

