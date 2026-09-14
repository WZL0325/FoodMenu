import { describe, expect, it } from 'vitest'
import { ingredientOptions } from '@/data/ingredients'
import { healthProfiles } from '@/data/healthProfiles'
import { recipes } from '@/data/recipes'
import { validateRecipeData } from '@/utils/recipeDataValidation'

describe('recipe data validation', () => {
  it('当前本地菜谱数据通过结构和关系校验', () => {
    expect(validateRecipeData(recipes, ingredientOptions, healthProfiles)).toEqual([])
  })

  it('菜谱总数为 30 且 ID 连续覆盖 r001 到 r030', () => {
    expect(recipes).toHaveLength(30)
    expect(recipes.map((recipe) => recipe.id)).toEqual(
      Array.from({ length: 30 }, (_, index) => `r${String(index + 1).padStart(3, '0')}`),
    )
  })

  it('重点分类至少有五道菜且 r023 属于老年餐', () => {
    expect(recipes.filter((recipe) => recipe.category === '老年餐').length).toBeGreaterThanOrEqual(5)
    expect(recipes.filter((recipe) => recipe.category === '婴儿辅食').length).toBeGreaterThanOrEqual(5)
    expect(recipes.filter((recipe) => recipe.category === '家常菜').length).toBeGreaterThanOrEqual(5)
    expect(recipes.find((recipe) => recipe.id === 'r023')?.category).toBe('老年餐')
  })

  it('每道菜的图片路径唯一且对应自身 ID', () => {
    const images = recipes.map((recipe) => recipe.image)
    expect(new Set(images).size).toBe(30)
    expect(images.every((image, index) => image.includes(recipes[index].id))).toBe(true)
  })

  it('婴儿辅食缺少安全字段时能够识别', () => {
    const babyRecipe = {
      ...recipes[0],
      category: '婴儿辅食' as const,
      allergens: undefined,
      ageRange: '',
      servingNote: '',
    }
    const issues = validateRecipeData([babyRecipe], ingredientOptions, healthProfiles)

    expect(issues.map((issue) => issue.field)).toEqual(expect.arrayContaining([
      'ageRange',
      'allergens',
      'servingNote',
    ]))
  })

  it('空过敏原数组表示无已知过敏原，视为合规', () => {
    const babyRecipe = {
      ...recipes[0],
      category: '婴儿辅食' as const,
      allergens: [],
      ageRange: '8 个月以上',
      servingNote: '蒸熟压泥，首次少量尝试。',
    }
    const issues = validateRecipeData([babyRecipe], ingredientOptions, healthProfiles)

    expect(issues).toEqual([])
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
