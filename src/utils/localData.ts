import {
  DIETARY_PROFILE_STORAGE_KEY,
  FAVORITE_STORAGE_KEY,
  MEAL_PLAN_STORAGE_KEY,
  RECIPE_FEEDBACK_STORAGE_KEY,
  SHOWAPI_CATEGORY_CACHE_KEY,
  SHOWAPI_RECIPE_CACHE_PREFIX,
  SHOPPING_CHECKED_STORAGE_KEY,
  SHOPPING_MANUAL_STORAGE_KEY,
} from '@/utils/storageKeys'

const removeStorageKeys = (keys: string[]): boolean => {
  let succeeded = true

  keys.forEach((key) => {
    try {
      uni.removeStorageSync(key)
    } catch (error) {
      succeeded = false
      console.error('[LocalData] 删除本地数据失败', { key, error })
    }
  })

  return succeeded
}

const getStorageKeys = (): string[] | undefined => {
  try {
    const { keys } = uni.getStorageInfoSync()
    return Array.isArray(keys) ? keys : []
  } catch (error) {
    console.error('[LocalData] 读取本地数据清单失败', error)
    return undefined
  }
}

const isOnlineCacheKey = (key: string): boolean => {
  return key === SHOWAPI_CATEGORY_CACHE_KEY || key.startsWith(SHOWAPI_RECIPE_CACHE_PREFIX)
}

export const getOnlineRecipeCacheCount = (): number => {
  const keys = getStorageKeys()
  return keys?.filter((key) => key.startsWith(SHOWAPI_RECIPE_CACHE_PREFIX)).length ?? 0
}

export const clearDietaryProfileData = (): boolean => {
  return removeStorageKeys([DIETARY_PROFILE_STORAGE_KEY])
}

export const clearFavoriteData = (): boolean => {
  return removeStorageKeys([FAVORITE_STORAGE_KEY])
}

export const clearOnlineRecipeData = (): boolean => {
  const keys = getStorageKeys()
  if (!keys) return false
  return removeStorageKeys(keys.filter(isOnlineCacheKey))
}

export const clearMealPlanData = (): boolean => {
  return removeStorageKeys([
    MEAL_PLAN_STORAGE_KEY,
    SHOPPING_MANUAL_STORAGE_KEY,
    SHOPPING_CHECKED_STORAGE_KEY,
  ])
}

export const clearRecipeFeedbackData = (): boolean => {
  return removeStorageKeys([RECIPE_FEEDBACK_STORAGE_KEY])
}

export const clearAllManagedLocalData = (): boolean => {
  const keys = getStorageKeys()
  const fixedKeys = [
    DIETARY_PROFILE_STORAGE_KEY,
    FAVORITE_STORAGE_KEY,
    MEAL_PLAN_STORAGE_KEY,
    RECIPE_FEEDBACK_STORAGE_KEY,
    SHOPPING_MANUAL_STORAGE_KEY,
    SHOPPING_CHECKED_STORAGE_KEY,
  ]
  if (!keys) {
    removeStorageKeys(fixedKeys)
    return false
  }

  return removeStorageKeys([
    ...fixedKeys,
    ...keys.filter(isOnlineCacheKey),
  ])
}
