import { describe, it, expect } from 'vitest';
import {
  findRecipeById,
  filterRecipesByIngredients,
  filterRecipesByHealthGroup,
  filterRecipesByExcludedIngredients,
  getRecipeExcludedIngredients,
  rankRecipesByIngredients,
} from './recipeFilters';
import { recipes } from '@/data/recipes';
import { sortRecipesByFeedback } from '@/utils/recipeFeedback';

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

describe('rankRecipesByIngredients', () => {
  it('优先返回命中更多已有食材的菜谱', () => {
    const result = rankRecipesByIngredients(recipes, ['西兰花', '鸡胸肉']);

    expect(result[0].recipe.id).toBe('r001');
    expect(result[0].matchedIngredients).toEqual(['西兰花', '鸡胸肉']);
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it('返回仍需准备的食材，便于解释推荐结果', () => {
    const result = rankRecipesByIngredients(recipes, ['西兰花']);
    const recipe = result.find((item) => item.recipe.id === 'r001');

    expect(recipe?.missingIngredients).toEqual(['鸡胸肉', '糙米', '胡萝卜', '彩椒']);
  });

  it('未选食材时保持原始菜谱顺序', () => {
    const result = rankRecipesByIngredients(recipes, []);

    expect(result.map((item) => item.recipe.id)).toEqual(recipes.map((recipe) => recipe.id));
  });
});

describe('filterRecipesByHealthGroup', () => {
  it('只返回 suitableGroups 命中且不在 avoidGroups 的菜', () => {
    const result = filterRecipesByHealthGroup(recipes, '健身人群');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((r) => r.suitableGroups.includes('健身人群') && !r.avoidGroups.includes('健身人群'))).toBe(true);
  });
});

describe('recipe feedback ranking', () => {
  it('不喜欢的菜不会进入按食材推荐结果', () => {
    const result = rankRecipesByIngredients(recipes, ['西兰花'], {
      r020: {
        recipeId: 'r020',
        disliked: true,
        missingIngredients: false,
        cooked: false,
        updatedAt: 1,
      },
    });

    expect(result.some((item) => item.recipe.id === 'r020')).toBe(false);
  });

  it('食材不齐和做过了会降低后续排序', () => {
    const feedback = {
      r001: {
        recipeId: 'r001',
        disliked: false,
        missingIngredients: true,
        cooked: false,
        updatedAt: 1,
      },
    };

    expect(sortRecipesByFeedback([recipes[0], recipes[1]], feedback).map((recipe) => recipe.id)).toEqual(['r002', 'r001']);
  });
});

describe('dietary exclusions', () => {
  it('排除包含忌口食材的菜谱', () => {
    const result = filterRecipesByExcludedIngredients(recipes, ['鸡蛋']);

    expect(result.length).toBeLessThan(recipes.length);
    expect(result.every((recipe) => !recipe.ingredients.includes('鸡蛋'))).toBe(true);
  });

  it('识别菜谱与饮食档案冲突的食材', () => {
    const recipe = recipes.find((item) => item.id === 'r001');

    expect(recipe && getRecipeExcludedIngredients(recipe, ['鸡胸肉', '虾仁'])).toEqual(['鸡胸肉']);
  });
});
