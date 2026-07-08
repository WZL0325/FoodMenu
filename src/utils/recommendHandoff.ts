import type { HealthGroup } from '@/types/recipe';

// 一次性参数传递:详情页点击人群标签 → switchTab 到推荐页(tabBar 页无法用 URL query)。
// 推荐页在 useDidShow 中读取并清空。
let pendingGroup: HealthGroup | undefined;

export const setPendingRecommendGroup = (group: HealthGroup): void => {
  pendingGroup = group;
};

export const consumePendingRecommendGroup = (): HealthGroup | undefined => {
  const g = pendingGroup;
  pendingGroup = undefined;
  return g;
};
