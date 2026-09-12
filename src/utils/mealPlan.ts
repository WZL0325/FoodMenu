import type { Recipe } from '@/types/recipe'
import type { MealPlanEntry, MealType, ShoppingListItem, WeekDay } from '@/types/mealPlan'
import {
  MEAL_PLAN_STORAGE_KEY,
  SHOPPING_CHECKED_STORAGE_KEY,
  SHOPPING_MANUAL_STORAGE_KEY,
} from '@/utils/storageKeys'

export const mealOptions: { id: MealType, label: string }[] = [
  { id: 'breakfast', label: '早餐' },
  { id: 'lunch', label: '午餐' },
  { id: 'dinner', label: '晚餐' },
]

const mealTypes = new Set<MealType>(mealOptions.map((item) => item.id))
const datePattern = /^\d{4}-\d{2}-\d{2}$/

const normalizeTextList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return [...new Set(value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean))]
}

const normalizePlanEntries = (value: unknown): MealPlanEntry[] => {
  if (!Array.isArray(value)) return []

  const entries = new Map<string, MealPlanEntry>()
  value.forEach((item) => {
    if (!item || typeof item !== 'object') return
    const entry = item as Partial<MealPlanEntry>
    if (!entry.date || !datePattern.test(entry.date) || !entry.meal || !mealTypes.has(entry.meal) || !entry.recipeId) return
    entries.set(`${entry.date}:${entry.meal}`, {
      date: entry.date,
      meal: entry.meal,
      recipeId: entry.recipeId,
    })
  })

  return [...entries.values()]
}

const readTextList = (key: string, label: string): string[] => {
  try {
    return normalizeTextList(uni.getStorageSync(key))
  } catch (error) {
    console.error(`[MealPlan] 读取${label}失败`, error)
    return []
  }
}

const saveTextList = (key: string, value: string[], label: string): boolean => {
  try {
    uni.setStorageSync(key, normalizeTextList(value))
    return true
  } catch (error) {
    console.error(`[MealPlan] 保存${label}失败`, error)
    return false
  }
}

export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const getWeekDays = (reference = new Date()): WeekDay[] => {
  const todayKey = formatLocalDate(reference)
  const start = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate())
  const offset = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - offset)
  const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

  return labels.map((weekday, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
    const key = formatLocalDate(date)
    return {
      key,
      weekday,
      dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
      isToday: key === todayKey,
    }
  })
}

export const getDefaultMealType = (reference = new Date()): MealType => {
  const hour = reference.getHours()
  if (hour < 10) return 'breakfast'
  if (hour < 16) return 'lunch'
  return 'dinner'
}

export const getMealPlanEntries = (): MealPlanEntry[] => {
  try {
    return normalizePlanEntries(uni.getStorageSync(MEAL_PLAN_STORAGE_KEY))
  } catch (error) {
    console.error('[MealPlan] 读取本周计划失败', error)
    return []
  }
}

export const saveMealPlanEntries = (entries: MealPlanEntry[]): boolean => {
  try {
    uni.setStorageSync(MEAL_PLAN_STORAGE_KEY, normalizePlanEntries(entries))
    return true
  } catch (error) {
    console.error('[MealPlan] 保存本周计划失败', error)
    return false
  }
}

export const upsertMealPlanEntry = (entries: MealPlanEntry[], nextEntry: MealPlanEntry): MealPlanEntry[] => {
  return [
    ...entries.filter((entry) => entry.date !== nextEntry.date || entry.meal !== nextEntry.meal),
    nextEntry,
  ]
}

export const removeMealPlanEntry = (entries: MealPlanEntry[], date: string, meal: MealType): MealPlanEntry[] => {
  return entries.filter((entry) => entry.date !== date || entry.meal !== meal)
}

export const getCurrentWeekPlanEntries = (entries: MealPlanEntry[], reference = new Date()): MealPlanEntry[] => {
  const weekKeys = new Set(getWeekDays(reference).map((day) => day.key))
  return entries.filter((entry) => weekKeys.has(entry.date))
}

export const getManualShoppingItems = (): string[] => {
  return readTextList(SHOPPING_MANUAL_STORAGE_KEY, '手动购物项')
}

export const saveManualShoppingItems = (items: string[]): boolean => {
  return saveTextList(SHOPPING_MANUAL_STORAGE_KEY, items, '手动购物项')
}

export const getCheckedShoppingItems = (): string[] => {
  return readTextList(SHOPPING_CHECKED_STORAGE_KEY, '购物勾选状态')
}

export const saveCheckedShoppingItems = (items: string[]): boolean => {
  return saveTextList(SHOPPING_CHECKED_STORAGE_KEY, items, '购物勾选状态')
}

export const buildShoppingList = (
  entries: MealPlanEntry[],
  recipeList: Recipe[],
  manualItems: string[],
): ShoppingListItem[] => {
  const recipeMap = new Map(recipeList.map((recipe) => [recipe.id, recipe]))
  const items = new Map<string, ShoppingListItem>()

  entries.forEach((entry) => {
    const recipe = recipeMap.get(entry.recipeId)
    if (!recipe) return
    recipe.ingredients.forEach((name) => {
      const existing = items.get(name)
      items.set(name, {
        name,
        mealCount: (existing?.mealCount ?? 0) + 1,
        manual: false,
      })
    })
  })

  normalizeTextList(manualItems).forEach((name) => {
    if (!items.has(name)) items.set(name, { name, mealCount: 0, manual: true })
  })

  return [...items.values()]
}
