<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { ingredientOptions } from '@/data/ingredients'
import { recipes } from '@/data/recipes'
import { healthProfiles } from '@/data/healthProfiles'
import { getFavoriteRecipeIds } from '@/utils/favorites'
import { getDietaryProfile, saveDietaryProfile } from '@/utils/dietaryProfile'
import {
  clearAllManagedLocalData,
  clearDietaryProfileData,
  clearFavoriteData,
  clearMealPlanData,
  clearOnlineRecipeData,
  clearRecipeFeedbackData,
  getOnlineRecipeCacheCount,
} from '@/utils/localData'
import { getRecipeFeedbackCount } from '@/utils/recipeFeedback'
import type { DietaryProfile, HealthGroup } from '@/types/recipe'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import EmptyState from '@/components/EmptyState/EmptyState.vue'
import RecipeCard from '@/components/RecipeCard/RecipeCard.vue'
import SectionHeader from '@/components/SectionHeader/SectionHeader.vue'

const favoriteIds = ref<string[]>([])
const dietaryProfile = ref<DietaryProfile>({ excludedIngredients: [] })
const onlineCacheCount = ref(0)
const feedbackCount = ref(0)
const restrictionOptions = ingredientOptions.map((item) => item.name)

const refreshLocalData = () => {
  favoriteIds.value = getFavoriteRecipeIds()
  dietaryProfile.value = getDietaryProfile()
  onlineCacheCount.value = getOnlineRecipeCacheCount()
  feedbackCount.value = getRecipeFeedbackCount()
}

onShow(refreshLocalData)
const list = computed(() => recipes.filter((recipe) => favoriteIds.value.includes(recipe.id)))
const goHome = () => uni.switchTab({ url: '/pages/index/index' })
const openPrivacy = () => uni.navigateTo({ url: '/pages/privacy/index' })
const openMealPlan = () => uni.navigateTo({ url: '/pages/meal-plan/index' })
const persistProfile = () => {
  if (!saveDietaryProfile(dietaryProfile.value)) {
    uni.showToast({ title: '饮食档案保存失败', icon: 'none' })
  }
}
const selectHealthGroup = (group: HealthGroup) => {
  dietaryProfile.value = { ...dietaryProfile.value, healthGroup: group }
  persistProfile()
}
const toggleRestriction = (ingredient: string) => {
  const current = dietaryProfile.value.excludedIngredients
  dietaryProfile.value = {
    ...dietaryProfile.value,
    excludedIngredients: current.includes(ingredient)
      ? current.filter((item) => item !== ingredient)
      : [...current, ingredient],
  }
  persistProfile()
}

const confirmClear = (content: string, action: () => boolean, successTitle: string) => {
  uni.showModal({
    title: '确认清除',
    content,
    confirmText: '清除',
    confirmColor: '#D34F43',
    success: ({ confirm }) => {
      if (!confirm) return

      const succeeded = action()
      refreshLocalData()
      uni.showToast({
        title: succeeded ? successTitle : '清除失败，请重试',
        icon: 'none',
      })
    },
  })
}

const clearProfile = () => confirmClear(
  '将删除健康目标和全部忌口设置，删除后无法恢复。',
  clearDietaryProfileData,
  '饮食档案已清除',
)
const clearFavorites = () => confirmClear(
  '将删除收藏的全部本地菜谱，删除后无法恢复。',
  clearFavoriteData,
  '收藏已清除',
)
const clearOnlineCache = () => confirmClear(
  '将删除 ShowAPI 食材分类和已打开的在线菜谱缓存，不影响本地菜谱。',
  clearOnlineRecipeData,
  '在线缓存已清除',
)
const clearFeedback = () => confirmClear(
  '将删除本机保存的菜谱反馈，并恢复默认推荐排序。',
  clearRecipeFeedbackData,
  '推荐反馈已清除',
)
const clearPlan = () => confirmClear(
  '将删除本周计划、手动购物项和采购勾选状态，删除后无法恢复。',
  clearMealPlanData,
  '计划与清单已清除',
)
const clearAllLocalData = () => confirmClear(
  '将删除饮食档案、收藏、推荐反馈、计划和在线菜谱缓存，删除后无法恢复。',
  clearAllManagedLocalData,
  '本地数据已清除',
)
</script>

<template>
  <view class="page">
    <view class="pageIntro">
      <text class="introEyebrow">个人偏好</text>
      <text class="introTitle">我的饮食档案</text>
      <text class="introDesc">用于过滤忌口，并调整健康推荐范围。</text>
    </view>

    <SectionHeader index="01" title="饮食档案" subtitle="自动保存在本机" />
    <view class="profileSection">
      <text class="fieldLabel">健康目标 / 人群</text>
      <scroll-view scroll-x class="optionScroll">
        <text
          v-for="profile in healthProfiles"
          :key="profile.id"
          class="optionTag"
          :class="{ optionTagActive: dietaryProfile.healthGroup === profile.id }"
          @tap="selectHealthGroup(profile.id)"
        >{{ profile.title }}</text>
      </scroll-view>
      <text class="fieldLabel restrictionLabel">忌口食材</text>
      <view class="restrictionList">
        <text
          v-for="ingredient in restrictionOptions"
          :key="ingredient"
          class="restrictionTag"
          :class="{ restrictionTagActive: dietaryProfile.excludedIngredients.includes(ingredient) }"
          @tap="toggleRestriction(ingredient)"
        >{{ ingredient }}</text>
      </view>
      <text class="profileHint">首页和健康推荐会自动避开已选忌口，详情页会提示冲突。</text>
    </view>

    <SectionHeader index="02" title="我的收藏" :subtitle="list.length > 0 ? `共 ${list.length} 道` : undefined" />
    <EmptyState
      v-if="list.length === 0"
      icon="folder-heart"
      description="还没有收藏的菜谱"
      action-text="去选菜"
      @action="goHome"
    />
    <view v-else class="list">
      <view v-for="(recipe, index) in list" :key="recipe.id" class="listItem" :style="{ '--rise-index': index }">
        <RecipeCard :recipe="recipe" />
      </view>
    </view>

    <SectionHeader index="03" title="餐桌安排" subtitle="从菜谱到采购的本周闭环" />
    <view class="featureRow" @tap="openMealPlan">
      <view class="featureMark">
        <AppIcon name="calendar" :size="36" color="#FFFFFF" />
      </view>
      <view class="dataCopy">
        <text class="dataTitle">本周计划与购物清单</text>
        <text class="dataDesc">安排早中晚餐，自动汇总需要准备的食材</text>
      </view>
      <view class="rowArrow">
        <AppIcon name="chevron-right" :size="30" color="#8A7A6D" />
      </view>
    </view>

    <SectionHeader index="04" title="隐私与数据" subtitle="查看用途、存储位置与删除方式" />
    <view class="dataPanel">
      <view class="privacyRow" @tap="openPrivacy">
        <view class="dataCopy">
          <text class="dataTitle">隐私与数据说明</text>
          <text class="dataDesc">了解本地存储、联网查询和健康信息边界</text>
        </view>
        <view class="rowArrow">
          <AppIcon name="chevron-right" :size="30" color="#8A7A6D" />
        </view>
      </view>
      <view class="dataRow">
        <view class="dataCopy">
          <text class="dataTitle">计划与购物清单</text>
          <text class="dataDesc">本周餐次、手动购物项与勾选状态</text>
        </view>
        <button class="clearButton" @tap="clearPlan">清除</button>
      </view>
      <view class="dataRow">
        <view class="dataCopy">
          <text class="dataTitle">饮食档案</text>
          <text class="dataDesc">{{ dietaryProfile.healthGroup || dietaryProfile.excludedIngredients.length ? '已保存在本机' : '暂无本地档案' }}</text>
        </view>
        <button class="clearButton" @tap="clearProfile">清除</button>
      </view>
      <view class="dataRow">
        <view class="dataCopy">
          <text class="dataTitle">收藏菜谱</text>
          <text class="dataDesc">本机保存 {{ favoriteIds.length }} 道</text>
        </view>
        <button class="clearButton" @tap="clearFavorites">清除</button>
      </view>
      <view class="dataRow">
        <view class="dataCopy">
          <text class="dataTitle">在线菜谱缓存</text>
          <text class="dataDesc">已缓存 {{ onlineCacheCount }} 道在线菜谱</text>
        </view>
        <button class="clearButton" @tap="clearOnlineCache">清除</button>
      </view>
      <view class="dataRow">
        <view class="dataCopy">
          <text class="dataTitle">推荐反馈</text>
          <text class="dataDesc">本机保存 {{ feedbackCount }} 道菜的反馈</text>
        </view>
        <button class="clearButton" @tap="clearFeedback">清除</button>
      </view>
      <button class="clearAllButton" @tap="clearAllLocalData">
        <AppIcon name="trash-2" :size="28" color="#D34F43" />
        <text>清除全部本地数据</text>
      </button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page { min-height: 100vh; padding: $spacing-lg $spacing-lg 160rpx; background: $color-bg-page; }

.pageIntro { @include rise; padding: $spacing-md 0 0; }
.introEyebrow, .introTitle, .introDesc, .fieldLabel, .profileHint, .dataTitle, .dataDesc { display: block; }
.introEyebrow {
  color: $color-warning;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  letter-spacing: 0.32em;
}
.introTitle {
  margin-top: $spacing-xs;
  color: $color-text-primary;
  font-family: $font-family-serif;
  font-size: 44rpx;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
}
.introDesc { margin-top: $spacing-sm; color: $color-text-secondary; font-size: $font-size-sm; line-height: $line-height-normal; }

.profileSection { padding: $spacing-md; background: $color-bg-card; border: 2rpx solid $color-border; border-radius: $radius-lg; }
.fieldLabel { margin-bottom: $spacing-sm; color: $color-text-secondary; font-size: $font-size-xs; font-weight: $font-weight-semibold; }
.restrictionLabel { margin-top: $spacing-lg; }
.optionScroll { width: 100%; white-space: nowrap; }
.optionTag {
  @include press;
  display: inline-flex;
  align-items: center;
  min-height: 64rpx;
  padding: 10rpx 24rpx;
  margin-right: $spacing-sm;
  color: $color-text-primary;
  font-size: $font-size-sm;
  background: $color-bg-page;
  border: 2rpx solid transparent;
  border-radius: $radius-round;
}
.optionTagActive { color: $color-text-white; background: $color-primary; border-color: $color-primary; }
.restrictionList { display: flex; flex-wrap: wrap; gap: $spacing-sm; }
.restrictionTag {
  @include press;
  padding: 10rpx 22rpx;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  background: $color-bg-page;
  border: 2rpx solid transparent;
  border-radius: $radius-round;
}
.restrictionTagActive {
  color: $color-error;
  background: $color-error-alpha-07;
  border-color: rgba(211, 79, 67, 0.35);
}
.profileHint { margin-top: $spacing-lg; padding-top: $spacing-md; color: $color-text-tertiary; font-size: $font-size-xs; line-height: $line-height-normal; border-top: 2rpx solid $color-divider; }

.list { display: flex; flex-direction: column; gap: $spacing-lg; margin-top: $spacing-md; }
.listItem { @include rise; }

.dataPanel { overflow: hidden; background: $color-bg-card; border: 2rpx solid $color-border; border-radius: $radius-lg; }
.featureRow {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  min-height: 112rpx;
  padding: $spacing-md;
  background: $color-bg-card;
  border: 2rpx solid $color-border;
  border-radius: $radius-lg;
}
.featureRow:active { background: $color-bg-hover; }
.featureMark {
  width: 64rpx;
  height: 64rpx;
  background: $color-primary;
  border-radius: $radius-md;
  @include flex-center;
  flex-shrink: 0;
}
.privacyRow, .dataRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-md;
  min-height: 104rpx;
  padding: $spacing-sm $spacing-md;
  border-bottom: 2rpx solid $color-divider;
}
.privacyRow:active { background: $color-bg-hover; }
.dataCopy { flex: 1; min-width: 0; }
.dataTitle { color: $color-text-primary; font-size: $font-size-sm; font-weight: $font-weight-semibold; }
.dataDesc { margin-top: 4rpx; color: $color-text-tertiary; font-size: $font-size-xs; line-height: $line-height-normal; }
.rowArrow { @include flex-center; width: 48rpx; height: 48rpx; flex-shrink: 0; }
.clearButton {
  @include button-reset;
  @include press;
  width: 104rpx;
  height: 60rpx;
  color: $color-error;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  background: $color-error-alpha-07;
  border-radius: $radius-button;
  flex-shrink: 0;
}
.clearButton:active { background: rgba(211, 79, 67, 0.16); }
.clearAllButton {
  @include button-reset;
  @include press;
  gap: $spacing-xs;
  width: calc(100% - #{$spacing-lg});
  height: $button-height-md;
  margin: $spacing-md;
  color: $color-error;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  background: $color-bg-page;
  border: 2rpx solid rgba(211, 79, 67, 0.32);
  border-radius: $radius-button;
}
.clearAllButton:active { background: $color-error-alpha-07; }
</style>
