# Extractable Components — 今天吃啥

本项目组件少而聚焦。**布局类**(每页出现)只有 SectionHeader 值得抽取;tabBar 为微信原生配置,不可抽为 HTML 组件(设计稿中以静态底栏模拟)。

## SectionHeader
- Source: `src/components/SectionHeader/SectionHeader.vue`
- Category: layout
- Description: 杂志编号章节头: 期刊编号(陶红衬线)+ 衬线标题 + 副标题 + 右侧动作(绿字+箭头),底部细规则线。首页/推荐/详情/在线详情/我的页共用。
- Extractable props: `index`(string, 编号如 "01"), `title`(string), `subtitle`(string), `actionText`(string, 空则不显示动作)
- Hardcoded: 规则线/排版/字体/颜色全部固定;箭头图标 Lucide arrow-right

## TabBar(仅设计稿模拟,非代码组件)
- Category: layout
- Description: 微信原生 tabBar,3 项: 选菜(utensils)/推荐(leaf)/我的(user-round);白底、未选 `#8a948c`、选中 `#2f6b4f`。
- Extractable props: `activeTab`("index" | "recommend" | "favorites")
- Hardcoded: 图标、文字、颜色;设计稿每页底部应渲染此栏(tab 页)

## RecipeCard
- Source: `src/components/RecipeCard/RecipeCard.vue`
- Category: basic
- Description: 菜谱卡: 3:2 图 + 匹配角标 + meta + 衬线标题 + 描述 + 推荐依据 + 已有/还需 + 标签 + 反馈按钮。用于首页/推荐/收藏。
- Extractable props: `matchScore`(number, 可空), `recommendationReason`(string, 可空), `showFeedback`(bool), `compact`(bool)
- Hardcoded: 卡片版式、反馈三按钮文案、标签样式

## Callout
- Source: `src/components/Callout/Callout.vue`
- Category: basic
- Description: 语气信息条(info/success/warning/error),左色条+图标+标题+正文。
- Extractable props: `tone`("info"|"success"|"warning"|"error"), `title`(string)
- Hardcoded: 四种颜色的图标/底色映射

## EmptyState
- Source: `src/components/EmptyState/EmptyState.vue`
- Category: basic
- Description: 虚线框空态: 圆底图标 + 描述 + 可选绿色按钮。
- Extractable props: `icon`(string), `description`(string), `actionText`(string)
- Hardcoded: 虚线边框、按钮样式

## BottomSheet
- Source: `src/components/BottomSheet/BottomSheet.vue`
- Category: basic
- Description: 底部弹层壳(遮罩+圆角面板+grabber+标题),内容用 slot。
- Extractable props: `visible`(bool), `title`(string)
- Hardcoded: 动画、grabber、关闭钮

## AppIcon
- Source: `src/components/AppIcon/AppIcon.vue`
- Category: basic
- Description: Lucide 线性图标(24 viewBox, stroke 2),以任意色/任意 rpx 尺寸渲染。全站唯一图标出口。
- Extractable props: `name`(string, lucide kebab-case), `size`(number, rpx), `color`(string)
- Hardcoded: 描边风格

**抽取建议**: 设计稿把 `TabBar`(模拟)和 `SectionHeader` 抽为 `<sd-component>` 保证 7 页一致;RecipeCard/Callout/EmptyState 内联即可。
