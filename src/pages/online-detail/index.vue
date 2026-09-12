<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
import SectionHeader from '@/components/SectionHeader/SectionHeader.vue'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import Callout from '@/components/Callout/Callout.vue'
import EmptyState from '@/components/EmptyState/EmptyState.vue'
import { getShowApiRecipe } from '@/services/showapi'
import type { ShowApiRecipe } from '@/types/showapi'

const recipe = ref<ShowApiRecipe>()

onLoad((options) => {
  const id = typeof options?.id === 'string' ? options.id : ''
  recipe.value = id ? getShowApiRecipe(id) : undefined
})

onShareAppMessage(() => ({
  title: recipe.value ? `${recipe.value.name} - 今天吃啥` : '今天吃啥 - 按食材找菜谱',
  path: '/pages/index/index',
}))

const categoryText = computed(() => {
  if (!recipe.value) return ''
  return recipe.value.categoryLevel3 || recipe.value.categoryLevel2 || recipe.value.categoryLevel1 || '在线菜谱'
})

const goHome = () => uni.switchTab({ url: '/pages/index/index' })
</script>

<template>
  <view v-if="recipe" class="page">
    <view class="cover">
      <view class="coverSourceRow">
        <AppIcon name="external-link" :size="26" color="rgba(255, 255, 255, 0.75)" />
        <text class="coverSource">在线扩展 · ShowAPI</text>
      </view>
      <text class="coverTitle">{{ recipe.name }}</text>
      <view class="coverIngredients">
        <text
          v-for="ingredient in recipe.ingredients.slice(0, 5)"
          :key="ingredient.name"
          class="coverIngredient"
        >{{ ingredient.name }}</text>
      </view>
    </view>
    <view class="body">
      <text class="categoryLabel">{{ categoryText }}</text>
      <view class="titleRow">
        <text class="title">{{ recipe.name }}</text>
        <button class="shareBtn" open-type="share">
          <AppIcon name="share-2" :size="28" color="#4A7FB5" />
          <text>分享</text>
        </button>
      </view>
      <text v-if="recipe.description" class="description">{{ recipe.description }}</text>

      <Callout tone="info">
        <text class="sourceNoticeText">该内容来自 ShowAPI 在线菜谱库，仅展示原料与做法；未提供可靠营养数据，不参与健康人群推荐。</text>
      </Callout>

      <view class="section">
        <SectionHeader index="01" title="用料" />
        <view class="ingredientList">
          <view v-for="ingredient in recipe.ingredients" :key="ingredient.name" class="ingredientRow">
            <text class="ingredientName">{{ ingredient.name }}</text>
            <text class="ingredientAmount">{{ ingredient.amount || '适量' }}</text>
          </view>
        </view>
      </view>

      <view class="section">
        <SectionHeader index="02" title="烹饪步骤" :subtitle="`共 ${recipe.steps.length} 步`" />
        <view class="steps">
          <view v-for="step in recipe.steps" :key="`${step.order}-${step.content}`" class="step">
            <view class="stepIndex"><text>{{ String(step.order).padStart(2, '0') }}</text></view>
            <text class="stepContent">{{ step.content }}</text>
          </view>
        </view>
      </view>

      <view v-if="recipe.tips" class="tipCard">
        <view class="tipIcon">
          <AppIcon name="sparkles" :size="30" color="#C15B2D" />
        </view>
        <view class="tipBody">
          <text class="tipLabel">小贴士</text>
          <text class="tipText">{{ recipe.tips }}</text>
        </view>
      </view>

      <Callout tone="info">
        <text class="sourceFooterText">数据来源：ShowAPI 菜谱大全。内容仅作烹饪参考，请自行核对过敏原、食材熟度与特殊人群饮食要求。</text>
      </Callout>
    </view>
  </view>
  <view v-else class="page empty">
    <EmptyState
      icon="book-open"
      description="在线菜谱缓存已失效，请返回首页重新查询。"
      action-text="返回首页"
      @action="goHome"
    />
  </view>
</template>

<style lang="scss" scoped>
.page { min-height: 100vh; padding-bottom: $spacing-xl; background: $color-bg-page; }

.cover {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 360rpx;
  padding: 48rpx $spacing-lg;
  color: $color-text-white;
  background: linear-gradient(150deg, #5d7d8c 0%, $color-info 100%);
}
.coverSourceRow { display: flex; align-items: center; gap: $spacing-xs; }
.coverSource, .coverTitle, .description, .tipLabel, .tipText { display: block; }
.coverSource {
  color: rgba(255, 255, 255, 0.75);
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  letter-spacing: 0.2em;
}
.coverTitle {
  margin-top: $spacing-sm;
  color: $color-text-white;
  font-family: $font-family-serif;
  font-size: 44rpx;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
}
.coverIngredients { display: flex; flex-wrap: wrap; gap: $spacing-xs; margin-top: $spacing-md; }
.coverIngredient {
  padding: 7rpx 14rpx;
  color: rgba(255, 255, 255, 0.9);
  font-size: $font-size-xs;
  border: 2rpx solid rgba(255, 255, 255, 0.28);
  border-radius: $radius-round;
}

.body { padding: $spacing-lg $spacing-lg 0; }
.categoryLabel {
  display: block;
  color: $color-info;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  letter-spacing: 0.24em;
}
.titleRow { display: flex; align-items: flex-start; justify-content: space-between; gap: $spacing-sm; margin-top: $spacing-xs; }
.title {
  flex: 1;
  color: $color-text-primary;
  font-family: $font-family-serif;
  font-size: 40rpx;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
}
.shareBtn {
  @include button-reset;
  @include press;
  gap: 8rpx;
  width: 124rpx;
  height: 64rpx;
  color: $color-info;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  background: $color-info-alpha-08;
  border-radius: $radius-button;
  flex-shrink: 0;
}
.description { margin-top: $spacing-md; color: $color-text-secondary; font-size: $font-size-sm; line-height: $line-height-loose; }

.sourceNoticeText, .sourceFooterText { color: $color-text-secondary; font-size: $font-size-xs; line-height: $line-height-normal; }
.sourceFooterText { color: $color-text-tertiary; line-height: $line-height-loose; }

.section { margin-top: $spacing-lg; }
.ingredientList { overflow: hidden; background: $color-bg-card; border: 2rpx solid $color-border; border-radius: $radius-lg; }
.ingredientRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;
  min-height: 76rpx;
  padding: 14rpx $spacing-md;
  border-bottom: 2rpx solid $color-divider;
}
.ingredientRow:last-child { border-bottom: none; }
.ingredientName { color: $color-text-primary; font-size: $font-size-sm; font-weight: $font-weight-medium; }
.ingredientAmount { color: $color-text-tertiary; font-size: $font-size-sm; font-family: $font-family-serif; text-align: right; }

.steps { padding: $spacing-md; background: $color-bg-card; border: 2rpx solid $color-border; border-radius: $radius-lg; }
.step {
  display: flex;
  align-items: flex-start;
  gap: $spacing-md;
  padding-bottom: $spacing-md;
  margin-bottom: $spacing-md;
  border-bottom: 2rpx solid $color-divider;
}
.step:last-child { padding-bottom: 0; margin-bottom: 0; border-bottom: none; }
.stepIndex {
  width: 52rpx;
  height: 52rpx;
  color: $color-info;
  font-family: $font-family-serif;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  background: $color-bg-card;
  border: 2rpx solid $color-rule;
  border-radius: $radius-round;
  @include flex-center;
  flex-shrink: 0;
}
.stepContent { flex: 1; padding-top: 6rpx; color: $color-text-secondary; font-size: $font-size-sm; line-height: $line-height-loose; }

.tipCard {
  display: flex;
  gap: $spacing-sm;
  margin-top: $spacing-lg;
  padding: $spacing-md;
  background: $color-warning-alpha-07;
  border: 2rpx solid rgba(185, 95, 61, 0.22);
  border-radius: $radius-lg;
}
.tipIcon { padding-top: 2rpx; }
.tipBody { flex: 1; min-width: 0; }
.tipLabel { margin-bottom: $spacing-xs; color: $color-warning; font-size: $font-size-sm; font-weight: $font-weight-semibold; }
.tipText { color: $color-text-secondary; font-size: $font-size-sm; line-height: $line-height-loose; }

.empty { padding: $spacing-xl $spacing-lg; }
</style>
