import type { IngredientOption } from '@/types/recipe';

export const ingredientOptions: IngredientOption[] = [
  { id: 'spinach', name: '菠菜', type: 'vegetable' },
  { id: 'broccoli', name: '西兰花', type: 'vegetable' },
  { id: 'tomato', name: '番茄', type: 'vegetable' },
  { id: 'mushroom', name: '香菇', type: 'vegetable' },
  { id: 'pumpkin', name: '南瓜', type: 'vegetable' },
  { id: 'celery', name: '芹菜', type: 'vegetable' },
  { id: 'carrot', name: '胡萝卜', type: 'vegetable' },
  { id: 'potato', name: '土豆', type: 'vegetable' },
  { id: 'corn', name: '玉米', type: 'vegetable' },
  { id: 'chicken', name: '鸡胸肉', type: 'meat' },
  { id: 'beef', name: '牛肉', type: 'meat' },
  { id: 'fish', name: '鱼肉', type: 'meat' },
  { id: 'shrimp', name: '虾仁', type: 'meat' },
  { id: 'egg', name: '鸡蛋', type: 'other' },
  { id: 'tofu', name: '豆腐', type: 'other' },
];
