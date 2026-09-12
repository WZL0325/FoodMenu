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

const emit = defineEmits<{
  feedbackChange: [event: RecipeFeedbackEvent]
}>()

const imageFailed = ref(false)
const feedback = ref<RecipeFeedbackRecord>(props.feedback ?? getRecipeFeedback(props.recipe.id))
watch([() => props.recipe.id, () => props.feedback], () => {
  feedback.value = props.feedback ?? getRecipeFeedback(props.recipe.id)
}, { deep: true })
watch([() => props.recipe.id, () => props.recipe.image], () => {
  imageFailed.value = false
})

const healthTagClass = (tag: string): string => {
  if (['低脂', '少油', '植物蛋白'].includes(tag)) return 'tagSuccess'
  if (['低糖', '控糖', '少盐', '高蛋白'].includes(tag)) return 'tagInfo'
  return 'tagWarm'
}
const handleCardClick = (recipe: Recipe) => {
  uni.navigateTo({ url: `/pages/detail/index?id=${encodeURIComponent(recipe.id)}` })
}
const handleImageError = () => {
  imageFailed.value = true
}
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
  emit('feedbackChange', {
    recipeId: props.recipe.id,
    kind,
    active: result.active,
  })
  uni.showToast({
    title: result.active ? `已记录：${feedbackLabel(kind)}` : `已撤销：${feedbackLabel(kind)}`,
    icon: 'none',
  })
}
</script>

<template>
  <view class="card" :class="{ compactCard: compact }" @tap="handleCardClick(recipe)">
    <view class="figure">
      <image
        v-if="!imageFailed"
        class="image"
        :src="recipe.image"
        mode="aspectFill"
        lazy-load
        @error="handleImageError"
      />
      <view v-else class="image imageFallback">
        <AppIcon name="utensils" :size="64" color="#ED6A3C" />
        <text class="fallbackTitle">{{ recipe.title }}</text>
        <text class="fallbackHint">图片暂不可用，可查看用料与做法</text>
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
          <view class="metaItem">
            <AppIcon name="clock" :size="24" color="#8A7A6D" />
            <text>{{ recipe.cookingTime }} 分钟</text>
          </view>
          <view class="metaItem">
            <AppIcon name="flame" :size="24" color="#8A7A6D" />
            <text>{{ recipe.nutrition.calories }} kcal</text>
          </view>
        </view>
      </view>
      <text class="title">{{ recipe.title }}</text>
      <text class="desc">{{ recipe.description }}</text>
      <view class="tags">
        <text v-for="tag in recipe.healthTags.slice(0, 3)" :key="tag" class="tag" :class="healthTagClass(tag)">{{ tag }}</text>
        <text class="tag tagDifficulty">{{ recipe.difficulty }}</text>
      </view>
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
      <view v-if="showFeedback" class="feedbackActions">
        <button
          class="feedbackAction"
          :class="{ feedbackActionActive: feedback.disliked }"
          :aria-pressed="feedback.disliked"
          @tap.stop="handleFeedback('disliked')"
        >{{ feedback.disliked ? '已不喜欢' : '不喜欢' }}</button>
        <button
          class="feedbackAction"
          :class="{ feedbackActionActive: feedback.missingIngredients }"
          :aria-pressed="feedback.missingIngredients"
          @tap.stop="handleFeedback('missingIngredients')"
        >{{ feedback.missingIngredients ? '已标记不齐' : '食材不齐' }}</button>
        <button
          class="feedbackAction"
          :class="{ feedbackActionCooked: feedback.cooked }"
          :aria-pressed="feedback.cooked"
          @tap.stop="handleFeedback('cooked')"
        >{{ feedback.cooked ? '已做过' : '做过了' }}</button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.card {
  width: 100%;
  overflow: hidden;
  font-family: $font-family-sans;
  background: $color-bg-card;
  border-radius: $radius-xl;
  box-shadow: $shadow-card;
  transition: box-shadow $transition-fast;
}

.card:active {
  box-shadow: $shadow-card-hover;
}

.compactCard {
  @include scroll-x-item(320rpx);
  margin-right: $spacing-md;
  border-radius: $radius-lg;
}

.figure {
  position: relative;
  height: 0;
  padding-bottom: 66.666667%;
  overflow: hidden;
  background: $color-bg-hover;
}

.image {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

.imageFallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: $spacing-sm;
  padding: $spacing-md;
  background: $color-bg-hover;
  text-align: center;
}

.fallbackTitle {
  max-width: 100%;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  @include text-ellipsis;
}

.fallbackHint {
  color: $color-text-tertiary;
  font-size: $font-size-xs;
  line-height: $line-height-normal;
}

.compactCard .fallbackHint {
  display: none;
}

.scoreBadge {
  position: absolute;
  top: $spacing-md;
  right: $spacing-md;
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 18rpx;
  color: $color-text-white;
  background: $color-primary;
  border-radius: $radius-round;
  box-shadow: 0 4rpx 12rpx rgba(43, 32, 24, 0.12);
  line-height: $line-height-normal;
}

.scoreNum {
  font-size: $font-size-sm;
  font-weight: $font-weight-bold;
  font-variant-numeric: tabular-nums;
}

.scoreLabel {
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
}

.content {
  padding: $spacing-md $spacing-lg $spacing-lg;
}

.metaRow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-xs $spacing-sm;
  margin-bottom: $spacing-sm;
}

.category {
  max-width: 100%;
  padding: 4rpx 14rpx;
  color: $color-primary-dark;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  line-height: $line-height-normal;
  background: $color-primary-alpha-08;
  border-radius: $radius-round;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs $spacing-sm;
}

.metaItem {
  display: flex;
  align-items: center;
  gap: 6rpx;
  color: $color-text-secondary;
  font-size: $font-size-xs;
  white-space: nowrap;
}

.title {
  display: block;
  color: $color-text-primary;
  font-size: $font-size-xxl;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
  overflow-wrap: break-word;
}

.desc {
  display: block;
  margin-top: $spacing-xs;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  line-height: $line-height-loose;
  @include text-ellipsis-multi(2);
}

.reasonInfo {
  margin-top: $spacing-md;
  padding: $spacing-sm $spacing-md;
  background: $color-warning-alpha-07;
  border-radius: $radius-md;
}

.reasonLabel {
  display: block;
  color: $color-primary-dark;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
}

.reasonText {
  display: block;
  margin-top: 4rpx;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  line-height: $line-height-normal;
}

.matchInfo {
  margin-top: $spacing-md;
  padding-top: $spacing-sm;
  border-top: 2rpx solid $color-divider;
}

.matchRow {
  display: flex;
  gap: $spacing-sm;
  padding: 6rpx 0;
  font-size: $font-size-sm;
  line-height: $line-height-normal;
}

.matchKey {
  color: $color-text-tertiary;
  font-weight: $font-weight-medium;
  flex-shrink: 0;
}

.matchVal {
  flex: 1;
  min-width: 0;
  color: $color-text-secondary;
  overflow-wrap: break-word;
}

.matchHave {
  color: $color-success;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  margin-top: $spacing-sm;
}

.tag {
  padding: 5rpx 14rpx;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  line-height: $line-height-normal;
  border-radius: $radius-round;
}

.tagSuccess {
  color: $color-success;
  background: #E8F3E2;
}

.tagInfo {
  color: $color-info;
  background: #E4F0FA;
}

.tagWarm {
  color: $color-primary-dark;
  background: #FFF3E4;
}

.tagDifficulty {
  color: $color-text-secondary;
  background: $color-bg-hover;
}

.feedbackActions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
  margin-top: $spacing-md;
  padding-top: $spacing-md;
  border-top: 2rpx solid $color-divider;
}

.feedbackAction {
  @include button-reset;
  flex: 1 1 140rpx;
  min-height: 88rpx;
  padding: 12rpx 16rpx;
  color: $color-text-secondary;
  font-family: $font-family-sans;
  font-size: $font-size-xs;
  font-weight: $font-weight-medium;
  line-height: $line-height-normal;
  white-space: normal;
  text-align: center;
  background: $color-bg-hover;
  border: 2rpx solid transparent;
  border-radius: $radius-round;
  transition: background-color $transition-fast;
}

.feedbackAction:active {
  background: $color-primary-alpha-12;
}

.feedbackActionActive {
  color: $color-primary-dark;
  background: $color-primary-alpha-08;
  border-color: $color-primary-light;
}

.feedbackActionCooked {
  color: $color-success;
  background: #E8F3E2;
  border-color: $color-success;
}

.compactCard .content {
  padding: $spacing-md;
}

.compactCard .title {
  font-size: $font-size-lg;
}

.compactCard .scoreBadge {
  top: $spacing-sm;
  right: $spacing-sm;
  padding: 6rpx 14rpx;
}

.compactCard .scoreNum {
  font-size: $font-size-xs;
}
</style>
