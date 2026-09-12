import { describe, expect, it } from 'vitest'
import { recipes } from '@/data/recipes'
import { browseRecipeMatches, matchesRecipeQuery } from './recipeBrowse'
import { rankRecipesByIngredients } from './recipeFilters'

const matches = rankRecipesByIngredients(recipes, [])
const defaults = { query: '', quickFilter: 'all' as const, sort: 'recommended' as const }

describe('recipe browsing', () => {
  it('keeps the complete ranked list when no filters are selected', () => {
    expect(browseRecipeMatches(matches, defaults)).toEqual(matches)
    expect(browseRecipeMatches(matches, defaults)).toHaveLength(recipes.length)
  })

  it('finds recipes by title and ingredient aliases', () => {
    const tomatoRecipe = recipes.find((recipe) => recipe.ingredients.includes('番茄'))!
    expect(matchesRecipeQuery(tomatoRecipe, tomatoRecipe.title)).toBe(true)
    expect(matchesRecipeQuery(tomatoRecipe, ' 西红柿 ')).toBe(true)
    expect(matchesRecipeQuery(tomatoRecipe, '不存在的菜名')).toBe(false)
  })

  it('requires each search keyword rather than matching an unrelated ingredient', () => {
    const results = browseRecipeMatches(matches, { ...defaults, query: '番茄，鸡蛋' })
    expect(results.length).toBeGreaterThan(0)
    expect(results.every(({ recipe }) => matchesRecipeQuery(recipe, '番茄') && matchesRecipeQuery(recipe, '鸡蛋'))).toBe(true)
  })

  it('splits continuous input like 西红柿鸡蛋 into ingredient tokens', () => {
    const results = browseRecipeMatches(matches, { ...defaults, query: '西红柿鸡蛋' })
    expect(results.length).toBeGreaterThan(0)
    expect(results.every(({ recipe }) => matchesRecipeQuery(recipe, '西红柿') && matchesRecipeQuery(recipe, '鸡蛋'))).toBe(true)
    expect(matchesRecipeQuery(recipes[0], '西红柿鸡蛋')).toBe(false)
  })

  it('filters quick and easy recipes using actual recipe metadata', () => {
    expect(browseRecipeMatches(matches, { ...defaults, quickFilter: 'quick' })
      .every(({ recipe }) => recipe.cookingTime <= 20)).toBe(true)
    expect(browseRecipeMatches(matches, { ...defaults, quickFilter: 'easy' })
      .every(({ recipe }) => recipe.difficulty === '简单')).toBe(true)
  })

  it('sorts by time or calories without mutating the ranked source', () => {
    const ids = matches.map(({ recipe }) => recipe.id)
    for (const sort of ['time', 'calories'] as const) {
      const sorted = browseRecipeMatches(matches, { ...defaults, sort })
      const values = sorted.map(({ recipe }) => sort === 'time' ? recipe.cookingTime : recipe.nutrition.calories)
      expect(values).toEqual([...values].sort((a, b) => a - b))
    }
    expect(matches.map(({ recipe }) => recipe.id)).toEqual(ids)
  })

  it('does not reintroduce excluded recipes from the input', () => {
    const subset = matches.slice(0, 2)
    expect(browseRecipeMatches(subset, defaults)).toHaveLength(2)
    expect(browseRecipeMatches([], defaults)).toEqual([])
  })
})
