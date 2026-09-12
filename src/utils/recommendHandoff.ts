import type { HealthGroup } from '@/types/recipe'

// 一次性参数传递：详情页点击人群标签 → switchTab 到推荐页。
let pendingGroup: HealthGroup | undefined

export const setPendingRecommendGroup = (group: HealthGroup): void => {
  pendingGroup = group
}

export const consumePendingRecommendGroup = (): HealthGroup | undefined => {
  const group = pendingGroup
  pendingGroup = undefined
  return group
}
