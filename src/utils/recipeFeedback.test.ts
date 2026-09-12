import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getRecipeFeedback,
  getRecipeFeedbackMap,
  toggleRecipeFeedback,
} from '@/utils/recipeFeedback'
import { clearRecipeFeedbackData } from '@/utils/localData'
import { RECIPE_FEEDBACK_STORAGE_KEY } from '@/utils/storageKeys'

const createStorageMock = () => {
  let value: unknown
  const setStorageSync = vi.fn((_key: string, nextValue: unknown) => {
    value = nextValue
  })
  const removeStorageSync = vi.fn(() => {
    value = undefined
  })

  return {
    get value() {
      return value
    },
    api: {
      getStorageSync: vi.fn(() => value),
      setStorageSync,
      removeStorageSync,
    },
  }
}

describe('recipe feedback', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('读取时只保留有效反馈，并忽略空记录', () => {
    vi.stubGlobal('uni', {
      getStorageSync: vi.fn(() => ({
        r001: { recipeId: 'wrong-id', disliked: true, updatedAt: 10 },
        r002: { missingIngredients: 'yes' },
        r003: { cooked: true, updatedAt: 'bad' },
        '': { disliked: true },
      })),
    })

    expect(getRecipeFeedbackMap()).toEqual({
      r001: { recipeId: 'r001', disliked: true, missingIngredients: false, cooked: false, updatedAt: 10 },
      r003: { recipeId: 'r003', disliked: false, missingIngredients: false, cooked: true, updatedAt: 0 },
    })
  })

  it('可以切换反馈并在撤销最后一项后删除记录', () => {
    const storage = createStorageMock()
    vi.stubGlobal('uni', storage.api)

    expect(toggleRecipeFeedback('r001', 'missingIngredients')).toMatchObject({
      active: true,
      persisted: true,
      feedback: { recipeId: 'r001', missingIngredients: true },
    })
    expect(getRecipeFeedback('r001').missingIngredients).toBe(true)

    expect(toggleRecipeFeedback('r001', 'missingIngredients')).toMatchObject({
      active: false,
      persisted: true,
      feedback: { recipeId: 'r001', missingIngredients: false },
    })
    expect(getRecipeFeedbackMap()).toEqual({})
    expect(storage.api.setStorageSync).toHaveBeenLastCalledWith(RECIPE_FEEDBACK_STORAGE_KEY, {})
  })

  it('写入失败时保留原状态并报告失败', () => {
    vi.stubGlobal('uni', {
      getStorageSync: vi.fn(() => undefined),
      setStorageSync: vi.fn(() => { throw new Error('storage unavailable') }),
    })
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(toggleRecipeFeedback('r001', 'cooked')).toEqual({
      feedback: { recipeId: 'r001', disliked: false, missingIngredients: false, cooked: false, updatedAt: 0 },
      active: false,
      persisted: false,
    })
  })

  it('清除反馈时只删除反馈存储键', () => {
    const storage = createStorageMock()
    vi.stubGlobal('uni', storage.api)

    expect(clearRecipeFeedbackData()).toBe(true)
    expect(storage.api.removeStorageSync).toHaveBeenCalledWith(RECIPE_FEEDBACK_STORAGE_KEY)
  })
})
