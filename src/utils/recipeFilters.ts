import type { HealthGroup, Recipe, RecipeIngredientMatch } from '@/types/recipe';
import type { RecipeFeedbackMap } from '@/types/recipeFeedback';
import { filterRecipesByFeedback, getRecipeFeedbackPenalty, sortRecipesByFeedback } from '@/utils/recipeFeedback';

const unique = (items: string[]): string[] => [...new Set(items)];

const getRecipeIngredients = (recipe: Recipe): string[] => {
  return unique([...recipe.ingredients, ...recipe.meatTypes, ...recipe.vegetableTypes]);
};

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
 * 排除包含忌口食材的菜谱。传入空数组时保留全部菜谱。
 */
export const filterRecipesByExcludedIngredients = (
  recipes: Recipe[],
  excludedIngredients: string[],
): Recipe[] => {
  const excluded = unique(excludedIngredients);
  if (excluded.length === 0) return recipes;

  return recipes.filter((recipe) => {
    const recipeIngredients = getRecipeIngredients(recipe);
    return excluded.every((ingredient) => !recipeIngredients.includes(ingredient));
  });
};

export const getRecipeExcludedIngredients = (
  recipe: Recipe,
  excludedIngredients: string[],
): string[] => {
  const recipeIngredients = getRecipeIngredients(recipe);
  return unique(excludedIngredients).filter((ingredient) => recipeIngredients.includes(ingredient));
};

/**
 * 按用户已有食材计算匹配度，用于给出可解释的推荐排序。
 */
export const rankRecipesByIngredients = (
  recipes: Recipe[],
  selectedIngredients: string[],
  feedbackMap: RecipeFeedbackMap = {},
): RecipeIngredientMatch[] => {
  const selected = unique(selectedIngredients);
  const availableRecipes = filterRecipesByFeedback(recipes, feedbackMap);

  if (selected.length === 0) {
    return sortRecipesByFeedback(availableRecipes, feedbackMap).map((recipe) => ({
      recipe,
      matchedIngredients: [],
      missingIngredients: [],
      score: 0,
    }));
  }

  return availableRecipes
    .map((recipe) => {
      const recipeIngredients = getRecipeIngredients(recipe);
      const matchedIngredients = selected.filter((ingredient) => recipeIngredients.includes(ingredient));
      const missingIngredients = recipe.ingredients.filter((ingredient) => !selected.includes(ingredient));
      const selectedCoverage = matchedIngredients.length / selected.length;
      const recipeCoverage = matchedIngredients.length / recipeIngredients.length;

      return {
        recipe,
        matchedIngredients,
        missingIngredients,
        score: Math.round((selectedCoverage * 0.6 + recipeCoverage * 0.4) * 100),
      };
    })
    .filter((item) => item.matchedIngredients.length > 0)
    .sort((a, b) => {
      const scoreDifference = (b.score - getRecipeFeedbackPenalty(feedbackMap[b.recipe.id]))
        - (a.score - getRecipeFeedbackPenalty(feedbackMap[a.recipe.id]));
      return scoreDifference
        || b.matchedIngredients.length - a.matchedIngredients.length
        || a.missingIngredients.length - b.missingIngredients.length
        || a.recipe.cookingTime - b.recipe.cookingTime;
    });
};

/**
 * 根据健康人群筛选推荐菜品，同时排除明确不适合该人群的菜品。
 */
export const filterRecipesByHealthGroup = (recipes: Recipe[], group: HealthGroup): Recipe[] => {
  return recipes.filter((recipe) => recipe.suitableGroups.includes(group) && !recipe.avoidGroups.includes(group));
};
