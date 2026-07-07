import type { HealthProfile } from '@/types/recipe';

export const healthProfiles: HealthProfile[] = [
  {
    id: '三高人群',
    title: '三高人群',
    description: '优先选择低盐、低糖、低脂、高纤维的清淡菜品。',
    avoidTips: ['少糖少油', '控制盐分', '避免肥肉和油炸'],
  },
  {
    id: '健身人群',
    title: '健身人群',
    description: '优先选择高蛋白、低脂、低精制碳水的菜品。',
    avoidTips: ['减少精制主食', '避免重油酱汁', '保证优质蛋白'],
  },
  {
    id: '婴儿辅食',
    title: '婴儿辅食',
    description: '优先选择软烂、少盐、易消化、食材简单的辅食。',
    avoidTips: ['不加盐糖', '避免蜂蜜', '食材充分煮熟'],
  },
  {
    id: '白领轻食',
    title: '白领轻食',
    description: '适合上班族的低负担、易准备、营养均衡菜品。',
    avoidTips: ['避免高油外卖', '控制总热量', '增加蔬菜比例'],
  },
  {
    id: '老年人',
    title: '老年人',
    description: '优先选择软嫩、易咀嚼、低盐且营养密度高的菜品。',
    avoidTips: ['口感软烂', '少盐少油', '避免过硬食材'],
  },
  {
    id: '控糖人群',
    title: '控糖人群',
    description: '优先选择低升糖、少淀粉、富含膳食纤维的菜品。',
    avoidTips: ['减少糖和淀粉', '增加绿叶菜', '选择瘦肉豆制品'],
  },
];
