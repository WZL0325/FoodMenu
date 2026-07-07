import type { HealthGroup, Recipe } from '@/types/recipe';

/**
 * 根据菜谱 ID 查询菜谱详情。
 */
export const findRecipeById = (recipes: Recipe[], recipeId?: string): Recipe | undefined => {
  if (!recipeId) {
    return undefined;
  }

  return recipes.find((recipe) => recipe.id === recipeId);
};

/**
 * 根据用户选择的食材筛选可制作菜品。
 */
export const filterRecipesByIngredients = (recipes: Recipe[], selectedIngredients: string[]): Recipe[] => {
  if (selectedIngredients.length === 0) {
    return recipes;
  }

  return recipes.filter((recipe) => {
    const allIngredients = [...recipe.ingredients, ...recipe.meatTypes, ...recipe.vegetableTypes];
    return selectedIngredients.some((ingredient) => allIngredients.includes(ingredient));
  });
};

/**
 * 根据健康人群筛选推荐菜品，同时排除明确不适合该人群的菜品。
 */
export const filterRecipesByHealthGroup = (recipes: Recipe[], group: HealthGroup): Recipe[] => {
  return recipes.filter((recipe) => recipe.suitableGroups.includes(group) && !recipe.avoidGroups.includes(group));
};
