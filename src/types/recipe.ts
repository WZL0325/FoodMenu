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
}

export interface IngredientOption {
  id: string;
  name: string;
  type: 'vegetable' | 'meat' | 'other';
}

export interface HealthProfile {
  id: HealthGroup;
  title: string;
  description: string;
  avoidTips: string[];
}
