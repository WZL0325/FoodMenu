import type { IngredientType } from '@/types/recipe'

export interface ShowApiIngredient {
  name: string
  amount: string
}

export interface ShowApiRecipeStep {
  content: string
  image: string
  order: number
}

export interface ShowApiRecipe {
  id: string
  name: string
  description: string
  category: string
  categoryLevel1: string
  categoryLevel2: string
  categoryLevel3: string
  ingredients: ShowApiIngredient[]
  steps: ShowApiRecipeStep[]
  tips: string
  image: string
  matchedIngredients: string[]
  source: 'ShowAPI'
}

export interface ShowApiIngredientOption {
  id: string
  name: string
  type: IngredientType
}

export interface ShowApiCategoryTree {
  [level1: string]: Record<string, string[]> | string | boolean | number | undefined
}

export interface ShowApiSearchResult {
  recipes: ShowApiRecipe[]
  queriedKeywords: string[]
}

