import { ingredientOptions } from '@/data/ingredients'
import type { Recipe, RecipeIngredientMatch } from '@/types/recipe'

export type RecipeQuickFilter = 'all' | 'quick' | 'easy'
export type RecipeSort = 'recommended' | 'time' | 'calories'

const normalizeKeyword = (keyword: string): string => {
  const normalized = keyword.toLocaleLowerCase()
  return ingredientOptions.find((item) => item.keywords?.some((alias) => alias === normalized))?.name ?? normalized
}

/**
 * 把「番茄鸡蛋」这类连续输入拆成可匹配的词：
 * 优先按食材名/别名切分，剩余片段保留（可匹配菜名等）。
 */
const splitQuery = (query: string): string[] => {
  const names = [...ingredientOptions.flatMap((item) => [item.name, ...(item.keywords ?? [])])]
    .filter((name) => query.includes(name))
    .sort((a, b) => b.length - a.length)
  let rest = query
  const tokens: string[] = []
  for (const name of names) {
    if (rest.includes(name)) {
      tokens.push(name)
      rest = rest.split(name).join(' ')
    }
  }
  tokens.push(...rest.split(/[\s、，,]+/).filter(Boolean))
  return [...new Set(tokens)].map(normalizeKeyword)
}

export const matchesRecipeQuery = (recipe: Recipe, query: string): boolean => {
  const keywords = splitQuery(query.trim())
  if (keywords.length === 0) return true
  const searchableText = [
    recipe.title,
    recipe.description,
    recipe.category,
    ...recipe.ingredients,
    ...recipe.meatTypes,
    ...recipe.vegetableTypes,
    ...recipe.healthTags,
  ].join(' ').toLocaleLowerCase()
  return keywords.every((keyword) => searchableText.includes(keyword))
}

export const browseRecipeMatches = (
  matches: RecipeIngredientMatch[],
  options: { query: string, quickFilter: RecipeQuickFilter, sort: RecipeSort },
): RecipeIngredientMatch[] => {
  const result = matches.filter(({ recipe }) => {
    if (!matchesRecipeQuery(recipe, options.query)) return false
    if (options.quickFilter === 'quick') return recipe.cookingTime <= 20
    if (options.quickFilter === 'easy') return recipe.difficulty === '简单'
    return true
  })

  if (options.sort === 'time') result.sort((a, b) => a.recipe.cookingTime - b.recipe.cookingTime)
  if (options.sort === 'calories') result.sort((a, b) => a.recipe.nutrition.calories - b.recipe.nutrition.calories)
  return result
}
