import type { HealthGroup } from '@/types/recipe'
import type { PlanTarget } from '@/types/mealPlan'

// Tab 页之间使用一次性内存状态传递上下文，避免依赖 switchTab 的 query 参数。
let pendingGroup: HealthGroup | undefined
let pendingPlanTarget: PlanTarget | undefined

export const setPendingRecommendGroup = (group: HealthGroup): void => {
  pendingGroup = group
}

export const consumePendingRecommendGroup = (): HealthGroup | undefined => {
  const group = pendingGroup
  pendingGroup = undefined
  return group
}

export const setPendingPlanTarget = (target: PlanTarget): void => {
  pendingPlanTarget = { ...target }
}

export const peekPendingPlanTarget = (): PlanTarget | undefined => {
  return pendingPlanTarget ? { ...pendingPlanTarget } : undefined
}

export const consumePendingPlanTarget = (): PlanTarget | undefined => {
  const target = peekPendingPlanTarget()
  pendingPlanTarget = undefined
  return target
}

export const clearPendingPlanTarget = (): void => {
  pendingPlanTarget = undefined
}
