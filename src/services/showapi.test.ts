import { describe, expect, it } from 'vitest'
import { mergeIngredientOptions } from '@/services/showapi'
import type { IngredientOption } from '@/types/recipe'

describe('mergeIngredientOptions', () => {
  const localOptions: IngredientOption[] = [
    { id: 'local-tomato', name: '番茄', type: 'vegetable', common: true },
    { id: 'local-egg', name: '鸡蛋', type: 'eggSoy', common: true },
  ]

  it('保留本地食材配置并追加在线食材', () => {
    const result = mergeIngredientOptions(localOptions, [
      { id: 'remote-tomato', name: '番茄', type: 'vegetable' },
      { id: 'remote-lotus-root', name: '藕', type: 'vegetable' },
    ])

    expect(result).toEqual([
      ...localOptions,
      { id: 'remote-lotus-root', name: '藕', type: 'vegetable' },
    ])
    expect(result[0].common).toBe(true)
  })

  it('不会修改传入的本地数组', () => {
    const before = [...localOptions]
    mergeIngredientOptions(localOptions, [{ id: 'remote-beef', name: '牛肉', type: 'meat' }])
    expect(localOptions).toEqual(before)
  })
})

