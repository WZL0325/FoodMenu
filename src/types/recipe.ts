export type RecipeDifficulty = '简单' | '中等' | '进阶';

export type RecipeCategory = '家常菜' | '健身餐' | '婴儿辅食' | '老年餐' | '控糖餐' | '低脂餐';

export type HealthGroup = '三高人群' | '健身人群' | '婴儿辅食' | '白领轻食' | '老年人' | '控糖人群';

export interface RecipeStep {
  title: string;
  description: string;
}

export interface RecipeNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  description: string;
  category: RecipeCategory;
  ingredients: string[];
  meatTypes: string[];
  vegetableTypes: string[];
  suitableGroups: HealthGroup[];
  avoidGroups: HealthGroup[];
  healthTags: string[];
  cookingTime: number;
  difficulty: RecipeDifficulty;
  nutrition: RecipeNutrition;
  tips: string;
  steps: RecipeStep[];
  allergens?: string[];
  ageRange?: string;
  servingNote?: string;
}

export interface RecipeIngredientMatch {
  recipe: Recipe;
  matchedIngredients: string[];
  missingIngredients: string[];
  score: number;
}

export interface DietaryProfile {
  healthGroup?: HealthGroup;
  excludedIngredients: string[];
}

export type IngredientType = 'vegetable' | 'meat' | 'eggSoy' | 'seafood' | 'staple' | 'fungi' | 'fruit' | 'seasoning';

export interface IngredientOption {
  id: string;
  name: string;
  type: IngredientType;
  common?: boolean;
  keywords?: string[];
}

export interface HealthProfile {
  id: HealthGroup;
  title: string;
  description: string;
  avoidTips: string[];
}
