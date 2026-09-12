export type MealType = 'breakfast' | 'lunch' | 'dinner'

export interface MealPlanEntry {
  date: string
  meal: MealType
  recipeId: string
}

export interface WeekDay {
  key: string
  weekday: string
  dateLabel: string
  isToday: boolean
}

export interface ShoppingListItem {
  name: string
  mealCount: number
  manual: boolean
}
