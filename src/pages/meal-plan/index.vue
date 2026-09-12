<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { recipes } from '@/data/recipes'
import {
  buildShoppingList,
  getCheckedShoppingItems,
  getManualShoppingItems,
  getMealPlanEntries,
  getWeekDays,
  mealOptions,
  removeMealPlanEntry,
  saveCheckedShoppingItems,
  saveManualShoppingItems,
  saveMealPlanEntries,
} from '@/utils/mealPlan'
import type { MealPlanEntry, MealType } from '@/types/mealPlan'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import Callout from '@/components/Callout/Callout.vue'
import EmptyState from '@/components/EmptyState/EmptyState.vue'

type ViewMode = 'plan' | 'shopping'

const mode = ref<ViewMode>('plan')
const entries = ref<MealPlanEntry[]>([])
const manualItems = ref<string[]>([])
const checkedItems = ref<string[]>([])
const manualInput = ref('')
const weekDays = getWeekDays()
const weekDateKeys = new Set(weekDays.map((day) => day.key))
const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe]))

const currentEntries = computed(() => entries.value.filter((entry) => weekDateKeys.has(entry.date)))
const arrangedCount = computed(() => currentEntries.value.length)
const shoppingItems = computed(() => buildShoppingList(currentEntries.value, recipes, manualItems.value))
const purchasedCount = computed(() => shoppingItems.value.filter((item) => checkedItems.value.includes(item.name)).length)
const shoppingProgress = computed(() => shoppingItems.value.length
  ? Math.round((purchasedCount.value / shoppingItems.value.length) * 100)
  : 0)

onShow(() => {
  entries.value = getMealPlanEntries()
  manualItems.value = getManualShoppingItems()
  checkedItems.value = getCheckedShoppingItems()
})

const getEntry = (date: string, meal: MealType) => currentEntries.value.find((entry) => entry.date === date && entry.meal === meal)
const getRecipeTitle = (entry?: MealPlanEntry) => entry ? recipeMap.get(entry.recipeId)?.title ?? '菜谱已失效' : ''
const openRecipe = (entry?: MealPlanEntry) => {
  if (!entry || !recipeMap.has(entry.recipeId)) return
  uni.navigateTo({ url: `/pages/detail/index?id=${encodeURIComponent(entry.recipeId)}` })
}
const removeEntry = (entry: MealPlanEntry) => {
  const mealLabel = mealOptions.find((item) => item.id === entry.meal)?.label ?? '该餐次'
  uni.showModal({
    title: '移出本周计划',
    content: `确认移除${mealLabel}的“${getRecipeTitle(entry)}”吗？`,
    confirmText: '移除',
    confirmColor: '#D34F43',
    success: ({ confirm }) => {
      if (!confirm) return
      const nextEntries = removeMealPlanEntry(entries.value, entry.date, entry.meal)
      if (!saveMealPlanEntries(nextEntries)) {
        uni.showToast({ title: '计划保存失败', icon: 'none' })
        return
      }
      entries.value = nextEntries
      uni.showToast({ title: '已移出计划', icon: 'none' })
    },
  })
}
const goChooseRecipe = () => uni.switchTab({ url: '/pages/index/index' })
const addManualItem = () => {
  const name = manualInput.value.trim()
  if (!name) return
  if (shoppingItems.value.some((item) => item.name === name)) {
    uni.showToast({ title: '购物清单中已有该食材', icon: 'none' })
    return
  }
  const nextItems = [...manualItems.value, name]
  if (!saveManualShoppingItems(nextItems)) {
    uni.showToast({ title: '购物项保存失败', icon: 'none' })
    return
  }
  manualItems.value = nextItems
  manualInput.value = ''
}
const toggleShoppingItem = (name: string) => {
  const nextItems = checkedItems.value.includes(name)
    ? checkedItems.value.filter((item) => item !== name)
    : [...checkedItems.value, name]
  if (!saveCheckedShoppingItems(nextItems)) {
    uni.showToast({ title: '勾选状态保存失败', icon: 'none' })
    return
  }
  checkedItems.value = nextItems
}
const removeManualItem = (name: string) => {
  const nextManualItems = manualItems.value.filter((item) => item !== name)
  const nextCheckedItems = checkedItems.value.filter((item) => item !== name)
  const manualSaved = saveManualShoppingItems(nextManualItems)
  const checkedSaved = saveCheckedShoppingItems(nextCheckedItems)
  if (!manualSaved || !checkedSaved) {
    uni.showToast({ title: '购物项删除失败', icon: 'none' })
    return
  }
  manualItems.value = nextManualItems
  checkedItems.value = nextCheckedItems
}
const clearChecked = () => {
  if (!checkedItems.value.length) return
  if (!saveCheckedShoppingItems([])) {
    uni.showToast({ title: '状态重置失败', icon: 'none' })
    return
  }
  checkedItems.value = []
}
</script>

<template>
  <view class="page">
    <view class="pageIntro">
      <text class="introEyebrow">本周餐桌</text>
      <text class="introTitle">计划好，再去买菜</text>
      <text class="introDesc">已安排 {{ arrangedCount }} 个餐次，购物清单会随计划自动更新。</text>
    </view>

    <view class="segmented">
      <view class="segment" :class="{ segmentActive: mode === 'plan' }" @tap="mode = 'plan'">本周计划</view>
      <view class="segment" :class="{ segmentActive: mode === 'shopping' }" @tap="mode = 'shopping'">购物清单</view>
    </view>

    <view v-if="mode === 'plan'" class="planView">
      <view v-for="day in weekDays" :key="day.key" class="daySection">
        <view class="dayHeading">
          <view class="dayTitleRow">
            <text class="dayTitle">{{ day.isToday ? '今天' : day.weekday }}</text>
            <text v-if="day.isToday" class="todayBadge">TODAY</text>
          </view>
          <text class="dayDate">{{ day.dateLabel }}</text>
        </view>
        <view class="mealList">
          <view v-for="meal in mealOptions" :key="meal.id" class="mealRow">
            <text class="mealLabel">{{ meal.label }}</text>
            <view v-if="getEntry(day.key, meal.id)" class="plannedMeal" @tap="openRecipe(getEntry(day.key, meal.id))">
              <text class="plannedTitle">{{ getRecipeTitle(getEntry(day.key, meal.id)) }}</text>
              <text class="plannedMeta">{{ recipeMap.get(getEntry(day.key, meal.id)?.recipeId || '')?.cookingTime || '--' }} 分钟</text>
            </view>
            <text v-else class="emptyMeal" @tap="goChooseRecipe">去选一道</text>
            <view
              v-if="getEntry(day.key, meal.id)"
              class="removeMeal"
              @tap.stop="removeEntry(getEntry(day.key, meal.id)!)"
            >
              <AppIcon name="x" :size="28" color="#8A7A6D" />
            </view>
          </view>
        </view>
      </view>
      <button class="chooseButton" @tap="goChooseRecipe">
        <AppIcon name="utensils" :size="28" color="#FFFFFF" />
        <text>继续选菜</text>
      </button>
    </view>

    <view v-else class="shoppingView">
      <view class="shoppingSummary">
        <view>
          <text class="summaryTitle">采购进度</text>
          <text class="summaryDesc">已完成 {{ purchasedCount }} / {{ shoppingItems.length }} 项</text>
        </view>
        <text class="summaryPercent">{{ shoppingProgress }}%</text>
      </view>
      <view class="progressTrack"><view class="progressFill" :style="{ width: `${shoppingProgress}%` }" /></view>

      <view class="manualForm">
        <input
          v-model="manualInput"
          class="manualInput"
          placeholder="手动添加，如牛奶"
          confirm-type="done"
          @confirm="addManualItem"
        />
        <button class="addButton" @tap="addManualItem">
          <AppIcon name="plus" :size="28" color="#FFFFFF" />
          <text>添加</text>
        </button>
      </view>

      <view v-if="shoppingItems.length" class="shoppingList">
        <view v-for="item in shoppingItems" :key="item.name" class="shoppingRow">
          <view
            class="checkBox"
            :class="{ checkBoxActive: checkedItems.includes(item.name) }"
            @tap="toggleShoppingItem(item.name)"
          >
            <AppIcon v-if="checkedItems.includes(item.name)" name="check" :size="24" color="#FFFFFF" />
          </view>
          <view class="shoppingCopy" @tap="toggleShoppingItem(item.name)">
            <text class="shoppingName" :class="{ shoppingNameChecked: checkedItems.includes(item.name) }">{{ item.name }}</text>
            <text class="shoppingMeta">{{ item.manual ? '手动添加' : `用于 ${item.mealCount} 个餐次` }}</text>
          </view>
          <view v-if="item.manual" class="removeShopping" @tap="removeManualItem(item.name)">
            <AppIcon name="trash-2" :size="28" color="#8A7A6D" />
          </view>
        </view>
      </view>
      <EmptyState
        v-else
        icon="shopping-basket"
        description="购物清单还是空的，先把菜谱加入本周计划，所需食材会自动汇总到这里。"
        action-text="去选菜"
        @action="goChooseRecipe"
      />
      <text v-if="checkedItems.length" class="resetAction" @tap="clearChecked">重置全部勾选</text>
      <Callout tone="info">
        <text class="shoppingNoticeText">清单按食材名称去重，不推测采购重量；请结合人数、库存和实际份量确认。</text>
      </Callout>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page { min-height: 100vh; padding: $spacing-lg $spacing-lg 80rpx; background: $color-bg-page; }

.pageIntro { @include rise; padding: $spacing-md 0 $spacing-lg; }
.introEyebrow, .introTitle, .introDesc, .summaryTitle, .summaryDesc, .dayTitle, .dayDate, .plannedTitle, .plannedMeta, .shoppingName, .shoppingMeta { display: block; }
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

.segmented { display: flex; height: 76rpx; padding: 6rpx; background: $color-bg-card; border: 2rpx solid $color-border; border-radius: $radius-md; }
.segment { @include press; flex: 1; color: $color-text-secondary; font-size: $font-size-sm; text-align: center; line-height: 60rpx; border-radius: $radius-sm; }
.segmentActive { color: $color-text-white; font-weight: $font-weight-semibold; background: $color-primary; }

.planView, .shoppingView { margin-top: $spacing-lg; }

.daySection { margin-bottom: $spacing-md; }
.dayHeading { display: flex; align-items: center; justify-content: space-between; padding: 0 $spacing-xs $spacing-sm; }
.dayTitleRow { display: flex; align-items: center; gap: $spacing-xs; }
.dayTitle { color: $color-text-primary; font-size: $font-size-md; font-weight: $font-weight-bold; }
.todayBadge {
  padding: 4rpx 12rpx;
  color: $color-primary-dark;
  font-family: $font-family-serif;
  font-size: 18rpx;
  font-weight: $font-weight-bold;
  letter-spacing: 0.12em;
  background: $color-primary-light-alpha-12;
  border-radius: $radius-round;
}
.dayDate { color: $color-text-tertiary; font-size: $font-size-xs; }

.mealList { overflow: hidden; background: $color-bg-card; border: 2rpx solid $color-border; border-radius: $radius-lg; }
.mealRow { display: flex; align-items: center; min-height: 88rpx; padding: 12rpx $spacing-md; border-bottom: 2rpx solid $color-divider; }
.mealRow:last-child { border-bottom: none; }
.mealLabel { width: 84rpx; color: $color-text-tertiary; font-size: $font-size-xs; flex-shrink: 0; }
.plannedMeal { @include press; flex: 1; min-width: 0; }
.plannedTitle { color: $color-text-primary; font-size: $font-size-sm; font-weight: $font-weight-semibold; @include text-ellipsis; }
.plannedMeta { margin-top: 4rpx; color: $color-text-tertiary; font-size: $font-size-xs; }
.emptyMeal { @include press; flex: 1; padding: 12rpx 0; color: $color-primary; font-size: $font-size-sm; }
.removeMeal { @include flex-center; width: 56rpx; height: 56rpx; flex-shrink: 0; }

.chooseButton {
  @include button-reset;
  @include press;
  display: flex;
  gap: $spacing-xs;
  width: 260rpx;
  height: $button-height-md;
  margin: $spacing-xl auto 0;
  color: $color-text-white;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  background: $color-primary;
  border-radius: $radius-button;
}

.shoppingSummary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-md $spacing-md $spacing-sm;
  background: $color-primary-dark;
  border-radius: $radius-lg $radius-lg 0 0;
}
.summaryTitle { color: $color-text-white; font-size: $font-size-md; font-weight: $font-weight-bold; }
.summaryDesc { margin-top: 4rpx; color: rgba(255, 255, 255, 0.72); font-size: $font-size-xs; }
.summaryPercent {
  color: $color-text-white;
  font-family: $font-family-serif;
  font-size: 52rpx;
  font-weight: $font-weight-bold;
  line-height: 1;
}
.progressTrack { height: 10rpx; overflow: hidden; background: rgba(247, 245, 240, 0.24); border-radius: 0 0 $radius-lg $radius-lg; }
.progressFill { height: 100%; background: linear-gradient(90deg, #F5924E, #EA5F33); transition: width 0.45s $ease-out-expo; }

.manualForm { display: flex; gap: $spacing-sm; margin-top: $spacing-lg; }
.manualInput {
  flex: 1;
  min-width: 0;
  height: 76rpx;
  padding: 0 $spacing-md;
  color: $color-text-primary;
  font-size: $font-size-sm;
  background: $color-bg-card;
  border: 2rpx solid $color-border;
  border-radius: $radius-md;
}
.addButton {
  @include button-reset;
  @include press;
  gap: 6rpx;
  width: 148rpx;
  height: 76rpx;
  color: $color-text-white;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  background: $color-primary;
  border-radius: $radius-md;
}

.shoppingList { overflow: hidden; margin-top: $spacing-md; background: $color-bg-card; border: 2rpx solid $color-border; border-radius: $radius-lg; }
.shoppingRow { display: flex; align-items: center; min-height: 88rpx; padding: 12rpx $spacing-md; border-bottom: 2rpx solid $color-divider; }
.shoppingRow:last-child { border-bottom: none; }
.checkBox {
  @include press;
  width: 42rpx;
  height: 42rpx;
  margin-right: $spacing-md;
  background: $color-bg-page;
  border: 2rpx solid $color-border;
  border-radius: $radius-xs;
  @include flex-center;
  flex-shrink: 0;
}
.checkBoxActive { background: $color-primary; border-color: $color-primary; }
.shoppingCopy { flex: 1; min-width: 0; }
.shoppingName { color: $color-text-primary; font-size: $font-size-sm; font-weight: $font-weight-semibold; }
.shoppingNameChecked { color: $color-text-tertiary; text-decoration: line-through; }
.shoppingMeta { margin-top: 4rpx; color: $color-text-tertiary; font-size: $font-size-xs; }
.removeShopping { @include flex-center; width: 56rpx; height: 56rpx; flex-shrink: 0; }

.resetAction { display: block; margin-top: $spacing-md; padding: $spacing-sm; color: $color-error; font-size: $font-size-sm; font-weight: $font-weight-semibold; text-align: center; }
.shoppingNoticeText { color: $color-text-tertiary; font-size: $font-size-xs; line-height: $line-height-loose; }
</style>
