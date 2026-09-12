import type { HealthGroup, Recipe } from '@/types/recipe'

const preferredTags: Record<HealthGroup, string[]> = {
  三高人群: ['低盐', '低糖', '低脂', '高纤维'],
  健身人群: ['高蛋白', '低脂', '低糖', '低碳水', '饱腹', '快手菜'],
  婴儿辅食: ['软烂', '软嫩', '少盐', '易消化', '易吞咽', '无添加'],
  白领轻食: ['低脂', '高蛋白', '低糖', '高纤维', '快手菜', '饱腹'],
  老年人: ['软嫩', '软烂', '易消化', '低脂', '高蛋白', '温补'],
  控糖人群: ['低糖', '高纤维', '全谷物', '低脂'],
}

const groupTitles: Record<HealthGroup, string> = {
  三高人群: '三高人群',
  健身人群: '健身人群',
  婴儿辅食: '婴儿辅食',
  白领轻食: '白领轻食',
  老年人: '老年人',
  控糖人群: '控糖人群',
}

export const getHealthRecommendationReason = (recipe: Recipe, group: HealthGroup): string => {
  const matchedTags = preferredTags[group]
    .filter((tag) => recipe.healthTags.includes(tag))
    .slice(0, 3)

  if (matchedTags.length) {
    return `依据 ${matchedTags.join('、')} 等标签，符合${groupTitles[group]}的日常饮食方向`
  }

  return `已纳入${groupTitles[group]}参考范围，请结合用料、份量和小贴士选择`
}

