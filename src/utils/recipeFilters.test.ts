import { describe, it, expect } from 'vitest';
import {
  findRecipeById,
  filterRecipesByIngredients,
  filterRecipesByHealthGroup,
  filterRecipesByExcludedIngredients,
  filterRecipesByDietaryProfile,
  getRecipeDietaryRisk,
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
  it('支持食材别名匹配，但不会把葱误判为洋葱', () => {
    const aliasRecipe = { ...recipes[0], ingredients: ['小葱'] }
    const onionRecipe = { ...recipes[0], ingredients: ['洋葱'] }
    expect(getRecipeExcludedIngredients(aliasRecipe, ['葱'])).toEqual(['葱'])
    expect(getRecipeExcludedIngredients(onionRecipe, ['葱'])).toEqual([])
    expect(getRecipeExcludedIngredients(aliasRecipe, ['西红柿'])).toEqual([])
  })

  it('按饮食档案排除忌口并返回健康目标冲突', () => {
    const recipe = { ...recipes[0], avoidGroups: ['健身人群'] as import('@/types/recipe').HealthGroup[] }
    const profile = {
      healthGroup: '健身人群' as const,
      excludedIngredients: ['鸡肉'],
    }
    const risk = getRecipeDietaryRisk(recipe, profile)

    expect(risk.excludedIngredients).toEqual(['鸡肉'])
    expect(risk.healthGroupConflict).toBe(true)
    expect(filterRecipesByDietaryProfile([recipe], profile)).toEqual([])
  })

  it('不在健康目标适宜范围内的菜谱会标记提醒，但不会硬过滤', () => {
    const recipe = {
      ...recipes[0],
      suitableGroups: ['白领轻食'] as import('@/types/recipe').HealthGroup[],
      avoidGroups: [] as import('@/types/recipe').HealthGroup[],
    }
    const profile = { healthGroup: '健身人群' as const, excludedIngredients: [] }

    expect(getRecipeDietaryRisk(recipe, profile).healthGroupConflict).toBe(true)
    expect(filterRecipesByDietaryProfile([recipe], profile)).toEqual([recipe])
  })

  it('没有健康目标或忌口时保留全部菜谱', () => {
    expect(filterRecipesByDietaryProfile(recipes, { excludedIngredients: [] })).toEqual(recipes)
  })

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
