import { ingredientOptions } from '@/data/ingredients';
import type { DietaryProfile, HealthGroup, Recipe, RecipeIngredientMatch } from '@/types/recipe';
import type { RecipeFeedbackMap } from '@/types/recipeFeedback';
import { filterRecipesByFeedback, getRecipeFeedbackPenalty, sortRecipesByFeedback } from '@/utils/recipeFeedback';

const unique = (items: string[]): string[] => [...new Set(items)];

const ingredientAliasMap = new Map<string, string>();
ingredientOptions.forEach((option) => {
  const canonical = option.name.trim();
  [option.name, ...(option.keywords ?? [])].forEach((value) => {
    ingredientAliasMap.set(value.trim().toLocaleLowerCase(), canonical);
  });
});

const canonicalizeIngredient = (value: string): string => {
  const normalized = value.trim();
  return ingredientAliasMap.get(normalized.toLocaleLowerCase()) ?? normalized;
};

const ingredientKey = (value: string): string => canonicalizeIngredient(value).toLocaleLowerCase();

const getRecipeIngredients = (recipe: Recipe): string[] => {
  return unique([...recipe.ingredients, ...recipe.meatTypes, ...recipe.vegetableTypes]);
};

export interface RecipeDietaryRisk {
  excludedIngredients: string[];
  healthGroupConflict: boolean;
  hasConflict: boolean;
}

export const getIngredientConflicts = (
  recipeIngredients: string[],
  excludedIngredients: string[],
): string[] => {
  const recipeKeys = new Set(recipeIngredients.map(ingredientKey));
  return unique(excludedIngredients
    .map((ingredient) => ingredient.trim())
    .filter(Boolean)
    .filter((ingredient) => recipeKeys.has(ingredientKey(ingredient))));
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

  const selectedKeys = new Set(selectedIngredients.map(ingredientKey));
  return recipes.filter((recipe) => {
    const recipeKeys = new Set(getRecipeIngredients(recipe).map(ingredientKey));
    return [...selectedKeys].some((ingredient) => recipeKeys.has(ingredient));
  });
};

/**
 * 排除包含忌口食材的菜谱。传入空数组时保留全部菜谱。
 */
export const filterRecipesByExcludedIngredients = (
  recipes: Recipe[],
  excludedIngredients: string[],
): Recipe[] => {
  if (excludedIngredients.length === 0) return recipes;

  return recipes.filter((recipe) => getIngredientConflicts(getRecipeIngredients(recipe), excludedIngredients).length === 0);
};

export const getRecipeExcludedIngredients = (
  recipe: Recipe,
  excludedIngredients: string[],
): string[] => getIngredientConflicts(getRecipeIngredients(recipe), excludedIngredients);

export const getRecipeDietaryRisk = (
  recipe: Recipe,
  profile: DietaryProfile,
): RecipeDietaryRisk => {
  const excludedConflicts = getRecipeExcludedIngredients(recipe, profile.excludedIngredients);
  const healthGroup = profile.healthGroup;
  const healthGroupConflict = healthGroup
    ? recipe.avoidGroups.includes(healthGroup) || !recipe.suitableGroups.includes(healthGroup)
    : false;
  return {
    excludedIngredients: excludedConflicts,
    healthGroupConflict,
    hasConflict: excludedConflicts.length > 0 || healthGroupConflict,
  };
};

export const filterRecipesByDietaryProfile = (
  recipes: Recipe[],
  profile: DietaryProfile,
): Recipe[] => filterRecipesByExcludedIngredients(recipes, profile.excludedIngredients);

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
      const recipeKeys = new Set(recipeIngredients.map(ingredientKey));
      const selectedKeys = new Set(selected.map(ingredientKey));
      const matchedIngredients = selected.filter((ingredient) => recipeKeys.has(ingredientKey(ingredient)));
      const missingIngredients = recipe.ingredients.filter((ingredient) => !selectedKeys.has(ingredientKey(ingredient)));
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
