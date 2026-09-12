import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearAllManagedLocalData,
  clearDietaryProfileData,
  clearOnlineRecipeData,
  clearRecipeFeedbackData,
  getOnlineRecipeCacheCount,
} from '@/utils/localData'

const createStorageMock = (initialKeys: string[]) => {
  const keys = new Set(initialKeys)
  const removeStorageSync = vi.fn((key: string) => {
    keys.delete(key)
  })

  return {
    keys,
    api: {
      getStorageInfoSync: vi.fn(() => ({ keys: [...keys] })),
      removeStorageSync,
    },
    removeStorageSync,
  }
}

describe('local data management', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('只清除 ShowAPI 分类与菜谱缓存', () => {
    const storage = createStorageMock([
      'showapi_ingredient_options_v1',
      'showapi_recipe_v1_1001',
      'healthy_recipe_favorites',
      'unrelated_key',
    ])
    vi.stubGlobal('uni', storage.api)

    expect(getOnlineRecipeCacheCount()).toBe(1)
    expect(clearOnlineRecipeData()).toBe(true)
    expect([...storage.keys]).toEqual(['healthy_recipe_favorites', 'unrelated_key'])
  })

  it('一键清理不会删除项目未管理的存储项', () => {
    const storage = createStorageMock([
      'healthy_recipe_dietary_profile',
      'healthy_recipe_favorites',
      'healthy_recipe_meal_plan_v1',
      'healthy_recipe_feedback_v1',
      'healthy_recipe_shopping_manual_v1',
      'healthy_recipe_shopping_checked_v1',
      'showapi_ingredient_options_v1',
      'showapi_recipe_v1_1001',
      'unrelated_key',
    ])
    vi.stubGlobal('uni', storage.api)

    expect(clearAllManagedLocalData()).toBe(true)
    expect([...storage.keys]).toEqual(['unrelated_key'])
  })

  it('删除操作失败时返回 false', () => {
    vi.stubGlobal('uni', {
      getStorageInfoSync: vi.fn(() => ({ keys: [] })),
      removeStorageSync: vi.fn(() => { throw new Error('storage unavailable') }),
    })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(clearDietaryProfileData()).toBe(false)
  })

  it('可以清除本地菜谱反馈', () => {
    const storage = createStorageMock(['healthy_recipe_feedback_v1', 'healthy_recipe_favorites'])
    vi.stubGlobal('uni', storage.api)

    expect(clearRecipeFeedbackData()).toBe(true)
    expect([...storage.keys]).toEqual(['healthy_recipe_favorites'])
  })
})
