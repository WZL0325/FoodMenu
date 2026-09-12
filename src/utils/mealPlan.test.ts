import { afterEach, describe, expect, it, vi } from 'vitest'
import { recipes } from '@/data/recipes'
import {
  buildShoppingList,
  getMealPlanEntries,
  getWeekDays,
  removeMealPlanEntry,
  upsertMealPlanEntry,
} from '@/utils/mealPlan'
import type { MealPlanEntry } from '@/types/mealPlan'

describe('meal plan', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('以周一为一周起点生成连续 7 天', () => {
    const days = getWeekDays(new Date(2026, 7, 30, 12))

    expect(days.map((day) => day.key)).toEqual([
      '2026-08-24',
      '2026-08-25',
      '2026-08-26',
      '2026-08-27',
      '2026-08-28',
      '2026-08-29',
      '2026-08-30',
    ])
    expect(days[6].isToday).toBe(true)
  })

  it('同一日期和餐次只保留最后安排的菜谱', () => {
    const entries: MealPlanEntry[] = [{ date: '2026-08-29', meal: 'lunch', recipeId: 'r001' }]
    const result = upsertMealPlanEntry(entries, { date: '2026-08-29', meal: 'lunch', recipeId: 'r002' })

    expect(result).toEqual([{ date: '2026-08-29', meal: 'lunch', recipeId: 'r002' }])
    expect(removeMealPlanEntry(result, '2026-08-29', 'lunch')).toEqual([])
  })

  it('读取时过滤无效记录并按餐次去重', () => {
    vi.stubGlobal('uni', {
      getStorageSync: vi.fn(() => [
        { date: '2026-08-29', meal: 'lunch', recipeId: 'r001' },
        { date: '2026-08-29', meal: 'lunch', recipeId: 'r002' },
        { date: 'bad-date', meal: 'dinner', recipeId: 'r003' },
      ]),
    })

    expect(getMealPlanEntries()).toEqual([
      { date: '2026-08-29', meal: 'lunch', recipeId: 'r002' },
    ])
  })

  it('按计划餐次汇总食材并合并手动购物项', () => {
    const list = buildShoppingList([
      { date: '2026-08-29', meal: 'lunch', recipeId: 'r001' },
      { date: '2026-08-29', meal: 'dinner', recipeId: 'r002' },
    ], recipes, ['牛奶', '番茄', '牛奶'])

    expect(list.find((item) => item.name === '番茄')).toEqual({ name: '番茄', mealCount: 1, manual: false })
    expect(list.find((item) => item.name === '牛奶')).toEqual({ name: '牛奶', mealCount: 0, manual: true })
    expect(list.find((item) => item.name === '鸡胸肉')?.mealCount).toBe(1)
  })
})
