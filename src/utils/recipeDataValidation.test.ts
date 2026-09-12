import { describe, expect, it } from 'vitest'
import { ingredientOptions } from '@/data/ingredients'
import { healthProfiles } from '@/data/healthProfiles'
import { recipes } from '@/data/recipes'
import { validateRecipeData } from '@/utils/recipeDataValidation'

describe('recipe data validation', () => {
  it('当前本地菜谱数据通过结构和关系校验', () => {
    expect(validateRecipeData(recipes, ingredientOptions, healthProfiles)).toEqual([])
  })

  it('能够识别菜谱关系错误和不合法数值', () => {
    const issues = validateRecipeData([
      {
        ...recipes[0],
        id: 'broken',
        image: '/static/recipes/r001.jpg',
        ingredients: ['不存在的食材'],
        meatTypes: ['鸡胸肉'],
        suitableGroups: ['健身人群'],
        avoidGroups: ['健身人群'],
        cookingTime: 0,
        nutrition: { ...recipes[0].nutrition, calories: -1 },
        steps: [{ title: '', description: '' }],
      },
    ], ingredientOptions, healthProfiles)

    expect(issues.map((issue) => issue.field)).toEqual(expect.arrayContaining([
      'image',
      'ingredients',
      'meatTypes',
      'groups',
      'cookingTime',
      'nutrition.calories',
      'steps.0.title',
      'steps.0.description',
    ]))

    expect(issues.find((issue) => issue.field === 'steps.0.description')).toMatchObject({
      recipeId: 'broken',
      field: 'steps.0.description',
    })
  })
})
