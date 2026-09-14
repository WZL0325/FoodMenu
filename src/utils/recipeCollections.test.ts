import { describe, expect, it } from 'vitest'
import { recipes } from '@/data/recipes'
import { getRecipeCollection } from '@/utils/recipeCollections'

describe('recipe collections', () => {
  it('快手集合只返回 20 分钟及以内的菜', () => {
    expect(getRecipeCollection(recipes, 'quick').every((recipe) => recipe.cookingTime <= 20)).toBe(true)
  })

  it('家常集合返回家常菜', () => {
    expect(getRecipeCollection(recipes, 'home-style').every((recipe) => recipe.category === '家常菜')).toBe(true)
  })

  it('婴儿集合只返回婴儿辅食分类', () => {
    expect(getRecipeCollection(recipes, 'baby').every((recipe) => recipe.category === '婴儿辅食')).toBe(true)
  })
})
