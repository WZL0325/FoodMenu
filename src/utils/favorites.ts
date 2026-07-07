import Taro from '@tarojs/taro';

const FAVORITE_KEY = 'healthy_recipe_favorites';

/**
 * 读取本地收藏菜谱 ID 列表。
 * 使用本地缓存是为了让首版无需后端即可保留用户收藏状态。
 */
export const getFavoriteRecipeIds = (): string[] => {
  try {
    const value = Taro.getStorageSync<string[]>(FAVORITE_KEY);
    return Array.isArray(value) ? value : [];
  } catch (error) {
    console.error('[Favorites] 读取收藏缓存失败', error);
    return [];
  }
};

/**
 * 判断指定菜谱是否已经被收藏。
 */
export const isFavoriteRecipe = (recipeId: string): boolean => {
  return getFavoriteRecipeIds().includes(recipeId);
};

/**
 * 切换菜谱收藏状态，并返回切换后的收藏状态。
 */
export const toggleFavoriteRecipe = (recipeId: string): boolean => {
  const favoriteIds = getFavoriteRecipeIds();
  const exists = favoriteIds.includes(recipeId);

  // 如果已收藏，则从收藏列表中移除；否则追加到收藏列表。
  const nextFavoriteIds = exists
    ? favoriteIds.filter((id) => id !== recipeId)
    : [...favoriteIds, recipeId];

  try {
    Taro.setStorageSync(FAVORITE_KEY, nextFavoriteIds);
    console.info('[Favorites] 收藏状态已更新', { recipeId, favorite: !exists });
  } catch (error) {
    console.error('[Favorites] 写入收藏缓存失败', error);
  }

  return !exists;
};
