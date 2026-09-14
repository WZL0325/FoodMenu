<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad, onShow, onShareAppMessage } from '@dcloudio/uni-app'
import { recipes } from '@/data/recipes'
import { healthProfiles } from '@/data/healthProfiles'
import { findRecipeById } from '@/utils/recipeFilters'
import { getRecipeDietaryRisk } from '@/utils/recipeFilters'
import { getDietaryProfile } from '@/utils/dietaryProfile'
import { isFavoriteRecipe, toggleFavoriteRecipe } from '@/utils/favorites'
import { getRecipeFeedback, toggleRecipeFeedback } from '@/utils/recipeFeedback'
import {
  getDefaultMealType,
  getMealPlanEntries,
  getWeekDays,
  mealOptions,
  saveMealPlanEntries,
  upsertMealPlanEntry,
} from '@/utils/mealPlan'
import {
  consumePendingPlanTarget,
  peekPendingPlanTarget,
  setPendingRecommendGroup,
} from '@/utils/recommendHandoff'
import type { DietaryProfile, HealthGroup } from '@/types/recipe'
import type { RecipeFeedbackKind, RecipeFeedbackRecord } from '@/types/recipeFeedback'
import type { MealType } from '@/types/mealPlan'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import BottomSheet from '@/components/BottomSheet/BottomSheet.vue'
import Callout from '@/components/Callout/Callout.vue'
import EmptyState from '@/components/EmptyState/EmptyState.vue'
import SectionHeader from '@/components/SectionHeader/SectionHeader.vue'

const nutritionRef = { calories: 800, protein: 50, carbs: 80, fat: 30 } as const
const recipeId = ref<string>()
const favorite = ref(false)
const imageFailed = ref(false)
const dietaryProfile = ref<DietaryProfile>({ excludedIngredients: [] })
const feedback = ref<RecipeFeedbackRecord>({
  recipeId: '',
  disliked: false,
  missingIngredients: false,
  cooked: false,
  updatedAt: 0,
})
const planDialogVisible = ref(false)
const planSaving = ref(false)
const weekDays = ref(getWeekDays())
const planDate = ref(weekDays.value.find((day) => day.isToday)?.key ?? weekDays.value[0].key)
const planMeal = ref<MealType>(getDefaultMealType())
const refreshWeekDays = () => {
  weekDays.value = getWeekDays()
  if (!weekDays.value.some((day) => day.key === planDate.value)) {
    planDate.value = weekDays.value.find((day) => day.isToday)?.key ?? weekDays.value[0].key
  }
}
onShow(() => {
  refreshWeekDays()
  if (!recipeId.value) return
  favorite.value = isFavoriteRecipe(recipeId.value)
  dietaryProfile.value = getDietaryProfile()
  feedback.value = getRecipeFeedback(recipeId.value)
})

onLoad((options) => {
  const id = typeof options?.id === 'string' ? options.id : undefined
  recipeId.value = id
  favorite.value = id ? isFavoriteRecipe(id) : false
  dietaryProfile.value = getDietaryProfile()
  feedback.value = id ? getRecipeFeedback(id) : feedback.value
  const pendingTarget = peekPendingPlanTarget()
  if (pendingTarget) {
    planDate.value = pendingTarget.date
    planMeal.value = pendingTarget.meal
  }
})

const recipe = computed(() => recipeId.value ? findRecipeById(recipes, recipeId.value) : undefined)
const dietaryRisk = computed(() => recipe.value
  ? getRecipeDietaryRisk(recipe.value, dietaryProfile.value)
  : { excludedIngredients: [], healthGroupConflict: false, hasConflict: false })
const safetyInfo = computed(() => {
  const item = recipe.value
  if (!item) return []
  const entries: { label: string, value: string }[] = []
  if (item.ageRange) entries.push({ label: '适用月龄', value: item.ageRange })
  if (item.allergens?.length) entries.push({ label: '常见过敏原', value: item.allergens.join('、') })
  else if (Array.isArray(item.allergens)) entries.push({ label: '常见过敏原', value: '无已知过敏原' })
  if (item.servingNote) entries.push({ label: '食用说明', value: item.servingNote })
  return entries
})
onShareAppMessage(() => ({
  title: recipe.value ? `${recipe.value.title} - 今天吃啥` : '今天吃啥 - 健康菜谱推荐',
  path: recipe.value ? `/pages/detail/index?id=${encodeURIComponent(recipe.value.id)}` : '/pages/index/index',
  imageUrl: recipe.value?.image,
}))
const nutritionItems = computed(() => recipe.value ? [
  { label: '热量', value: recipe.value.nutrition.calories, unit: 'kcal', ref: nutritionRef.calories },
  { label: '蛋白质', value: recipe.value.nutrition.protein, unit: 'g', ref: nutritionRef.protein },
  { label: '碳水', value: recipe.value.nutrition.carbs, unit: 'g', ref: nutritionRef.carbs },
  { label: '脂肪', value: recipe.value.nutrition.fat, unit: 'g', ref: nutritionRef.fat },
] : [])
const groupTitle = (group: HealthGroup) => healthProfiles.find((item) => item.id === group)?.title ?? group
const handleImageError = () => { imageFailed.value = true }
const handleFavorite = () => {
  if (!recipe.value) return
  const result = toggleFavoriteRecipe(recipe.value.id)
  favorite.value = result.favorite
  uni.showToast({ title: result.persisted ? (result.favorite ? '已收藏' : '已取消收藏') : '收藏保存失败', icon: 'none' })
}
const goGroup = (group: HealthGroup) => {
  setPendingRecommendGroup(group)
  uni.switchTab({ url: '/pages/recommend/index' })
}
const goHome = () => uni.switchTab({ url: '/pages/index/index' })
const openPlanDialog = () => {
  refreshWeekDays()
  planDialogVisible.value = true
}
const closePlanDialog = () => { planDialogVisible.value = false }
const saveToPlan = async () => {
  if (!recipe.value || planSaving.value) return
  if (dietaryRisk.value.hasConflict) {
    const confirmed = await new Promise<boolean>((resolve) => {
      uni.showModal({
        title: '确认加入有提醒的菜谱？',
        content: dietaryRisk.value.excludedIngredients.length
          ? `包含忌口食材：${dietaryRisk.value.excludedIngredients.join('、')}。请确认你了解相关风险。`
          : '这道菜不在当前健康目标的适宜范围内，请确认你了解相关风险。',
        confirmText: '仍要加入',
        cancelText: '先不加入',
        confirmColor: '#C83D2C',
        success: ({ confirm }) => resolve(confirm),
        fail: () => resolve(false),
      })
    })
    if (!confirmed) return
  }
  const selectedDate = planDate.value
  refreshWeekDays()
  if (selectedDate !== planDate.value) {
    uni.showToast({ title: '本周日期已更新，请重新选择', icon: 'none' })
    return
  }
  const nextEntry = { date: selectedDate, meal: planMeal.value, recipeId: recipe.value.id }
  const selectedRecipeTitle = recipe.value.title
  planSaving.value = true
  try {
    let entries = getMealPlanEntries()
    let occupied = entries.find((entry) => entry.date === nextEntry.date && entry.meal === nextEntry.meal)
    while (occupied && occupied.recipeId !== nextEntry.recipeId) {
      const previousRecipeId = occupied.recipeId
      const previousTitle = findRecipeById(recipes, previousRecipeId)?.title ?? '原有菜谱'
      const dayLabel = weekDays.value.find((day) => day.key === nextEntry.date)?.dateLabel ?? nextEntry.date
      const mealLabel = mealOptions.find((meal) => meal.id === nextEntry.meal)?.label ?? ''
      const confirmed = await new Promise<boolean>((resolve) => {
        uni.showModal({
          title: '替换这餐的安排？',
          content: `${dayLabel} ${mealLabel}已安排「${previousTitle}」，确定替换为「${selectedRecipeTitle}」吗？`,
          confirmText: '确认替换',
          cancelText: '保留原菜',
          confirmColor: '#C83D2C',
          success: (result) => resolve(result.confirm),
          fail: () => resolve(false),
        })
      })
      if (!confirmed) return
      entries = getMealPlanEntries()
      occupied = entries.find((entry) => entry.date === nextEntry.date && entry.meal === nextEntry.meal)
      if (occupied?.recipeId === previousRecipeId) break
    }
    if (!getWeekDays().some((day) => day.key === nextEntry.date)) {
      refreshWeekDays()
      uni.showToast({ title: '本周日期已更新，请重新选择', icon: 'none' })
      return
    }
    if (!saveMealPlanEntries(upsertMealPlanEntry(entries, nextEntry))) {
      uni.showToast({ title: '计划保存失败', icon: 'none' })
      return
    }
    consumePendingPlanTarget()
    closePlanDialog()
    uni.showToast({ title: '已加入本周计划', icon: 'none' })
  } finally {
    planSaving.value = false
  }
}
const feedbackLabel = (kind: RecipeFeedbackKind): string => {
  if (kind === 'disliked') return '不喜欢'
  if (kind === 'missingIngredients') return '食材不齐'
  return '做过了'
}
const handleFeedback = (kind: RecipeFeedbackKind) => {
  if (!recipe.value) return
  const result = toggleRecipeFeedback(recipe.value.id, kind)
  if (!result.persisted) {
    uni.showToast({ title: '反馈保存失败，请重试', icon: 'none' })
    return
  }
  feedback.value = result.feedback
  uni.showToast({
    title: result.active ? `已记录：${feedbackLabel(kind)}` : `已撤销：${feedbackLabel(kind)}`,
    icon: 'none',
  })
}
const openMealPlan = () => {
  closePlanDialog()
  uni.navigateTo({ url: '/pages/meal-plan/index' })
}
</script>

<template>
  <view v-if="recipe" class="page">
    <view class="coverWrap">
      <image v-if="!imageFailed" class="cover" :src="recipe.image" mode="aspectFill" @error="handleImageError" />
      <view v-else class="cover coverFallback">
        <AppIcon name="utensils" :size="96" color="#E8A48F" />
        <text class="fallbackTitle">{{ recipe.title }}</text>
        <text class="fallbackIngredients">{{ recipe.ingredients.slice(0, 5).join('、') }}</text>
      </view>
    </view>
    <view class="body">
      <view class="articleHead">
        <text class="categoryLabel">{{ recipe.category }}</text>
        <view class="titleRow">
          <text class="title">{{ recipe.title }}</text>
          <view class="titleActions">
            <button class="shareBtn" open-type="share">
              <AppIcon name="share-2" :size="28" color="#C83D2C" />
              <text>分享</text>
            </button>
            <button class="favBtn" :class="{ favBtnActive: favorite }" :aria-label="favorite ? '取消收藏' : '收藏'" @tap="handleFavorite">
              <view class="favIcon" :class="{ favIconActive: favorite }">
                <AppIcon name="heart" :size="36" :color="favorite ? '#FFFFFF' : '#D94B71'" />
              </view>
            </button>
          </view>
        </view>
        <view class="metaRow">
          <view class="metaItem">
            <AppIcon name="clock" :size="26" color="#8F8A97" />
            <text>{{ recipe.cookingTime }} 分钟</text>
          </view>
          <view class="metaItem">
            <AppIcon name="flame" :size="26" color="#8F8A97" />
            <text>{{ recipe.nutrition.calories }} kcal</text>
          </view>
          <view class="metaItem">
            <AppIcon name="leaf" :size="26" color="#8F8A97" />
            <text>{{ recipe.difficulty }}</text>
          </view>
        </view>
        <text class="desc">{{ recipe.description }}</text>
      </view>

      <view v-if="safetyInfo.length" class="safetyCard">
        <view class="safetyHead">
          <AppIcon name="circle-check" :size="30" color="#3D7A4D" />
          <text class="safetyTitle">食用安全信息</text>
        </view>
        <view class="safetyRows">
          <view v-for="entry in safetyInfo" :key="entry.label" class="safetyRow">
            <text class="safetyKey">{{ entry.label }}</text>
            <text class="safetyVal">{{ entry.value }}</text>
          </view>
        </view>
        <text class="safetyNote">首次给婴幼儿尝试新食材时，请少量观察过敏反应。</text>
      </view>

      <Callout v-if="dietaryRisk.hasConflict" tone="warning" title="饮食档案提醒">
        <text v-if="dietaryRisk.excludedIngredients.length" class="conflictText">这道菜包含你的忌口食材：{{ dietaryRisk.excludedIngredients.join('、') }}</text>
        <text v-if="dietaryRisk.healthGroupConflict" class="conflictText">这道菜不在当前健康目标的适宜范围内，请结合专业意见选择。</text>
      </Callout>

      <button class="planButton" :class="{ planButtonWarning: dietaryRisk.hasConflict }" @tap="openPlanDialog">
        <AppIcon name="calendar-plus" :size="30" color="#FFFFFF" />
        <text>{{ dietaryRisk.hasConflict ? '仍要加入计划' : '加入本周计划' }}</text>
      </button>

      <view v-if="dietaryRisk.hasConflict" class="planHint">
        <AppIcon name="info" :size="24" color="#C15B2D" />
        <text>加入前会再次确认提醒内容</text>
      </view>

      <view class="feedbackPanel">
        <view class="feedbackHeading">
          <text class="feedbackTitle">这道菜对你有帮助吗？</text>
          <text class="feedbackHint">反馈只保存在本机</text>
        </view>
        <view class="feedbackActions">
          <button
            class="feedbackAction"
            :class="{ feedbackActionActive: feedback.disliked }"
            @tap="handleFeedback('disliked')"
          >{{ feedback.disliked ? '已不喜欢' : '不喜欢' }}</button>
          <button
            class="feedbackAction"
            :class="{ feedbackActionActive: feedback.missingIngredients }"
            @tap="handleFeedback('missingIngredients')"
          >{{ feedback.missingIngredients ? '已标记食材不齐' : '食材不齐' }}</button>
          <button
            class="feedbackAction"
            :class="{ feedbackActionActive: feedback.cooked }"
            @tap="handleFeedback('cooked')"
          >{{ feedback.cooked ? '已做过' : '做过了' }}</button>
        </view>
      </view>

      <view class="section">
        <SectionHeader index="01" title="用料" />
        <view class="tagWrap">
          <text v-for="item in recipe.ingredients" :key="item" class="ingredientTag">{{ item }}</text>
        </view>
      </view>

      <view class="section">
        <SectionHeader index="02" title="营养成分" subtitle="单份估算值，便于同类菜谱比较" />
        <view class="nutrition">
          <view v-for="item in nutritionItems" :key="item.label" class="nutritionRow">
            <text class="nutritionLabel">{{ item.label }}</text>
            <view class="bar">
              <view class="barFill" :style="{ width: `${Math.min(100, Math.round((item.value / item.ref) * 100))}%` }" />
            </view>
            <text class="nutritionValue">{{ item.value }}<text class="nutritionUnit">{{ item.unit }}</text></text>
          </view>
        </view>
        <text class="estimateNote">单份估算值，仅用于菜谱间比较，不代表每日建议摄入量，也不构成医学建议</text>
      </view>

      <view v-if="recipe.suitableGroups.length" class="section">
        <SectionHeader index="03" title="适宜人群" />
        <view class="tagWrap">
          <text v-for="group in recipe.suitableGroups" :key="group" class="suitTag" @tap="goGroup(group)">{{ groupTitle(group) }}</text>
        </view>
      </view>
      <view v-if="recipe.avoidGroups.length" class="section">
        <SectionHeader index="04" title="需注意人群" />
        <view class="tagWrap">
          <text v-for="group in recipe.avoidGroups" :key="group" class="avoidTag" @tap="goGroup(group)">{{ groupTitle(group) }}</text>
        </view>
      </view>

      <view class="section">
        <SectionHeader index="05" title="烹饪步骤" />
        <view class="steps">
          <view v-for="(step, index) in recipe.steps" :key="step.title" class="step">
            <view class="stepIndex">
              <text class="stepIndexText">{{ String(index + 1).padStart(2, '0') }}</text>
            </view>
            <view class="stepContent">
              <text class="stepTitle">{{ step.title }}</text>
              <text class="stepDesc">{{ step.description }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="tipCard">
        <view class="tipIcon">
          <AppIcon name="sparkles" :size="30" color="#C15B2D" />
        </view>
        <view class="tipBody">
          <text class="tipLabel">小贴士</text>
          <text class="tipText">{{ recipe.tips }}</text>
        </view>
      </view>

      <Callout tone="info">
        <text class="healthNoticeText">健康建议不能替代医生诊断；慢性病、孕期、婴幼儿及过敏人群请结合专业意见选择食材。</text>
      </Callout>
    </view>

    <BottomSheet :visible="planDialogVisible" title="加入本周计划" @close="closePlanDialog">
      <view class="sheetDesc">
        <text>同一日期和餐次的新安排会替换旧安排</text>
      </view>
      <scroll-view scroll-x class="dateScroll">
        <view
          v-for="day in weekDays"
          :key="day.key"
          class="dateOption"
          :class="{ dateOptionActive: planDate === day.key }"
          @tap="planDate = day.key"
        >
          <text class="dateWeekday">{{ day.isToday ? '今天' : day.weekday }}</text>
          <text class="dateLabel">{{ day.dateLabel }}</text>
        </view>
      </scroll-view>
      <view class="mealOptions">
        <text
          v-for="meal in mealOptions"
          :key="meal.id"
          class="mealOption"
          :class="{ mealOptionActive: planMeal === meal.id }"
          @tap="planMeal = meal.id"
        >{{ meal.label }}</text>
      </view>
      <button class="dialogPrimary" @tap="saveToPlan">确认加入</button>
      <text class="viewPlanAction" @tap="openMealPlan">查看本周计划</text>
    </BottomSheet>
  </view>
  <view v-else class="page empty">
    <EmptyState icon="book-open" description="菜谱不存在或已下架" action-text="去选菜" @action="goHome" />
  </view>
</template>

<style lang="scss" scoped>
.page { min-height: 100vh; background: $color-bg-page; padding-bottom: $spacing-xl; }

.coverWrap { position: relative; }
.cover { width: 100%; height: 440rpx; display: block; background: $color-bg-hover; }
.coverFallback {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: $spacing-sm;
  padding: 48rpx $spacing-lg;
  background: linear-gradient(150deg, $color-bg-page 0%, $color-bg-hover 100%);
}
.fallbackTitle { color: $color-text-primary; font-family: $font-family-serif; font-size: 44rpx; font-weight: $font-weight-bold; line-height: $line-height-tight; }
.fallbackIngredients { color: $color-text-secondary; font-size: $font-size-sm; line-height: $line-height-normal; }

.body { padding: $spacing-lg $spacing-lg 0; background: $color-bg-page; }

.articleHead { @include rise; }

.categoryLabel {
  display: block;
  margin-bottom: $spacing-xs;
  color: $color-primary;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  letter-spacing: 0.28em;
}

.titleRow { display: flex; align-items: flex-start; justify-content: space-between; gap: $spacing-sm; }
.title {
  flex: 1;
  color: $color-text-primary;
  font-family: $font-family-serif;
  font-size: 48rpx;
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
}

.titleActions { display: flex; align-items: center; gap: $spacing-xs; flex-shrink: 0; }
.shareBtn {
  @include button-reset;
  @include press;
  gap: 8rpx;
  width: 120rpx;
  height: 64rpx;
  color: $color-primary-dark;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  background: $color-primary-light-alpha-12;
  border-radius: $radius-button;
}
.shareBtn:active { background: $color-primary-light-alpha-12; }

.favBtn {
  @include button-reset;
  @include press;
  width: 72rpx;
  height: 72rpx;
  background: $color-bg-card;
  border: 2rpx solid $color-border;
  border-radius: $radius-round;
  flex-shrink: 0;
}
.favBtnActive {
  background: $gradient-primary;
  border-color: $color-primary;
}
.favIcon { @include flex-center; width: 100%; height: 100%; }
.favIconActive { animation: heartPop 0.36s $ease-spring; }

.metaRow { display: flex; align-items: center; flex-wrap: wrap; gap: $spacing-sm; margin-top: $spacing-md; }
.metaItem {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 18rpx;
  color: $color-text-secondary;
  font-size: $font-size-xs;
  background: $color-bg-card;
  border: 2rpx solid $color-border;
  border-radius: $radius-round;
}

.desc { display: block; margin-top: $spacing-md; color: $color-text-secondary; font-size: $font-size-sm; line-height: $line-height-loose; }

.safetyCard {
  margin-top: $spacing-md;
  padding: $spacing-md;
  background: $color-green-light;
  border-radius: $radius-lg;
}
.safetyHead { display: flex; align-items: center; gap: $spacing-xs; }
.safetyTitle { color: #3D7A4D; font-size: $font-size-sm; font-weight: $font-weight-semibold; }
.safetyRows { margin-top: $spacing-sm; }
.safetyRow { display: flex; gap: $spacing-sm; padding: 6rpx 0; }
.safetyKey { flex-shrink: 0; color: #3D7A4D; font-size: $font-size-xs; font-weight: $font-weight-medium; }
.safetyVal { flex: 1; min-width: 0; color: $color-text-secondary; font-size: $font-size-xs; line-height: $line-height-normal; }
.safetyNote { display: block; margin-top: $spacing-xs; color: $color-text-tertiary; font-size: $font-size-xs; line-height: $line-height-normal; }

.conflictText { color: $color-error; font-size: $font-size-sm; line-height: $line-height-normal; }

.planButton {
  @include button-reset;
  @include press;
  width: 100%;
  height: $button-height-md;
  margin-top: $spacing-md;
  gap: $spacing-xs;
  color: $color-text-white;
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  background: $gradient-primary;
  border-radius: $radius-button;
}
.planButton:active { opacity: 0.9; }
.planButtonWarning { background: $color-warning; }
.planHint { display: flex; align-items: center; gap: $spacing-xs; margin-top: $spacing-xs; color: $color-warning; font-size: $font-size-xs; }

.feedbackPanel {
  margin-top: $spacing-md;
  padding: $spacing-md;
  background: $color-bg-card;
  border: 2rpx solid $color-border;
  border-radius: $radius-lg;
}
.feedbackHeading { display: flex; align-items: flex-start; justify-content: space-between; gap: $spacing-sm; }
.feedbackTitle { color: $color-text-primary; font-size: $font-size-sm; font-weight: $font-weight-semibold; }
.feedbackHint { color: $color-text-tertiary; font-size: $font-size-xs; text-align: right; }
.feedbackActions { display: flex; flex-wrap: wrap; gap: $spacing-xs; margin-top: $spacing-md; }
.feedbackAction {
  @include button-reset;
  @include press;
  min-height: 56rpx;
  padding: 8rpx 16rpx;
  color: $color-text-secondary;
  font-size: $font-size-xs;
  background: $color-bg-page;
  border: 2rpx solid transparent;
  border-radius: $radius-sm;
}
.feedbackActionActive {
  color: $color-primary-dark;
  background: $color-primary-light-alpha-10;
  border-color: $color-primary-light;
}

.section { margin-top: $spacing-lg; }
.tagWrap { display: flex; flex-wrap: wrap; gap: $spacing-sm; margin-top: $spacing-sm; }
.ingredientTag {
  padding: 9rpx 20rpx;
  color: $color-text-primary;
  font-size: $font-size-sm;
  background: $color-bg-card;
  border: 2rpx solid $color-border;
  border-radius: $radius-round;
}

.nutrition {
  margin-top: $spacing-sm;
  padding: $spacing-lg $spacing-md;
  background: $color-bg-card;
  border: 2rpx solid $color-border;
  border-radius: $radius-lg;
}
.nutritionRow { display: flex; align-items: center; margin-bottom: $spacing-md; }
.nutritionRow:last-child { margin-bottom: 0; }
.nutritionLabel { width: 120rpx; color: $color-text-secondary; font-size: $font-size-sm; }
.bar { flex: 1; height: 14rpx; margin: 0 $spacing-sm; overflow: hidden; background: $color-divider; border-radius: $radius-round; }
.barFill {
  height: 100%;
  background: linear-gradient(90deg, $color-primary-light, $color-primary);
  border-radius: $radius-round;
  animation: barGrow 0.7s $ease-out-expo both;
  transform-origin: left;
}
@keyframes barGrow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
.nutritionValue { width: 130rpx; color: $color-text-primary; font-family: $font-family-serif; font-size: $font-size-md; font-weight: $font-weight-bold; text-align: right; }
.nutritionUnit { margin-left: 4rpx; color: $color-text-tertiary; font-family: $font-family-sans; font-size: $font-size-xs; font-weight: $font-weight-normal; }
.estimateNote { display: block; margin-top: $spacing-sm; color: $color-text-tertiary; font-size: $font-size-xs; }

.suitTag, .avoidTag { padding: 9rpx 20rpx; border-radius: $radius-round; font-size: $font-size-sm; }
.suitTag { color: $color-primary-dark; background: $color-primary-light-alpha-12; }
.avoidTag { color: $color-error; background: $color-error-alpha-10; }

.steps { margin-top: $spacing-sm; }
.step { display: flex; align-items: stretch; margin-bottom: $spacing-md; }
.stepIndex {
  width: 56rpx;
  height: 56rpx;
  margin-right: $spacing-md;
  background: $color-primary-alpha-10;
  border-radius: $radius-round;
  @include flex-center;
  flex-shrink: 0;
}
.stepIndexText { color: $color-primary-dark; font-size: $font-size-sm; font-weight: $font-weight-bold; font-variant-numeric: tabular-nums; }
.stepContent { flex: 1; padding-bottom: $spacing-md; border-bottom: 2rpx solid $color-divider; }
.step:last-child .stepContent { border-bottom: none; }
.stepTitle, .stepDesc, .tipLabel { display: block; }
.stepTitle { color: $color-text-primary; font-size: $font-size-md; font-weight: $font-weight-semibold; }
.stepDesc { margin-top: $spacing-xs; color: $color-text-secondary; font-size: $font-size-sm; line-height: $line-height-loose; }

.tipCard {
  display: flex;
  gap: $spacing-sm;
  margin-top: $spacing-lg;
  padding: $spacing-md;
  background: $color-warning-alpha-07;
  border-radius: $radius-lg;
}
.tipIcon { padding-top: 2rpx; }
.tipBody { flex: 1; min-width: 0; }
.tipLabel { margin-bottom: $spacing-xs; color: $color-warning; font-size: $font-size-sm; font-weight: $font-weight-semibold; }
.tipText { color: $color-text-secondary; font-size: $font-size-sm; line-height: $line-height-loose; }

.healthNoticeText { color: $color-text-tertiary; font-size: $font-size-xs; line-height: $line-height-loose; }

.empty { padding: $spacing-xl $spacing-lg; }

// —— BottomSheet 内部 ——
.sheetDesc { margin-bottom: $spacing-sm; }
.sheetDesc text { color: $color-text-tertiary; font-size: $font-size-xs; }
.dateScroll { width: 100%; padding-bottom: $spacing-xs; white-space: nowrap; }
.dateOption {
  @include press;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 108rpx;
  height: 104rpx;
  margin-right: $spacing-xs;
  background: $color-bg-page;
  border: 2rpx solid transparent;
  border-radius: $radius-md;
}
.dateOptionActive { background: $color-primary-light-alpha-10; border-color: $color-primary; }
.dateWeekday { color: $color-text-primary; font-size: $font-size-sm; font-weight: $font-weight-semibold; }
.dateLabel { display: block; margin-top: 4rpx; color: $color-text-tertiary; font-size: $font-size-xs; }
.dateOptionActive .dateWeekday, .dateOptionActive .dateLabel { color: $color-primary-dark; }
.mealOptions { display: flex; gap: $spacing-sm; margin-top: $spacing-md; }
.mealOption {
  @include press;
  flex: 1;
  padding: 16rpx 0;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  text-align: center;
  background: $color-bg-page;
  border: 2rpx solid transparent;
  border-radius: $radius-md;
}
.mealOptionActive { color: $color-text-white; font-weight: $font-weight-semibold; background: $color-primary; border-color: $color-primary; }
.dialogPrimary {
  @include button-reset;
  @include press;
  width: 100%;
  height: $button-height-md;
  margin-top: $spacing-lg;
  color: $color-text-white;
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  background: $color-primary;
  border-radius: $radius-button;
}
.viewPlanAction { display: block; margin-top: $spacing-md; padding: $spacing-xs; color: $color-primary; font-size: $font-size-sm; font-weight: $font-weight-semibold; text-align: center; }
</style>
