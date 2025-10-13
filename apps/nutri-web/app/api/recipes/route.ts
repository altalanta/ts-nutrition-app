import { NextRequest, NextResponse } from 'next/server'
import { RecipeDB } from 'nutri-core'

// Sample recipe database - in a real app, this would come from a database
const sampleRecipes: RecipeDB = {
  "salmon-spinach-salad": {
    "id": "salmon-spinach-salad",
    "name": "Grilled Salmon Spinach Salad",
    "description": "A nutrient-dense salad featuring omega-3 rich salmon and iron-packed spinach",
    "category": "Main Dishes",
    "prep_time_minutes": 15,
    "cook_time_minutes": 10,
    "servings": 2,
    "ingredients": [
      {
        "food_name": "Atlantic salmon",
        "amount_g": 200
      },
      {
        "food_name": "Spinach",
        "amount_g": 120
      },
      {
        "food_name": "Large egg",
        "servings": 2
      },
      {
        "food_name": "Black beans",
        "servings": 0.5
      }
    ],
    "instructions": [
      "Grill salmon fillets for 4-5 minutes per side until cooked through",
      "Boil eggs for 8-10 minutes, then cool and slice",
      "Wash spinach thoroughly and pat dry",
      "Combine all ingredients in a large bowl",
      "Season with olive oil, lemon juice, salt, and pepper"
    ],
    "tags": ["high-protein", "omega-3", "iron-rich", "quick-meal"],
    "nutrition_per_serving": {
      "DHA": 120,
      "Selenium": 21.5,
      "Vitamin_A_RAE": 70.5,
      "Zinc": 2.3,
      "Iron": 3.2,
      "Iodine": 1.05,
      "Choline": 147.5,
      "Folate_DFE": 109
    },
    "source": "Nutrition Tracker Demo",
    "url": "https://example.com/salmon-salad"
  },
  "greek-yogurt-parfait": {
    "id": "greek-yogurt-parfait",
    "name": "Greek Yogurt Berry Parfait",
    "description": "A protein-rich breakfast parfait with probiotics and antioxidants",
    "category": "Breakfast",
    "prep_time_minutes": 5,
    "cook_time_minutes": 0,
    "servings": 1,
    "ingredients": [
      {
        "food_name": "Greek yogurt",
        "servings": 1
      },
      {
        "food_name": "Fortified cereal",
        "servings": 0.5
      },
      {
        "food_name": "Spinach",
        "amount_g": 30
      }
    ],
    "instructions": [
      "Layer Greek yogurt in a glass or bowl",
      "Add a handful of mixed berries",
      "Sprinkle with fortified cereal for crunch",
      "Top with a few spinach leaves for extra nutrients",
      "Enjoy immediately"
    ],
    "tags": ["high-protein", "probiotic", "quick-breakfast", "antioxidant-rich"],
    "nutrition_per_serving": {
      "DHA": 0,
      "Selenium": 22.5,
      "Vitamin_A_RAE": 75,
      "Zinc": 2.25,
      "Iron": 2.55,
      "Iodine": 0.1,
      "Choline": 20,
      "Folate_DFE": 79
    },
    "source": "Nutrition Tracker Demo",
    "url": "https://example.com/yogurt-parfait"
  },
  "iron-rich-stir-fry": {
    "id": "iron-rich-stir-fry",
    "name": "Iron-Rich Vegetable Stir Fry with Eggs",
    "description": "A quick stir-fry loaded with iron from spinach and eggs, plus vitamin C for absorption",
    "category": "Main Dishes",
    "prep_time_minutes": 10,
    "cook_time_minutes": 10,
    "servings": 2,
    "ingredients": [
      {
        "food_name": "Spinach",
        "amount_g": 200
      },
      {
        "food_name": "Large egg",
        "servings": 3
      },
      {
        "food_name": "Black beans",
        "servings": 1
      }
    ],
    "instructions": [
      "Heat oil in a large wok or skillet",
      "Add spinach and stir-fry for 2-3 minutes until wilted",
      "Add black beans and cook for another 2 minutes",
      "Push ingredients to one side and scramble eggs in the pan",
      "Combine everything and season with garlic, ginger, and soy sauce",
      "Serve hot"
    ],
    "tags": ["iron-rich", "high-protein", "vegetarian", "quick-meal"],
    "nutrition_per_serving": {
      "DHA": 0,
      "Selenium": 13.5,
      "Vitamin_A_RAE": 107,
      "Zinc": 2.2,
      "Iron": 5.4,
      "Iodine": 12.5,
      "Choline": 220.5,
      "Folate_DFE": 244
    },
    "source": "Nutrition Tracker Demo",
    "url": "https://example.com/iron-stirfry"
  },
  "seaweed-salmon-bowl": {
    "id": "seaweed-salmon-bowl",
    "name": "Iodine-Rich Salmon Seaweed Bowl",
    "description": "A mineral-rich bowl featuring iodine from seaweed and DHA from salmon",
    "category": "Main Dishes",
    "prep_time_minutes": 10,
    "cook_time_minutes": 8,
    "servings": 2,
    "ingredients": [
      {
        "food_name": "Atlantic salmon",
        "amount_g": 150
      },
      {
        "food_name": "Seaweed (nori)",
        "servings": 4
      },
      {
        "food_name": "Brown rice",
        "amount_g": 100
      },
      {
        "food_name": "Spinach",
        "amount_g": 60
      }
    ],
    "instructions": [
      "Cook brown rice according to package directions",
      "Grill or bake salmon until cooked through",
      "Toast nori sheets lightly",
      "Arrange rice in bowls, top with flaked salmon",
      "Add spinach and crumbled nori sheets",
      "Season with sesame oil and rice vinegar"
    ],
    "tags": ["iodine-rich", "omega-3", "mineral-rich", "bowl-meal"],
    "nutrition_per_serving": {
      "DHA": 90,
      "Selenium": 15.45,
      "Vitamin_A_RAE": 36,
      "Zinc": 1.85,
      "Iron": 2.8,
      "Iodine": 21.1,
      "Choline": 42.5,
      "Folate_DFE": 49
    },
    "source": "Nutrition Tracker Demo",
    "url": "https://example.com/seaweed-bowl"
  },
  "prenatal-power-smoothie": {
    "id": "prenatal-power-smoothie",
    "name": "Prenatal Power Smoothie",
    "description": "A nutrient-dense smoothie perfect for pregnancy nutrition",
    "category": "Beverages",
    "prep_time_minutes": 5,
    "cook_time_minutes": 0,
    "servings": 1,
    "ingredients": [
      {
        "food_name": "Greek yogurt",
        "servings": 0.5
      },
      {
        "food_name": "Spinach",
        "amount_g": 60
      },
      {
        "food_name": "Fortified cereal",
        "servings": 0.25
      },
      {
        "food_name": "Whole milk",
        "servings": 0.5
      }
    ],
    "instructions": [
      "Add all ingredients to a blender",
      "Blend until smooth and creamy",
      "Add more milk if needed for desired consistency",
      "Pour into a glass and enjoy immediately"
    ],
    "tags": ["prenatal", "smoothie", "nutrient-dense", "quick"],
    "nutrition_per_serving": {
      "DHA": 0,
      "Selenium": 15.5,
      "Vitamin_A_RAE": 112.5,
      "Zinc": 1.5,
      "Iron": 2.05,
      "Iodine": 0.1,
      "Choline": 29,
      "Folate_DFE": 57
    },
    "source": "Nutrition Tracker Demo",
    "url": "https://example.com/prenatal-smoothie"
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const category = searchParams.get('category')
  const maxPrepTime = searchParams.get('maxPrepTime')

  let filteredRecipes = Object.values(sampleRecipes)

  // Filter by search query
  if (query) {
    const searchTerm = query.toLowerCase()
    filteredRecipes = filteredRecipes.filter(recipe =>
      recipe.name.toLowerCase().includes(searchTerm) ||
      recipe.description?.toLowerCase().includes(searchTerm) ||
      recipe.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    )
  }

  // Filter by category
  if (category) {
    filteredRecipes = filteredRecipes.filter(recipe => recipe.category === category)
  }

  // Filter by prep time
  if (maxPrepTime) {
    const maxTime = parseInt(maxPrepTime)
    filteredRecipes = filteredRecipes.filter(recipe =>
      !recipe.prep_time_minutes || recipe.prep_time_minutes <= maxTime
    )
  }

  return NextResponse.json({
    recipes: filteredRecipes,
    total: filteredRecipes.length
  })
}

