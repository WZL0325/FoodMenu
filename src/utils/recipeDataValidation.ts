import type {
  HealthGroup,
  HealthProfile,
  IngredientOption,
  Recipe,
  RecipeCategory,
  RecipeDifficulty,
} from '@/types/recipe'

export interface RecipeDataIssue {
  recipeId: string
  field: string
  message: string
}

const categories: RecipeCategory[] = ['家常菜', '健身餐', '婴儿辅食', '老年餐', '控糖餐', '低脂餐']
const difficulties: RecipeDifficulty[] = ['简单', '中等', '进阶']

const addIssue = (
  issues: RecipeDataIssue[],
  recipeId: string,
  field: string,
  message: string,
) => {
  issues.push({ recipeId, field, message })
}

const hasDuplicate = (items: string[]): boolean => {
  return new Set(items).size !== items.length
}

export const validateRecipeData = (
  recipeList: Recipe[],
  ingredientList: IngredientOption[],
  profileList: HealthProfile[],
): RecipeDataIssue[] => {
  const issues: RecipeDataIssue[] = []
  const knownIngredientNames = new Set(ingredientList.map((item) => item.name))
  const knownGroups = new Set<HealthGroup>(profileList.map((item) => item.id))
  const seenIds = new Set<string>()

  recipeList.forEach((recipe) => {
    const recipeId = recipe.id || '(missing-id)'
    if (!recipe.id.trim()) addIssue(issues, recipeId, 'id', '菜谱 ID 不能为空')
    if (seenIds.has(recipe.id)) addIssue(issues, recipeId, 'id', '菜谱 ID 重复')
    seenIds.add(recipe.id)

    if (!recipe.title.trim()) addIssue(issues, recipeId, 'title', '菜名不能为空')
    if (!recipe.description.trim()) addIssue(issues, recipeId, 'description', '菜谱描述不能为空')
    if (!categories.includes(recipe.category)) addIssue(issues, recipeId, 'category', '菜谱分类不在允许范围内')
    if (!difficulties.includes(recipe.difficulty)) addIssue(issues, recipeId, 'difficulty', '难度值不在允许范围内')
    if (recipe.image !== `/static/recipes/${recipe.id}.jpg`) {
      addIssue(issues, recipeId, 'image', '图片路径应与菜谱 ID 保持一致')
    }

    if (recipe.ingredients.length < 1) addIssue(issues, recipeId, 'ingredients', '至少需要一种食材')
    if (hasDuplicate(recipe.ingredients)) addIssue(issues, recipeId, 'ingredients', '主食材不能重复')
    recipe.ingredients.forEach((ingredient) => {
      if (!knownIngredientNames.has(ingredient)) {
        addIssue(issues, recipeId, 'ingredients', `食材目录中不存在：${ingredient}`)
      }
    })

    if (hasDuplicate(recipe.meatTypes)) addIssue(issues, recipeId, 'meatTypes', '肉禽/蛋白食材不能重复')
    recipe.meatTypes.forEach((ingredient) => {
      if (!recipe.ingredients.includes(ingredient)) {
        addIssue(issues, recipeId, 'meatTypes', `未在主食材中声明：${ingredient}`)
      }
    })
    if (hasDuplicate(recipe.vegetableTypes)) addIssue(issues, recipeId, 'vegetableTypes', '蔬菜食材不能重复')
    recipe.vegetableTypes.forEach((ingredient) => {
      if (!recipe.ingredients.includes(ingredient)) {
        addIssue(issues, recipeId, 'vegetableTypes', `未在主食材中声明：${ingredient}`)
      }
    })

    if (!recipe.suitableGroups.length) addIssue(issues, recipeId, 'suitableGroups', '至少需要一个适宜人群')
    recipe.suitableGroups.forEach((group) => {
      if (!knownGroups.has(group)) addIssue(issues, recipeId, 'suitableGroups', `未知人群：${group}`)
    })
    recipe.avoidGroups.forEach((group) => {
      if (!knownGroups.has(group)) addIssue(issues, recipeId, 'avoidGroups', `未知人群：${group}`)
    })
    const suitableSet = new Set(recipe.suitableGroups)
    recipe.avoidGroups.forEach((group) => {
      if (suitableSet.has(group)) addIssue(issues, recipeId, 'groups', `同一人群不能同时适宜和需注意：${group}`)
    })

    if (!recipe.healthTags.length) addIssue(issues, recipeId, 'healthTags', '至少需要一个健康标签')
    if (!Number.isInteger(recipe.cookingTime) || recipe.cookingTime <= 0) {
      addIssue(issues, recipeId, 'cookingTime', '烹饪时间必须是正整数')
    }

    const nutritionEntries = Object.entries(recipe.nutrition)
    nutritionEntries.forEach(([field, value]) => {
      if (!Number.isFinite(value) || value < 0) {
        addIssue(issues, recipeId, `nutrition.${field}`, '营养数值必须是非负有限数字')
      }
    })
    if (recipe.nutrition.calories <= 0) {
      addIssue(issues, recipeId, 'nutrition.calories', '热量必须大于 0')
    }

    if (recipe.steps.length < 1) addIssue(issues, recipeId, 'steps', '至少需要一个烹饪步骤')
    recipe.steps.forEach((step, index) => {
      if (!step.title.trim()) addIssue(issues, recipeId, `steps.${index}.title`, '步骤标题不能为空')
      if (!step.description.trim()) addIssue(issues, recipeId, `steps.${index}.description`, '步骤描述不能为空')
    })
    if (!recipe.tips.trim()) addIssue(issues, recipeId, 'tips', '小贴士不能为空')
    if (recipe.category === '婴儿辅食') {
      if (!recipe.ageRange?.trim()) addIssue(issues, recipeId, 'ageRange', '婴儿辅食必须标注适用月龄')
      if (!Array.isArray(recipe.allergens)) addIssue(issues, recipeId, 'allergens', '婴儿辅食必须标注常见过敏原或无已知过敏原')
      if (!recipe.servingNote?.trim()) addIssue(issues, recipeId, 'servingNote', '婴儿辅食必须标注食用说明')
    }
  })

  return issues
}
