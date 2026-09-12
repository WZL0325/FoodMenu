import { FAVORITE_STORAGE_KEY } from '@/utils/storageKeys'

const normalizeIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((id): id is string => typeof id === 'string'))]
}

export const getFavoriteRecipeIds = (): string[] => {
  try {
    return normalizeIds(uni.getStorageSync(FAVORITE_STORAGE_KEY))
  } catch (error) {
    console.error('[Favorites] 读取收藏缓存失败', error)
    return []
  }
}

export const isFavoriteRecipe = (recipeId: string): boolean => {
  return getFavoriteRecipeIds().includes(recipeId)
}

export type ToggleFavoriteResult = {
  favorite: boolean
  persisted: boolean
}

export const toggleFavoriteRecipe = (recipeId: string): ToggleFavoriteResult => {
  const favoriteIds = getFavoriteRecipeIds()
  const exists = favoriteIds.includes(recipeId)
  const nextFavoriteIds = exists
    ? favoriteIds.filter((id) => id !== recipeId)
    : [...favoriteIds, recipeId]

  try {
    uni.setStorageSync(FAVORITE_STORAGE_KEY, nextFavoriteIds)
    console.info('[Favorites] 收藏状态已更新', { recipeId, favorite: !exists })
    return { favorite: !exists, persisted: true }
  } catch (error) {
    console.error('[Favorites] 写入收藏缓存失败', error)
    return { favorite: exists, persisted: false }
  }
}
