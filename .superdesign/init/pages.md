# Pages — 页面依赖树(今天吃啥)

## pages/index/index(首页 · 选菜)

Entry: `src/pages/index/index.vue`
Dependencies:
- `src/components/AppIcon/AppIcon.vue`
  - `src/components/AppIcon/icons.ts`
- `src/components/OnlineRecipeCard/OnlineRecipeCard.vue`
- `src/components/RecipeCard/RecipeCard.vue`
- `src/components/SectionHeader/SectionHeader.vue`
- `src/components/EmptyState/EmptyState.vue`
- `src/styles/variables.scss`(令牌,全局注入)
- 数据引用(纯逻辑,设计时不必读): `src/data/ingredients.ts`, `src/data/recipes.ts`, `src/services/showapi.ts`, `src/utils/recipeFilters.ts`, `src/utils/dietaryProfile.ts`, `src/utils/recipeFeedback.ts`

结构: hero 杂志封面卡(NO.120 期号/日期 masthead + eyebrow「今日餐桌」+ 衬线大标题「今晚，吃什么？」+ 副题 + 「帮我决定」墨绿胶囊按钮)→ 01 清点食材(白卡: 搜索条 + 9 分类横滑胶囊 + 已选标签横滑 + 双列食材格 + 底部已选汇总)→ 忌口状态条 → 02 全部菜谱/为你找到 N 道菜(RecipeCard 纵列,前 12 道) → 03 联网查更多(蓝灰 callout + 查更多按钮 + OnlineRecipeCard 列表)。

## pages/recommend/index(健康推荐)

Entry: `src/pages/recommend/index.vue`
Dependencies:
- `src/components/AppIcon/AppIcon.vue` (+ icons.ts)
- `src/components/Callout/Callout.vue`
- `src/components/EmptyState/EmptyState.vue`
- `src/components/RecipeCard/RecipeCard.vue`
- `src/components/SectionHeader/SectionHeader.vue`

结构: pageIntro(eyebrow「饮食目标」+ 衬线标题 + 描述)→ 6 人群横滑胶囊(白底细边框,选中墨绿填充)→ 忌口生效 callout → 今日提醒卡(陶红浅底: 铃铛 + 人群标题 + 描述 + avoidTips 列表)→ 01 推荐 N 道(RecipeCard 带「推荐依据」条)→ 健康边界声明 callout。

## pages/detail/index(菜谱详情)

Entry: `src/pages/detail/index.vue`
Dependencies:
- `src/components/AppIcon/AppIcon.vue` (+ icons.ts)
- `src/components/BottomSheet/BottomSheet.vue`
- `src/components/Callout/Callout.vue`
- `src/components/EmptyState/EmptyState.vue`
- `src/components/SectionHeader/SectionHeader.vue`

结构: 440rpx 大图封面(加载失败降级为渐变+菜名)→ 文章头(陶红分类标签 + 48rpx 衬线标题 + 分享胶囊/收藏圆钮 + 时长/热量/难度 meta 胶囊 + 描述)→ 忌口冲突 error callout → 「加入本周计划」通栏墨绿按钮 → 反馈面板(白卡: 三按钮)→ 01 用料(白底胶囊标签)→ 02 营养成分(白卡: 4 行标签+渐变进度条+衬线数值)→ 03 适宜人群(绿标签,可点跳推荐)→ 04 需注意人群(红标签)→ 05 烹饪步骤(衬线双位编号圆钮 + 标题 + 描述)→ 小贴士卡(陶红浅底)→ 健康声明 callout → BottomSheet(7 日横滑 + 早/中/晚三段 + 确认加入)。

## pages/online-detail/index(在线菜谱详情)

Entry: `src/pages/online-detail/index.vue`
Dependencies:
- `src/components/AppIcon/AppIcon.vue` (+ icons.ts)
- `src/components/Callout/Callout.vue`
- `src/components/EmptyState/EmptyState.vue`
- `src/components/SectionHeader/SectionHeader.vue`

结构: 蓝灰渐变封面(360rpx,external-link 来源标 + 衬线标题 + 前 5 食材白描边胶囊)→ 分类标签 + 标题行 + 分享(蓝灰调)→ 描述 → 来源声明 info callout → 01 用料(白卡行式: 名称/用量两列)→ 02 烹饪步骤(蓝灰编号圆钮)→ 小贴士 → 数据来源声明 callout。

## pages/favorites/index(我的 · tab3)

Entry: `src/pages/favorites/index.vue`
Dependencies:
- `src/components/AppIcon/AppIcon.vue` (+ icons.ts)
- `src/components/EmptyState/EmptyState.vue`
- `src/components/RecipeCard/RecipeCard.vue`
- `src/components/SectionHeader/SectionHeader.vue`

结构: pageIntro(eyebrow「个人偏好」+「我的饮食档案」)→ 01 饮食档案(白卡: 6 人群横滑胶囊 + 忌口标签云,选中红调 + 提示)→ 02 我的收藏(RecipeCard 列表或空态)→ 03 餐桌安排(墨绿图标方块入口行 → 本周计划)→ 04 隐私与数据(白卡面板: 说明行 + 5 条数据项清除行 + 通栏「清除全部本地数据」红描边按钮)。

## pages/meal-plan/index(本周计划)

Entry: `src/pages/meal-plan/index.vue`
Dependencies:
- `src/components/AppIcon/AppIcon.vue` (+ icons.ts)
- `src/components/Callout/Callout.vue`
- `src/components/EmptyState/EmptyState.vue`

结构: pageIntro(eyebrow「本周餐桌」+「计划好，再去买菜」+ 已安排 N 餐次)→ 分段控件(本周计划|购物清单)→ 计划视图: 7 个日卡(今天 TODAY 徽章 + 日期 + 早/中/晚三行: 空「去选一道」绿字或菜名+时长+移除)→「继续选菜」墨绿按钮; 购物视图: 深绿汇总头(采购进度 + 衬线大百分比) + 渐变进度条 + 手动添加输入行 + 白卡勾选清单(勾选划线) + 重置勾选 + 数据边界 callout。

## pages/privacy/index(隐私与数据说明)

Entry: `src/pages/privacy/index.vue`
Dependencies: 无组件依赖(纯排版页,仅用令牌)

结构: 引言(eyebrow「隐私与安全」+ 衬线标题 + 更新日期 + 摘要,底规则线)→ 01 保存在本机的数据 / 02 联网查询的数据 / 03 删除与控制 / 04 健康信息边界(各节: 陶红编号 + 衬线节标题 + 段落,节间分割线)→ 底部说明 + 「返回」按钮。
