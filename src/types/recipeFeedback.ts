export type RecipeFeedbackKind = 'disliked' | 'missingIngredients' | 'cooked'

export interface RecipeFeedbackRecord {
  recipeId: string
  disliked: boolean
  missingIngredients: boolean
  cooked: boolean
  updatedAt: number
}

export type RecipeFeedbackMap = Record<string, RecipeFeedbackRecord>

export interface RecipeFeedbackEvent {
  recipeId: string
  kind: RecipeFeedbackKind
  active: boolean
}
