<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { healthProfiles } from '@/data/healthProfiles'
import { recipes } from '@/data/recipes'
import { filterRecipesByDietaryProfile, filterRecipesByHealthGroup } from '@/utils/recipeFilters'
import { getDietaryProfile } from '@/utils/dietaryProfile'
import { consumePendingRecommendGroup } from '@/utils/recommendHandoff'
import { filterRecipesByFeedback, getRecipeFeedbackMap, sortRecipesByFeedback } from '@/utils/recipeFeedback'
import { getHealthRecommendationReason } from '@/utils/healthRecommendation'
import type { DietaryProfile, HealthGroup, Recipe } from '@/types/recipe'
import type { RecipeFeedbackMap } from '@/types/recipeFeedback'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import Callout from '@/components/Callout/Callout.vue'
import EmptyState from '@/components/EmptyState/EmptyState.vue'
import RecipeCard from '@/components/RecipeCard/RecipeCard.vue'
import SectionHeader from '@/components/SectionHeader/SectionHeader.vue'

const group = ref<HealthGroup>(healthProfiles[0].id)
const dietaryProfile = ref<DietaryProfile>({ excludedIngredients: [] })
const feedbackMap = ref<RecipeFeedbackMap>({})
const groupWasChosen = ref(false)
const isValidGroup = (value: unknown): value is HealthGroup => typeof value === 'string' && healthProfiles.some((profile) => profile.id === value)
onLoad((options) => {
  if (isValidGroup(options?.group)) {
    group.value = options.group
    groupWasChosen.value = true
  }
})
onShow(() => {
  dietaryProfile.value = getDietaryProfile()
  feedbackMap.value = getRecipeFeedbackMap()
  const pending = consumePendingRecommendGroup()
  if (isValidGroup(pending)) {
    group.value = pending
    groupWasChosen.value = true
  } else if (!groupWasChosen.value && dietaryProfile.value.healthGroup) {
    group.value = dietaryProfile.value.healthGroup
  }
})
const profile = computed(() => healthProfiles.find((item) => item.id === group.value) ?? healthProfiles[0])
const result = computed(() => filterRecipesByDietaryProfile(
  sortRecipesByFeedback(
    filterRecipesByFeedback(filterRecipesByHealthGroup(recipes, group.value), feedbackMap.value),
    feedbackMap.value,
  ),
  { ...dietaryProfile.value, healthGroup: group.value },
))
const selectGroup = (value: HealthGroup) => {
  group.value = value
  groupWasChosen.value = true
}
const handleFeedbackChange = () => {
  feedbackMap.value = getRecipeFeedbackMap()
}
const recommendationReason = (recipe: Recipe) => getHealthRecommendationReason(recipe, group.value)
</script>

<template>
  <view class="page">
    <view class="pageIntro">
      <text class="introTitle">为家人选道合适的菜</text>
      <text class="introDesc">选一个饮食人群，看看对应的提醒和家常菜。</text>
    </view>
    <view class="groupGrid">
      <button
        v-for="profileItem in healthProfiles"
        :key="profileItem.id"
        class="groupTag"
        :class="{ groupTagActive: profileItem.id === group }"
        :aria-pressed="profileItem.id === group"
        @tap="selectGroup(profileItem.id)"
      ><text class="groupTagText">{{ profileItem.title }}</text></button>
    </view>
    <view class="tipCard">
      <view class="tipHead">
        <view class="tipIcon"><AppIcon name="bell" :size="30" color="#F45B3C" /></view>
        <text class="tipTitle">{{ profile.title }}饮食提醒</text>
      </view>
      <text class="tipDesc">{{ profile.description }}</text>
      <view class="tipList">
        <view v-for="tip in profile.avoidTips" :key="tip" class="tipItem">
          <AppIcon name="check" :size="24" color="#F45B3C" />
          <text class="tipText">{{ tip }}</text>
        </view>
      </view>
    </view>
    <view v-if="dietaryProfile.excludedIngredients.length" class="notice">
      <Callout tone="success" title="忌口已生效">
        <text class="profileStatusText">已排除 {{ dietaryProfile.excludedIngredients.join('、') }}</text>
      </Callout>
    </view>
    <view class="resultSection">
      <SectionHeader class="sectionHeading" :title="`推荐 ${result.length} 道`" subtitle="结合当前人群、忌口和你的反馈筛选" />
      <EmptyState
        v-if="result.length === 0"
        icon="book-open"
        description="暂时没有符合条件的菜谱。试试其他人群，或到“我的”调整忌口与反馈。"
      />
      <view v-else class="list">
        <view v-for="recipe in result" :key="recipe.id" class="listItem">
          <RecipeCard :recipe="recipe" :feedback="feedbackMap[recipe.id]" :recommendation-reason="recommendationReason(recipe)" show-feedback @feedback-change="handleFeedbackChange" />
        </view>
      </view>
    </view>
    <view class="notice healthNotice">
      <Callout tone="info">
        <text class="healthNoticeText">人群建议为通用饮食参考，不能替代医生或营养师的个体化诊断。</text>
      </Callout>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: $spacing-lg $spacing-lg calc(160rpx + env(safe-area-inset-bottom));
  background: $color-bg-page;
  font-family: $font-family-sans;
}

.pageIntro { padding: $spacing-sm 0 $spacing-lg; }
.introTitle, .introDesc, .tipDesc { display: block; }
.introTitle {
  color: $color-text-primary;
  font-size: 44rpx;
  font-weight: $font-weight-bold;
  line-height: 1.4;
}
.introDesc { margin-top: 12rpx; color: $color-text-secondary; font-size: 26rpx; line-height: $line-height-loose; }

.groupGrid { display: flex; flex-wrap: wrap; gap: $spacing-sm; }
.groupTag {
  @include button-reset;
  @include press;
  flex: 0 0 calc((100% - 32rpx) / 3);
  min-height: 96rpx;
  padding: 18rpx 8rpx;
  background: $color-bg-card;
  border: 2rpx solid transparent;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;
}
.groupTagActive {
  background: $color-primary;
  border-color: $color-primary;
  box-shadow: 0 8rpx 20rpx rgba(237, 106, 60, 0.18);
}
.groupTagText { color: $color-text-primary; font-size: 26rpx; font-weight: $font-weight-semibold; white-space: normal; }
.groupTagActive .groupTagText { color: $color-text-white; }

.tipCard {
  margin-top: $spacing-lg;
  padding: $spacing-lg;
  background: #FFF3E4;
  border: 2rpx solid #F5D8C2;
  border-radius: $radius-xl;
}
.tipHead { display: flex; align-items: center; gap: 12rpx; }
.tipIcon { @include flex-center; width: 56rpx; height: 56rpx; background: $color-bg-card; border-radius: $radius-round; flex-shrink: 0; }
.tipTitle { color: $color-text-primary; font-size: $font-size-lg; font-weight: $font-weight-bold; line-height: $line-height-normal; }
.tipDesc { margin-top: $spacing-sm; color: $color-text-secondary; font-size: 26rpx; line-height: $line-height-loose; }
.tipList { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: $spacing-md; }
.tipItem {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  max-width: 100%;
  padding: 12rpx 18rpx;
  background: $color-bg-card;
  border-radius: $radius-round;
}
.tipText { flex: 1; color: $color-text-secondary; font-size: $font-size-sm; line-height: $line-height-normal; }

.notice { margin-top: $spacing-md; }
.profileStatusText { color: $color-success; font-size: $font-size-sm; line-height: $line-height-loose; }
.resultSection { margin-top: $spacing-xl; }
.sectionHeading { margin: 0 0 $spacing-md; }
.list { display: flex; flex-direction: column; gap: $spacing-lg; }
.listItem { min-width: 0; }
.healthNotice { margin-top: $spacing-lg; }
.healthNoticeText { color: $color-text-secondary; font-size: $font-size-sm; line-height: $line-height-loose; }
</style>
