import { RECIPE_FEEDBACK_STORAGE_KEY } from '@/utils/storageKeys'
import type {
  RecipeFeedbackKind,
  RecipeFeedbackMap,
  RecipeFeedbackRecord,
} from '@/types/recipeFeedback'
import type { Recipe } from '@/types/recipe'

const feedbackKinds: RecipeFeedbackKind[] = ['disliked', 'missingIngredients', 'cooked']

const createEmptyFeedback = (recipeId: string): RecipeFeedbackRecord => ({
  recipeId,
  disliked: false,
  missingIngredients: false,
  cooked: false,
  updatedAt: 0,
})

const normalizeFeedbackRecord = (recipeId: string, value: unknown): RecipeFeedbackRecord | undefined => {
  if (!value || typeof value !== 'object') return undefined

  const record = value as Partial<RecipeFeedbackRecord>
  const normalized = createEmptyFeedback(recipeId)
  feedbackKinds.forEach((kind) => {
    normalized[kind] = record[kind] === true
  })
  normalized.updatedAt = typeof record.updatedAt === 'number' && Number.isFinite(record.updatedAt)
    ? record.updatedAt
    : 0

  return normalized.disliked || normalized.missingIngredients || normalized.cooked
    ? normalized
    : undefined
}

const normalizeFeedbackMap = (value: unknown): RecipeFeedbackMap => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const result: RecipeFeedbackMap = {}
  Object.entries(value).forEach(([recipeId, record]) => {
    if (!recipeId.trim()) return
    const normalized = normalizeFeedbackRecord(recipeId, record)
    if (normalized) result[recipeId] = normalized
  })
  return result
}

const saveFeedbackMap = (feedbackMap: RecipeFeedbackMap): boolean => {
  try {
    uni.setStorageSync(RECIPE_FEEDBACK_STORAGE_KEY, feedbackMap)
    return true
  } catch (error) {
    console.error('[RecipeFeedback] 保存推荐反馈失败', error)
    return false
  }
}

export const getRecipeFeedbackMap = (): RecipeFeedbackMap => {
  try {
    return normalizeFeedbackMap(uni.getStorageSync(RECIPE_FEEDBACK_STORAGE_KEY))
  } catch (error) {
    console.error('[RecipeFeedback] 读取推荐反馈失败', error)
    return {}
  }
}

export const getRecipeFeedback = (recipeId: string): RecipeFeedbackRecord => {
  return getRecipeFeedbackMap()[recipeId] ?? createEmptyFeedback(recipeId)
}

export const getRecipeFeedbackPenalty = (feedback?: RecipeFeedbackRecord): number => {
  if (!feedback) return 0
  return (feedback.missingIngredients ? 12 : 0) + (feedback.cooked ? 6 : 0)
}

export const filterRecipesByFeedback = (
  recipes: Recipe[],
  feedbackMap: RecipeFeedbackMap,
): Recipe[] => {
  return recipes.filter((recipe) => !feedbackMap[recipe.id]?.disliked)
}

export const sortRecipesByFeedback = (
  recipes: Recipe[],
  feedbackMap: RecipeFeedbackMap,
): Recipe[] => {
  return recipes
    .map((recipe, index) => ({
      recipe,
      index,
      rankingScore: -getRecipeFeedbackPenalty(feedbackMap[recipe.id]),
    }))
    .sort((a, b) => b.rankingScore - a.rankingScore || a.index - b.index)
    .map((item) => item.recipe)
}

export const getRecipeFeedbackCount = (feedbackMap = getRecipeFeedbackMap()): number => {
  return Object.keys(feedbackMap).length
}

export interface ToggleRecipeFeedbackResult {
  feedback: RecipeFeedbackRecord
  active: boolean
  persisted: boolean
}

export const toggleRecipeFeedback = (
  recipeId: string,
  kind: RecipeFeedbackKind,
): ToggleRecipeFeedbackResult => {
  const currentMap = getRecipeFeedbackMap()
  const current = currentMap[recipeId] ?? createEmptyFeedback(recipeId)
  const active = !current[kind]
  const next = { ...current, [kind]: active, updatedAt: Date.now() }
  const nextMap = { ...currentMap }

  if (next.disliked || next.missingIngredients || next.cooked) {
    nextMap[recipeId] = next
  } else {
    delete nextMap[recipeId]
  }

  const persisted = saveFeedbackMap(nextMap)
  return {
    feedback: persisted ? (nextMap[recipeId] ?? createEmptyFeedback(recipeId)) : current,
    active: persisted ? active : current[kind],
    persisted,
  }
}
