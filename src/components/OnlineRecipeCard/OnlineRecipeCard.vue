<script setup lang="ts">
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import type { ShowApiRecipe } from '@/types/showapi'

defineProps<{
  recipe: ShowApiRecipe
}>()

const emit = defineEmits<{
  open: [recipe: ShowApiRecipe]
}>()
</script>

<template>
  <view class="card" @tap="emit('open', recipe)">
    <view class="visual">
      <text class="visualMark">食谱</text>
      <view class="ingredientPreview">
        <text
          v-for="ingredient in recipe.ingredients.slice(0, 4)"
          :key="ingredient.name"
          class="ingredientPreviewItem"
        >{{ ingredient.name }}</text>
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
        <text
          v-for="ingredient in recipe.ingredients.slice(0, 5)"
          :key="ingredient.name"
          class="ingredientTag"
        >{{ ingredient.name }}</text>
        <text v-if="recipe.ingredients.length > 5" class="ingredientMore">+{{ recipe.ingredients.length - 5 }}</text>
      </view>
      <view class="footer">
        <text>查看原料与做法</text>
        <view class="arrow">
          <AppIcon name="arrow-right" :size="26" color="#4A7FB5" />
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.card {
  display: flex;
  width: 100%;
  min-height: 300rpx;
  overflow: hidden;
  background: $color-bg-card;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;
  transition: transform $transition-fast;
}
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
