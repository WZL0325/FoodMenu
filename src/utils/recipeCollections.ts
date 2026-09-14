import type { Recipe } from '@/types/recipe'

export type RecipeCollectionId = 'quick' | 'home-style' | 'light' | 'senior' | 'baby' | 'matched'

export interface RecipeCollectionOptions {
  selectedIngredients?: string[]
}

const lightTags = new Set(['低脂', '低糖', '高纤维', '少油'])

export const getRecipeCollection = (
  recipeList: Recipe[],
  collection: RecipeCollectionId,
  options: RecipeCollectionOptions = {},
): Recipe[] => {
  if (collection === 'quick') return recipeList.filter((recipe) => recipe.cookingTime <= 20)
  if (collection === 'home-style') return recipeList.filter((recipe) => recipe.category === '家常菜')
  if (collection === 'light') return recipeList.filter((recipe) => recipe.healthTags.some((tag) => lightTags.has(tag)))
  if (collection === 'senior') return recipeList.filter((recipe) => recipe.category === '老年餐')
  if (collection === 'baby') return recipeList.filter((recipe) => recipe.category === '婴儿辅食')
  const selected = new Set(options.selectedIngredients ?? [])
  if (selected.size === 0) return []
  return recipeList.filter((recipe) => recipe.ingredients.some((ingredient) => selected.has(ingredient)))
}
