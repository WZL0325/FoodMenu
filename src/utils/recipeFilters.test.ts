import { describe, it, expect } from 'vitest';
import {
  findRecipeById,
  filterRecipesByIngredients,
  filterRecipesByHealthGroup,
} from './recipeFilters';
import { recipes } from '@/data/recipes';

describe('findRecipeById', () => {
  it('返回 id 匹配的菜谱', () => {
    expect(findRecipeById(recipes, 'r001')?.title).toBe('西兰花鸡胸肉轻食碗');
  });

  it('id 不存在时返回 undefined', () => {
    expect(findRecipeById(recipes, 'not-exist')).toBeUndefined();
  });

  it('id 为 undefined 时返回 undefined', () => {
    expect(findRecipeById(recipes, undefined)).toBeUndefined();
  });
});

describe('filterRecipesByIngredients', () => {
  it('未选食材时返回全部', () => {
    expect(filterRecipesByIngredients(recipes, [])).toHaveLength(recipes.length);
  });

  it('按任一匹配筛选:选鸡胸肉应包含含鸡胸肉的菜', () => {
    const result = filterRecipesByIngredients(recipes, ['鸡胸肉']);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((r) => [...r.ingredients, ...r.meatTypes, ...r.vegetableTypes].includes('鸡胸肉'))).toBe(true);
  });

  it('选了食材但无匹配时返回空数组', () => {
    expect(filterRecipesByIngredients(recipes, ['不存在的食材'])).toEqual([]);
  });
});

describe('filterRecipesByHealthGroup', () => {
  it('只返回 suitableGroups 命中且不在 avoidGroups 的菜', () => {
    const result = filterRecipesByHealthGroup(recipes, '健身人群');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((r) => r.suitableGroups.includes('健身人群') && !r.avoidGroups.includes('健身人群'))).toBe(true);
  });
});
