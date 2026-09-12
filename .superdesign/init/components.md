# Components — 今天吃啥 (uni-app + Vue 3 + TS, 微信小程序)

框架: Vue 3 `<script setup>` + uni-app 编译到 mp-weixin。模板用 uni-app 标签(`view`/`text`/`image`/`button`/`scroll-view`/`input`),样式 scoped SCSS,设计令牌来自 `src/styles/variables.scss`(自动注入,模板内直接用 `$color-primary` 等)。无第三方 UI 库,全部自绘。图标体系: Lucide,经 `AppIcon` 以 data-URI SVG 渲染,全站禁止 emoji。

## AppIcon — `src/components/AppIcon/AppIcon.vue`
通用图标组件(全站唯一图标出口)。props: `name`(lucide kebab-case 名,见 icons.ts)、`size`(rpx,默认 32)、`color`(默认 currentColor)、`strokeWidth`(默认 2)。

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { lucideIcons } from './icons'

const props = withDefaults(defineProps<{
  name: string
  size?: number
  color?: string
  strokeWidth?: number
}>(), {
  size: 32,
  color: 'currentColor',
  strokeWidth: 2,
})

const svg = computed(() => {
  const inner = lucideIcons[props.name]
  if (!inner) return ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${props.color}" stroke-width="${props.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`
})

const style = computed(() => {
  const url = svg.value
    ? `url("data:image/svg+xml,${encodeURIComponent(svg.value).replace(/'/g, '%27')}")`
    : 'none'
  return {
    width: `${props.size}rpx`,
    height: `${props.size}rpx`,
    backgroundImage: url,
  }
})
</script>

<template>
  <view class="appIcon" :style="style" />
</template>

<style lang="scss" scoped>
.appIcon {
  display: inline-block;
  background-repeat: no-repeat;
  background-position: center;
  background-size: 100% 100%;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
```

图标名清单(`src/components/AppIcon/icons.ts`,由 `scripts/gen-appicon.mjs` 从 lucide-static 生成): search, x, check, plus, minus, heart, refresh-cw, chevron-right, chevron-down, chevron-left, arrow-right, arrow-left, clock, flame, calendar, shopping-basket, trash-2, info, triangle-alert, leaf, utensils, sparkles, book-open, user-round, rotate-ccw, external-link, image-off, camera, check-check, circle-check, circle-x, bell, apple, wheat, egg, fish, carrot, drumstick, soup, salad, sandwich, clipboard-list, calendar-plus, share-2, folder-heart

## SectionHeader — `src/components/SectionHeader/SectionHeader.vue`
杂志编号章节头(几乎每页都用): 期刊编号 + 衬线标题 + 副标题 + 右侧动作,底部细规则线。

```vue
<script setup lang="ts">
import AppIcon from '@/components/AppIcon/AppIcon.vue'

withDefaults(defineProps<{
  index?: string
  title: string
  subtitle?: string
  actionText?: string
}>(), {
  index: '',
  subtitle: '',
  actionText: '',
})

const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <view class="sectionHeader">
    <view class="titleGroup">
      <view class="titleRow">
        <text v-if="index" class="index">{{ index }}</text>
        <text class="title">{{ title }}</text>
      </view>
      <text v-if="subtitle" class="subtitle" :class="{ subtitleIndented: index }">{{ subtitle }}</text>
    </view>
    <view v-if="actionText" class="action" @tap="emit('action')">
      <text class="actionText">{{ actionText }}</text>
      <AppIcon name="arrow-right" :size="26" color="#2f6b4f" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sectionHeader {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 100%;
  margin: $spacing-xl 0 $spacing-md;
  padding-bottom: $spacing-sm;
  border-bottom: 2rpx solid $color-rule;
}
.titleGroup { display: flex; flex-direction: column; min-width: 0; }
.titleRow { display: flex; align-items: baseline; gap: $spacing-sm; min-width: 0; }
.index {
  color: $color-warning;
  font-family: $font-family-serif;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  letter-spacing: 0.08em;
  flex-shrink: 0;
}
.title {
  color: $color-text-primary;
  font-family: $font-family-serif;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
}
.subtitle {
  margin-top: 6rpx;
  color: $color-text-tertiary;
  font-size: $font-size-sm;
  line-height: $line-height-normal;
  @include text-ellipsis;
}
.subtitleIndented { padding-left: 44rpx; }
.action {
  @include press;
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 8rpx 0 8rpx $spacing-md;
  flex-shrink: 0;
}
.actionText { color: $color-primary; font-size: $font-size-sm; font-weight: $font-weight-semibold; white-space: nowrap; }
</style>
```

## RecipeCard — `src/components/RecipeCard/RecipeCard.vue`
菜谱卡(首页/推荐页/收藏页共用): 3:2 大图 + 匹配度角标 + 分类/时长/热量 meta + 衬线标题 + 描述 + 推荐依据 + 已有/还需食材 + 健康标签 + 反馈按钮组。

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import type { Recipe } from '@/types/recipe'
import type { RecipeFeedbackEvent, RecipeFeedbackKind, RecipeFeedbackRecord } from '@/types/recipeFeedback'
import { getRecipeFeedback, toggleRecipeFeedback } from '@/utils/recipeFeedback'

const props = defineProps<{
  recipe: Recipe
  compact?: boolean
  matchScore?: number
  matchedIngredients?: string[]
  missingIngredients?: string[]
  showFeedback?: boolean
  feedback?: RecipeFeedbackRecord
  recommendationReason?: string
}>()

const emit = defineEmits<{ feedbackChange: [event: RecipeFeedbackEvent] }>()

const imageFailed = ref(false)
const feedback = ref<RecipeFeedbackRecord>(getRecipeFeedback(props.recipe.id))
watch(() => props.feedback, (nextFeedback) => {
  feedback.value = nextFeedback ?? getRecipeFeedback(props.recipe.id)
}, { deep: true })
const handleCardClick = (recipe: Recipe) => {
  uni.navigateTo({ url: `/pages/detail/index?id=${encodeURIComponent(recipe.id)}` })
}
const handleImageError = () => { imageFailed.value = true }
const feedbackLabel = (kind: RecipeFeedbackKind): string => {
  if (kind === 'disliked') return '不喜欢'
  if (kind === 'missingIngredients') return '食材不齐'
  return '做过了'
}
const handleFeedback = (kind: RecipeFeedbackKind) => {
  const result = toggleRecipeFeedback(props.recipe.id, kind)
  if (!result.persisted) {
    uni.showToast({ title: '反馈保存失败，请重试', icon: 'none' })
    return
  }
  feedback.value = result.feedback
  emit('feedbackChange', { recipeId: props.recipe.id, kind, active: result.active })
  uni.showToast({ title: result.active ? `已记录：${feedbackLabel(kind)}` : `已撤销：${feedbackLabel(kind)}`, icon: 'none' })
}
</script>

<template>
  <view class="card" :class="{ compactCard: compact }" @tap="handleCardClick(recipe)">
    <view class="figure">
      <image v-if="!imageFailed" class="image" :src="recipe.image" mode="aspectFill" lazy-load @error="handleImageError" />
      <view v-else class="image imageFallback">
        <AppIcon name="utensils" :size="64" color="#c9c3b4" />
        <text class="fallbackTitle">{{ recipe.title }}</text>
      </view>
      <view v-if="matchScore !== undefined" class="scoreBadge">
        <text class="scoreNum">{{ matchScore }}%</text>
        <text class="scoreLabel">匹配</text>
      </view>
    </view>
    <view class="content">
      <view class="metaRow">
        <text class="category">{{ recipe.category }}</text>
        <view class="meta">
          <view class="metaItem"><AppIcon name="clock" :size="24" color="#8a948c" /><text>{{ recipe.cookingTime }} 分钟</text></view>
          <view class="metaItem"><AppIcon name="flame" :size="24" color="#8a948c" /><text>{{ recipe.nutrition.calories }} kcal</text></view>
        </view>
      </view>
      <text class="title">{{ recipe.title }}</text>
      <text class="desc">{{ recipe.description }}</text>
      <view v-if="recommendationReason" class="reasonInfo">
        <text class="reasonLabel">推荐依据</text>
        <text class="reasonText">{{ recommendationReason }}</text>
      </view>
      <view v-if="matchScore !== undefined" class="matchInfo">
        <view class="matchRow">
          <text class="matchKey">已有</text>
          <text class="matchVal matchHave">{{ matchedIngredients?.length ? matchedIngredients.join('、') : '暂无' }}</text>
        </view>
        <view v-if="missingIngredients?.length" class="matchRow">
          <text class="matchKey">还需</text>
          <text class="matchVal">{{ missingIngredients.slice(0, 3).join('、') }}{{ missingIngredients.length > 3 ? ' 等' : '' }}</text>
        </view>
      </view>
      <view class="tags">
        <text v-for="tag in recipe.healthTags.slice(0, 3)" :key="tag" class="tag">{{ tag }}</text>
        <text class="tag tagDifficulty">{{ recipe.difficulty }}</text>
      </view>
      <view v-if="showFeedback" class="feedbackActions">
        <button class="feedbackAction" :class="{ feedbackActionActive: feedback.disliked }" @tap.stop="handleFeedback('disliked')">{{ feedback.disliked ? '已不喜欢' : '不喜欢' }}</button>
        <button class="feedbackAction" :class="{ feedbackActionActive: feedback.missingIngredients }" @tap.stop="handleFeedback('missingIngredients')">{{ feedback.missingIngredients ? '已标记食材不齐' : '食材不齐' }}</button>
        <button class="feedbackAction" :class="{ feedbackActionActive: feedback.cooked }" @tap.stop="handleFeedback('cooked')">{{ feedback.cooked ? '已做过' : '做过了' }}</button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.card {
  width: 100%;
  overflow: hidden;
  background: $color-bg-card;
  border: 2rpx solid $color-border;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;
  transition: transform $transition-spring, box-shadow $transition-base;
}
.card:active { transform: scale(0.98); box-shadow: $shadow-card-hover; }
.compactCard { @include scroll-x-item(300rpx); margin-right: $spacing-md; }
.figure { position: relative; }
.image { width: 100%; height: 248rpx; display: block; background: $color-bg-hover; }
.compactCard .image { height: 180rpx; }
.imageFallback {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: $spacing-sm;
  background: linear-gradient(135deg, $color-bg-page 0%, $color-bg-hover 100%);
}
.fallbackTitle { max-width: 80%; color: $color-text-tertiary; font-family: $font-family-serif; font-size: $font-size-sm; @include text-ellipsis; }
.scoreBadge {
  position: absolute; top: $spacing-sm; right: $spacing-sm;
  display: flex; flex-direction: column; align-items: center; padding: 8rpx 16rpx;
  background: rgba(247, 245, 240, 0.92); border: 2rpx solid $color-rule; border-radius: $radius-sm;
}
.scoreNum { color: $color-primary; font-family: $font-family-serif; font-size: $font-size-lg; font-weight: $font-weight-bold; line-height: 1.1; }
.scoreLabel { color: $color-text-tertiary; font-size: 18rpx; line-height: 1.2; }
.content { padding: $spacing-md $spacing-md $spacing-lg; }
.metaRow { display: flex; align-items: center; justify-content: space-between; gap: $spacing-sm; margin-bottom: $spacing-sm; }
.category { color: $color-warning; font-size: $font-size-xs; font-weight: $font-weight-semibold; letter-spacing: 0.14em; @include text-ellipsis; }
.meta { display: flex; gap: $spacing-sm; flex-shrink: 0; }
.metaItem { display: flex; align-items: center; gap: 6rpx; color: $color-text-tertiary; font-size: $font-size-xs; }
.title { display: block; color: $color-text-primary; font-family: $font-family-serif; font-size: $font-size-xl; font-weight: $font-weight-bold; line-height: $line-height-tight; }
.desc { display: block; margin-top: $spacing-xs; color: $color-text-secondary; font-size: $font-size-sm; line-height: $line-height-normal; @include text-ellipsis-multi(2); }
.reasonInfo { margin-top: $spacing-md; padding: $spacing-sm $spacing-md; background: $color-warning-alpha-07; border-left: 4rpx solid $color-warning; border-radius: $radius-sm; }
.reasonLabel { display: block; color: $color-warning; font-size: $font-size-xs; font-weight: $font-weight-semibold; }
.reasonText { display: block; margin-top: 4rpx; color: $color-text-secondary; font-size: $font-size-xs; line-height: $line-height-normal; }
.matchInfo { margin-top: $spacing-md; border-top: 2rpx solid $color-divider; border-bottom: 2rpx solid $color-divider; }
.matchRow { display: flex; gap: $spacing-sm; padding: 12rpx 0; font-size: $font-size-xs; line-height: $line-height-normal; }
.matchRow + .matchRow { border-top: 2rpx solid $color-divider; }
.matchKey { width: 64rpx; color: $color-text-tertiary; font-weight: $font-weight-semibold; flex-shrink: 0; }
.matchVal { flex: 1; color: $color-text-secondary; }
.matchHave { color: $color-success; }
.tags { display: flex; flex-wrap: wrap; gap: $spacing-xs; margin-top: $spacing-md; }
.tag { padding: 7rpx 14rpx; color: $color-primary-dark; font-size: $font-size-xs; line-height: 1; white-space: nowrap; background: $color-primary-light-alpha-12; border-radius: $radius-round; }
.tagDifficulty { color: $color-text-tertiary; background: $color-bg-page; border: 2rpx solid $color-border; }
.feedbackActions { display: flex; flex-wrap: wrap; gap: $spacing-xs; margin-top: $spacing-md; padding-top: $spacing-sm; border-top: 2rpx solid $color-divider; }
.feedbackAction {
  @include button-reset; @include press; min-height: 52rpx; padding: 8rpx 14rpx;
  color: $color-text-secondary; font-size: $font-size-xs; background: $color-bg-page;
  border: 2rpx solid transparent; border-radius: $radius-sm;
}
.feedbackActionActive { color: $color-primary-dark; background: $color-primary-light-alpha-10; border-color: $color-primary-light; }
</style>
```

## OnlineRecipeCard — `src/components/OnlineRecipeCard/OnlineRecipeCard.vue`
在线菜谱卡(ShowAPI,无图): 左侧蓝灰竖条(食谱章 + 食材预览)+ 右侧内容(来源/步数/标题/命中食材/标签/查看入口)。

```vue
<script setup lang="ts">
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import type { ShowApiRecipe } from '@/types/showapi'

defineProps<{ recipe: ShowApiRecipe }>()
const emit = defineEmits<{ open: [recipe: ShowApiRecipe] }>()
</script>

<template>
  <view class="card" @tap="emit('open', recipe)">
    <view class="visual">
      <text class="visualMark">食谱</text>
      <view class="ingredientPreview">
        <text v-for="ingredient in recipe.ingredients.slice(0, 4)" :key="ingredient.name" class="ingredientPreviewItem">{{ ingredient.name }}</text>
      </view>
    </view>
    <view class="content">
      <view class="sourceRow">
        <text class="source">在线扩展 · ShowAPI</text>
        <text class="stepCount">{{ recipe.steps.length }} 步</text>
      </view>
      <text class="title">{{ recipe.name }}</text>
      <text v-if="recipe.description" class="description">{{ recipe.description }}</text>
      <view v-if="recipe.matchedIngredients.length" class="matchRow">
        <text class="matchLabel">命中食材</text>
        <text class="matchValue">{{ recipe.matchedIngredients.join('、') }}</text>
      </view>
      <view class="ingredients">
        <text v-for="ingredient in recipe.ingredients.slice(0, 5)" :key="ingredient.name" class="ingredientTag">{{ ingredient.name }}</text>
        <text v-if="recipe.ingredients.length > 5" class="ingredientMore">+{{ recipe.ingredients.length - 5 }}</text>
      </view>
      <view class="footer">
        <text>查看原料与做法</text>
        <view class="arrow"><AppIcon name="arrow-right" :size="26" color="#2f6b4f" /></view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.card { display: flex; width: 100%; min-height: 300rpx; overflow: hidden; background: $color-bg-card; border: 2rpx solid $color-border; border-radius: $radius-lg; box-shadow: $shadow-card; transition: transform $transition-spring; }
.card:active { transform: scale(0.98); }
.visual { display: flex; flex-direction: column; justify-content: space-between; width: 190rpx; padding: $spacing-md; color: $color-text-white; background: $color-info; flex-shrink: 0; }
.visualMark { align-self: flex-start; padding: 6rpx 12rpx; font-size: $font-size-xs; font-weight: $font-weight-semibold; border: 2rpx solid rgba(255, 255, 255, .35); border-radius: $radius-sm; }
.ingredientPreview { display: flex; flex-direction: column; gap: $spacing-xs; }
.ingredientPreviewItem { color: rgba(255, 255, 255, .88); font-size: $font-size-xs; line-height: $line-height-normal; @include text-ellipsis; }
.content { flex: 1; min-width: 0; padding: $spacing-md; }
.sourceRow, .footer, .matchRow { display: flex; align-items: center; justify-content: space-between; gap: $spacing-sm; }
.source { color: $color-info; font-size: $font-size-xs; font-weight: $font-weight-semibold; }
.stepCount { color: $color-text-tertiary; font-size: $font-size-xs; white-space: nowrap; }
.title, .description { display: block; }
.title { margin-top: $spacing-xs; color: $color-text-primary; font-size: $font-size-lg; font-weight: $font-weight-bold; line-height: $line-height-tight; @include text-ellipsis; }
.description { margin-top: $spacing-sm; color: $color-text-secondary; font-size: $font-size-xs; line-height: $line-height-normal; @include text-ellipsis-multi(2); }
.matchRow { justify-content: flex-start; margin-top: $spacing-sm; }
.matchLabel { color: $color-success; font-size: $font-size-xs; font-weight: $font-weight-semibold; white-space: nowrap; }
.matchValue { min-width: 0; color: $color-text-secondary; font-size: $font-size-xs; @include text-ellipsis; }
.ingredients { display: flex; flex-wrap: wrap; gap: $spacing-xs; margin-top: $spacing-sm; }
.ingredientTag, .ingredientMore { padding: 6rpx 12rpx; color: $color-text-secondary; font-size: $font-size-xs; line-height: 1; background: $color-bg-page; border-radius: $radius-sm; }
.ingredientMore { color: $color-primary; }
.footer { margin-top: $spacing-md; padding-top: $spacing-sm; color: $color-primary; font-size: $font-size-xs; font-weight: $font-weight-semibold; border-top: 2rpx solid $color-divider; }
.arrow { display: flex; align-items: center; }
</style>
```

## Callout — `src/components/Callout/Callout.vue`
信息条(4 种语气): 左侧色条 + 图标 + 标题 + 插槽正文。

```vue
<script setup lang="ts">
import AppIcon from '@/components/AppIcon/AppIcon.vue'

defineOptions({ name: 'AppCallout' })

type CalloutTone = 'info' | 'success' | 'warning' | 'error'

const props = withDefaults(defineProps<{
  tone?: CalloutTone
  icon?: string
  title?: string
}>(), {
  tone: 'info',
  icon: '',
  title: '',
})

const toneConfig: Record<CalloutTone, { defaultIcon: string, color: string, bg: string }> = {
  info: { defaultIcon: 'info', color: '$color-info', bg: '$color-info-alpha-07' },
  success: { defaultIcon: 'circle-check', color: '$color-success', bg: '$color-primary-alpha-08' },
  warning: { defaultIcon: 'triangle-alert', color: '$color-warning', bg: '$color-warning-alpha-07' },
  error: { defaultIcon: 'circle-x', color: '$color-error', bg: '$color-error-alpha-07' },
}
const config = toneConfig[props.tone]
const iconName = props.icon || config.defaultIcon
const iconColor = props.tone === 'info' ? '#4f6d7a' : props.tone === 'success' ? '#3f7d55' : props.tone === 'warning' ? '#b95f3d' : '#c44747'
const barColor = iconColor
const bgStyle = props.tone === 'info' ? '#eef0f0' : props.tone === 'success' ? '#eaf1ec' : props.tone === 'warning' ? '#f7ece7' : '#f9ebea'
</script>

<template>
  <view class="callout" :style="{ background: bgStyle, borderLeftColor: barColor }">
    <view class="calloutIcon"><AppIcon :name="iconName" :size="30" :color="iconColor" /></view>
    <view class="calloutBody">
      <text v-if="title" class="calloutTitle" :style="{ color: iconColor }">{{ title }}</text>
      <slot />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.callout {
  display: flex; gap: $spacing-sm; padding: $spacing-md;
  border-left: 5rpx solid $color-info;
  border-radius: $radius-sm $radius-md $radius-md $radius-sm;
}
.calloutIcon { padding-top: 2rpx; }
.calloutBody { flex: 1; min-width: 0; }
.calloutTitle { display: block; margin-bottom: 4rpx; font-size: $font-size-sm; font-weight: $font-weight-semibold; }
</style>
```

## EmptyState — `src/components/EmptyState/EmptyState.vue`
空态: 虚线圆角框 + 圆底图标 + 描述 + 可选主色按钮。

```vue
<script setup lang="ts">
import AppIcon from '@/components/AppIcon/AppIcon.vue'

withDefaults(defineProps<{
  description: string
  icon?: string
  actionText?: string
}>(), {
  icon: 'image-off',
  actionText: '',
})

const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <view class="emptyState">
    <view class="emptyIcon"><AppIcon :name="icon" :size="56" color="#8a948c" /></view>
    <text class="emptyDesc">{{ description }}</text>
    <view v-if="actionText" class="emptyAction" @tap="emit('action')">
      <text>{{ actionText }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.emptyState {
  display: flex; flex-direction: column; align-items: center; gap: $spacing-sm;
  padding: 88rpx $spacing-lg; text-align: center;
  background: $color-bg-card; border: 2rpx dashed $color-border; border-radius: $radius-lg;
}
.emptyIcon { width: 112rpx; height: 112rpx; margin-bottom: $spacing-xs; @include flex-center; background: $color-bg-page; border-radius: $radius-round; }
.emptyDesc { color: $color-text-secondary; font-size: $font-size-sm; line-height: $line-height-normal; }
.emptyAction {
  @include press; margin-top: $spacing-xs; padding: 14rpx 40rpx;
  color: $color-text-white; font-size: $font-size-sm; font-weight: $font-weight-semibold;
  background: $color-primary; border-radius: $radius-button;
}
</style>
```

## BottomSheet — `src/components/BottomSheet/BottomSheet.vue`
底部弹层: 遮罩 + 圆角面板 + grabber + 标题/关闭,进出场动画,slot 内容。

```vue
<script setup lang="ts">
import { watch, ref } from 'vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'

const props = withDefaults(defineProps<{
  visible: boolean
  title?: string
}>(), { title: '' })

const emit = defineEmits<{ close: [] }>()

const rendered = ref(props.visible)
const leaving = ref(false)
watch(() => props.visible, (visible) => {
  if (visible) {
    leaving.value = false
    rendered.value = true
  } else if (rendered.value) {
    leaving.value = true
    setTimeout(() => {
      rendered.value = false
      leaving.value = false
    }, 280)
  }
})
const handleMaskTap = () => emit('close')
</script>

<template>
  <view v-if="rendered" class="sheetRoot" :class="{ sheetLeaving: leaving }" @tap="handleMaskTap" @touchmove.stop.prevent>
    <view class="sheetMask" />
    <view class="sheetPanel" :class="{ sheetPanelLeaving: leaving }" @tap.stop>
      <view class="sheetGrabber" />
      <view v-if="title" class="sheetHeader">
        <text class="sheetTitle">{{ title }}</text>
        <view class="sheetClose" @tap="handleMaskTap">
          <AppIcon name="x" :size="32" color="#55625a" />
        </view>
      </view>
      <slot />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sheetRoot { position: fixed; inset: 0; z-index: 999; }
.sheetMask { position: absolute; inset: 0; background: $color-scrim; animation: fadeIn 0.24s ease both; }
.sheetLeaving .sheetMask { animation: fadeIn 0.24s ease both reverse; }
.sheetPanel {
  position: absolute; left: 0; right: 0; bottom: 0; max-height: 78vh; overflow: hidden auto;
  padding: 16rpx $spacing-lg calc(env(safe-area-inset-bottom) + $spacing-lg);
  background: $color-bg-card; border-radius: $radius-xl $radius-xl 0 0;
  box-shadow: $shadow-popup; animation: slideUp $transition-slide both;
}
.sheetPanelLeaving { animation: slideDown 0.26s ease-in both; }
@keyframes slideDown {
  from { transform: translateY(0); }
  to { transform: translateY(100%); }
}
.sheetGrabber { width: 72rpx; height: 8rpx; margin: 0 auto $spacing-sm; background: $color-divider; border-radius: $radius-round; }
.sheetHeader { display: flex; align-items: center; justify-content: space-between; margin-bottom: $spacing-md; }
.sheetTitle { color: $color-text-primary; font-size: $font-size-lg; font-weight: $font-weight-bold; }
.sheetClose { @include press; width: 56rpx; height: 56rpx; @include flex-center; border-radius: $radius-round; background: $color-bg-page; }
</style>
```
