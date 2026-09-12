<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onHide, onShow } from '@dcloudio/uni-app'
import { ingredientOptions } from '@/data/ingredients'
import { recipes } from '@/data/recipes'
import { saveShowApiRecipe, searchShowApiRecipes } from '@/services/showapi'
import { filterRecipesByExcludedIngredients, rankRecipesByIngredients } from '@/utils/recipeFilters'
import { browseRecipeMatches } from '@/utils/recipeBrowse'
import type { RecipeQuickFilter, RecipeSort } from '@/utils/recipeBrowse'
import { getDietaryProfile } from '@/utils/dietaryProfile'
import { getRecipeFeedbackMap } from '@/utils/recipeFeedback'
import { createRequestGuard } from '@/utils/requestGuard'
import type { DietaryProfile, IngredientType } from '@/types/recipe'
import type { RecipeFeedbackMap } from '@/types/recipeFeedback'
import type { ShowApiRecipe } from '@/types/showapi'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import OnlineRecipeCard from '@/components/OnlineRecipeCard/OnlineRecipeCard.vue'
import RecipeCard from '@/components/RecipeCard/RecipeCard.vue'
import SectionHeader from '@/components/SectionHeader/SectionHeader.vue'
import EmptyState from '@/components/EmptyState/EmptyState.vue'

type IngredientCategory = 'common' | IngredientType

const categories: { id: IngredientCategory, label: string, color: string }[] = [
  { id: 'common', label: '常用', color: '#ED6A3C' },
  { id: 'vegetable', label: '蔬菜', color: '#7CB98E' },
  { id: 'meat', label: '肉禽', color: '#E0705F' },
  { id: 'eggSoy', label: '蛋豆', color: '#E8B54D' },
  { id: 'seafood', label: '海鲜', color: '#6FA8D8' },
  { id: 'staple', label: '主食', color: '#E8955C' },
  { id: 'fungi', label: '菌菇', color: '#A9846B' },
  { id: 'fruit', label: '水果', color: '#E58BA2' },
  { id: 'seasoning', label: '调味', color: '#9B8BC4' },
]
const quickFilters: { id: RecipeQuickFilter, label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'quick', label: '20 分钟内' },
  { id: 'easy', label: '新手友好' },
]
const sortOptions: { id: RecipeSort, label: string }[] = [
  { id: 'recommended', label: '推荐排序' },
  { id: 'time', label: '用时最短' },
  { id: 'calories', label: '热量从低到高' },
]
const selected = ref<string[]>([])
const activeCategory = ref<IngredientCategory>('common')
const searchQuery = ref('')
const ingredientQuery = ref('')
const quickFilter = ref<RecipeQuickFilter>('all')
const sort = ref<RecipeSort>('recommended')
const visibleCount = ref(6)
const today = ref(new Date())
const heroImageFailed = ref(false)
const dietaryProfile = ref<DietaryProfile>({ excludedIngredients: [] })
const feedbackMap = ref<RecipeFeedbackMap>({})
const onlineRecipes = ref<ShowApiRecipe[]>([])
const onlineKeywords = ref<string[]>([])
const onlineLoading = ref(false)
const onlineError = ref('')
const requestGuard = createRequestGuard()

const dateStamp = computed(() => `${today.value.getMonth() + 1}月${today.value.getDate()}日`)
const availableRecipes = computed(() => filterRecipesByExcludedIngredients(recipes, dietaryProfile.value.excludedIngredients))
const rankedRecipes = computed(() => rankRecipesByIngredients(availableRecipes.value, selected.value, feedbackMap.value))
const result = computed(() => browseRecipeMatches(rankedRecipes.value, {
  query: searchQuery.value,
  quickFilter: quickFilter.value,
  sort: sort.value,
}))
const visibleRecipes = computed(() => result.value.slice(0, visibleCount.value))
const featuredRecipe = computed(() => {
  const candidates = rankRecipesByIngredients(availableRecipes.value, [], feedbackMap.value)
  return candidates[today.value.getDate() % Math.max(candidates.length, 1)]?.recipe
})
const hasFilters = computed(() => !!(selected.value.length || searchQuery.value.trim() || quickFilter.value !== 'all'))
const visibleIngredients = computed(() => {
  const keyword = ingredientQuery.value.trim().toLocaleLowerCase()
  if (keyword) {
    return ingredientOptions.filter((item) => [item.name, ...(item.keywords ?? [])]
      .some((value) => value.toLocaleLowerCase().includes(keyword)))
  }
  return activeCategory.value === 'common'
    ? ingredientOptions.filter((item) => item.common)
    : ingredientOptions.filter((item) => item.type === activeCategory.value)
})
const availableOnlineRecipes = computed(() => onlineRecipes.value.filter((recipe) => {
  const ingredientText = recipe.ingredients.map((ingredient) => ingredient.name).join(' ')
  return dietaryProfile.value.excludedIngredients.every((ingredient) => !ingredientText.includes(ingredient))
}))
const activeCategoryLabel = computed(() => ingredientQuery.value.trim()
  ? `找到 ${visibleIngredients.value.length} 种食材`
  : categories.find((item) => item.id === activeCategory.value)?.label ?? '食材')
const sortLabel = computed(() => sortOptions.find((item) => item.id === sort.value)?.label)

onShow(() => {
  today.value = new Date()
  dietaryProfile.value = getDietaryProfile()
  feedbackMap.value = getRecipeFeedbackMap()
})
onHide(() => {
  requestGuard.invalidate()
  onlineLoading.value = false
})
watch([searchQuery, quickFilter, sort, selected], () => { visibleCount.value = 6 })
watch(featuredRecipe, () => { heroImageFailed.value = false })

const resetOnlineResult = () => {
  requestGuard.invalidate()
  onlineRecipes.value = []
  onlineKeywords.value = []
  onlineError.value = ''
  onlineLoading.value = false
}
const toggle = (name: string) => {
  selected.value = selected.value.includes(name)
    ? selected.value.filter((item) => item !== name)
    : [...selected.value, name]
  resetOnlineResult()
}
const clearSelected = () => {
  selected.value = []
  resetOnlineResult()
}
const resetFilters = () => {
  clearSelected()
  searchQuery.value = ''
  quickFilter.value = 'all'
  sort.value = 'recommended'
}
const selectCategory = (category: IngredientCategory) => {
  activeCategory.value = category
  ingredientQuery.value = ''
}
const ingredientColor = (type: IngredientType) => categories.find((item) => item.id === type)?.color
const goProfile = () => uni.switchTab({ url: '/pages/favorites/index' })
const goRecommend = () => uni.switchTab({ url: '/pages/recommend/index' })
const goMealPlan = () => uni.navigateTo({ url: '/pages/meal-plan/index' })
const viewResults = () => uni.pageScrollTo({ selector: '#recipe-results', duration: 250 })
const changeSort = () => uni.showActionSheet({
  itemList: sortOptions.map((item) => item.label),
  success: ({ tapIndex }) => { sort.value = sortOptions[tapIndex].id },
})
const searchOnline = async () => {
  if (selected.value.length === 0 || onlineLoading.value) return
  const request = requestGuard.begin()
  const ingredients = [...selected.value]
  onlineLoading.value = true
  onlineError.value = ''
  try {
    const response = await searchShowApiRecipes(ingredients)
    if (!request.isCurrent()) return
    onlineRecipes.value = response.recipes
    onlineKeywords.value = response.queriedKeywords
    if (response.recipes.length === 0) onlineError.value = '在线菜谱库暂未找到完整原料和步骤的结果'
  } catch (error) {
    if (request.isCurrent()) onlineError.value = error instanceof Error ? error.message : '在线菜谱服务暂不可用'
  } finally {
    if (request.isCurrent()) onlineLoading.value = false
  }
}
const openOnlineRecipe = (recipe: ShowApiRecipe) => {
  if (!saveShowApiRecipe(recipe)) {
    uni.showToast({ title: '菜谱打开失败，请重试', icon: 'none' })
    return
  }
  uni.navigateTo({ url: `/pages/online-detail/index?id=${encodeURIComponent(recipe.id)}` })
}
const decideForMe = () => {
  const candidates = result.value.slice(0, 5)
  if (!candidates.length) {
    uni.showToast({ title: '暂无可选菜谱，试试调整筛选', icon: 'none' })
    return
  }
  const choice = candidates[Math.floor(Math.random() * candidates.length)]
  uni.navigateTo({ url: `/pages/detail/index?id=${encodeURIComponent(choice.recipe.id)}` })
}
const openFeatured = () => {
  if (featuredRecipe.value) uni.navigateTo({ url: `/pages/detail/index?id=${encodeURIComponent(featuredRecipe.value.id)}` })
}
const handleFeedbackChange = () => { feedbackMap.value = getRecipeFeedbackMap() }
</script>

<template>
  <view class="page">
    <view class="hero">
      <view class="heroCopy">
        <text class="heroDate">{{ dateStamp }}，好好吃饭</text>
        <text class="heroTitle">今天吃什么？</text>
        <text class="heroSub">把手头的食材，变成一顿好饭。</text>
        <view class="heroPill"><AppIcon name="utensils" :size="24" color="#ffffff" /><text>{{ recipes.length }} 道家常菜 · 离线也能看</text></view>
      </view>
      <button v-if="featuredRecipe" class="heroFeature" :aria-label="`查看今日灵感：${featuredRecipe.title}`" @tap="openFeatured">
        <image v-if="!heroImageFailed" class="heroImage" :src="featuredRecipe.image" mode="aspectFill" @error="heroImageFailed = true" />
        <view v-else class="heroImage heroImageFallback"><AppIcon name="utensils" :size="70" color="#ed6a3c" /></view>
        <text class="heroImageLabel">今日灵感</text>
      </button>
    </view>

    <view class="searchBar">
      <AppIcon name="search" :size="34" color="#8a7a6d" />
      <input v-model="searchQuery" class="searchInput" type="text" confirm-type="search" placeholder="搜菜名、食材，如番茄鸡蛋" aria-label="搜索菜谱" @confirm="viewResults" />
      <button v-if="searchQuery" class="searchClear" aria-label="清空菜谱搜索" @tap="searchQuery = ''"><AppIcon name="x" :size="28" color="#8a7a6d" /></button>
      <button class="searchButton" @tap="viewResults">搜索</button>
    </view>

    <view class="quickEntries">
      <button class="quickEntry quickEntryHealth" @tap="goRecommend"><AppIcon name="leaf" :size="36" color="#4c8b5e" /><view><text class="entryTitle">吃得合适</text><text class="entryDesc">按人群找灵感</text></view><AppIcon name="chevron-right" :size="26" color="#4c8b5e" /></button>
      <button class="quickEntry quickEntryPlan" @tap="goMealPlan"><AppIcon name="calendar" :size="36" color="#4a7fb5" /><view><text class="entryTitle">本周吃什么</text><text class="entryDesc">计划与买菜清单</text></view><AppIcon name="chevron-right" :size="26" color="#4a7fb5" /></button>
    </view>

    <view class="decisionCard">
      <view class="decisionCopy"><text class="decisionTitle">选择困难？交给我</text><text class="decisionDesc">根据当前筛选和忌口，帮你选一道。</text></view>
      <button class="decisionBtn" @tap="decideForMe"><AppIcon name="sparkles" :size="28" color="#ffffff" /><text>帮我选</text></button>
    </view>

    <view class="ingredientSection">
      <SectionHeader title="冰箱里有什么" subtitle="选几种食材，看看能做哪些菜" :action-text="selected.length ? '清空已选' : undefined" @action="clearSelected" />
      <view class="ingredientSearch"><AppIcon name="search" :size="28" color="#8a7a6d" /><input v-model="ingredientQuery" class="ingredientInput" placeholder="找食材，支持西红柿等别名" aria-label="搜索食材" /><button v-if="ingredientQuery" class="searchClear" aria-label="清空食材搜索" @tap="ingredientQuery = ''"><AppIcon name="x" :size="26" color="#8a7a6d" /></button></view>
      <scroll-view v-if="selected.length" scroll-x class="selectedScroll">
        <button v-for="name in selected" :key="name" class="selectedTag" :aria-label="`移除已选食材${name}`" @tap="toggle(name)"><text>{{ name }}</text><AppIcon name="x" :size="22" color="#b74724" /></button>
      </scroll-view>
      <view class="ingredientPicker">
        <scroll-view scroll-y class="categoryRail">
          <button v-for="category in categories" :key="category.id" class="categoryTab" :class="{ categoryTabActive: !ingredientQuery && activeCategory === category.id }" @tap="selectCategory(category.id)"><view class="categoryDot" :style="{ backgroundColor: category.color }" /><text>{{ category.label }}</text></button>
        </scroll-view>
        <view class="ingredientChoices">
          <view class="ingredientListHeading"><text>{{ activeCategoryLabel }}</text><text class="ingredientListCount">{{ visibleIngredients.length }} 种</text></view>
          <scroll-view scroll-y class="ingredientScroll">
            <view v-if="visibleIngredients.length" class="ingredientGrid">
              <button v-for="item in visibleIngredients" :key="item.id" class="ingredientItem" :class="{ ingredientItemActive: selected.includes(item.name) }" :aria-label="`${selected.includes(item.name) ? '取消选择' : '选择'}${item.name}`" @tap="toggle(item.name)">
                <view class="ingredientDot" :style="{ backgroundColor: ingredientColor(item.type) }" /><text class="ingredientName">{{ item.name }}</text><view class="selectIndicator"><AppIcon :name="selected.includes(item.name) ? 'check' : 'plus'" :size="24" :color="selected.includes(item.name) ? '#ffffff' : '#ed6a3c'" /></view>
              </button>
            </view>
            <view v-else class="ingredientEmpty"><text>没有找到这种食材</text><button @tap="ingredientQuery = ''">查看全部分类</button></view>
          </scroll-view>
        </view>
      </view>
      <view class="selectorSummary"><view><text class="summaryMain">已选 <text class="summaryStrong">{{ selected.length }}</text> 种食材</text><text class="summarySub">{{ result.length }} 道菜可供选择</text></view><button class="viewResultsButton" @tap="viewResults">查看能做啥<AppIcon name="chevron-right" :size="26" color="#ffffff" /></button></view>
    </view>

    <button v-if="dietaryProfile.excludedIngredients.length" class="profileStatus" @tap="goProfile"><AppIcon name="circle-check" :size="30" color="#4c8b5e" /><text class="profileStatusText">忌口已生效：已排除 {{ dietaryProfile.excludedIngredients.join('、') }}</text><AppIcon name="chevron-right" :size="26" color="#4c8b5e" /></button>

    <view id="recipe-results" class="resultSection">
      <SectionHeader :title="hasFilters ? `为你找到 ${result.length} 道菜` : '好好吃饭，从这一道开始'" :subtitle="searchQuery.trim() ? `搜索“${searchQuery.trim()}”` : (selected.length ? '匹配度基于食材重合，不代表健康适合度' : '本地精选，步骤与用料一目了然')" :action-text="hasFilters ? '重置' : undefined" @action="resetFilters" />
      <view class="resultToolbar"><view class="quickFilters"><button v-for="filter in quickFilters" :key="filter.id" class="filterChip" :class="{ filterChipActive: quickFilter === filter.id }" @tap="quickFilter = filter.id">{{ filter.label }}</button></view><button class="sortButton" @tap="changeSort"><text>{{ sortLabel }}</text><AppIcon name="chevron-down" :size="24" color="#8a7a6d" /></button></view>
      <EmptyState v-if="!result.length" icon="utensils" description="暂时没有合适的菜，换个关键词或放宽筛选试试。" :action-text="hasFilters ? '重置筛选' : '管理饮食偏好'" @action="hasFilters ? resetFilters() : goProfile()" />
      <view v-else class="list"><RecipeCard v-for="item in visibleRecipes" :key="item.recipe.id" :recipe="item.recipe" :match-score="selected.length ? item.score : undefined" :matched-ingredients="item.matchedIngredients" :missing-ingredients="item.missingIngredients" :feedback="feedbackMap[item.recipe.id]" show-feedback @feedback-change="handleFeedbackChange" /></view>
      <button v-if="result.length > visibleCount" class="loadMore" @tap="visibleCount += 6">再看 {{ Math.min(6, result.length - visibleCount) }} 道菜<AppIcon name="chevron-down" :size="26" color="#b74724" /></button>
      <text v-if="result.length" class="listCount">已展示 {{ visibleRecipes.length }} / {{ result.length }} 道菜谱</text>
    </view>

    <view v-if="selected.length" class="onlineSection">
      <SectionHeader title="再找点新灵感" :subtitle="onlineKeywords.length ? `已查询 ${onlineKeywords.join('、')}` : 'ShowAPI 在线菜谱，不参与健康推荐'" />
      <view v-if="onlineRecipes.length === 0" class="onlineCallout"><view class="onlineCalloutText"><text class="onlineCalloutTitle">联网查更多菜谱</text><text class="onlineCalloutDesc">点击后会将前 3 种食材名称发送至微信云函数，并由 ShowAPI 查询原料和制作步骤。</text></view><button class="onlineButton" :loading="onlineLoading" :disabled="onlineLoading" @tap="searchOnline">{{ onlineLoading ? '查询中' : '查更多' }}</button></view>
      <view v-if="onlineError" class="onlineError"><text>{{ onlineError }}</text><button class="retryAction" :disabled="onlineLoading" @tap="searchOnline">重试</button></view>
      <view v-if="availableOnlineRecipes.length" class="onlineList"><OnlineRecipeCard v-for="recipe in availableOnlineRecipes" :key="recipe.id" :recipe="recipe" @open="openOnlineRecipe" /></view>
      <view v-if="onlineRecipes.length && !availableOnlineRecipes.length" class="onlineError"><text>在线结果均包含你的忌口食材，已自动隐藏。</text></view>
      <view v-if="onlineRecipes.length" class="onlineFooter"><text>共 {{ availableOnlineRecipes.length }} 道可展示结果</text><button class="retryAction" :disabled="onlineLoading" @tap="searchOnline">{{ onlineLoading ? '查询中' : '重新查询' }}</button></view>
    </view>
    <text class="pageFootnote">好好吃饭，也照顾好自己的节奏</text>
  </view>
</template>

<style lang="scss" scoped>
.page { min-height: 100vh; padding: 0 $spacing-lg 80rpx; background: $color-bg-page; }
.hero { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; margin: 0 (-$spacing-lg); padding: 36rpx $spacing-lg 76rpx; color: white; background: $color-primary; border-radius: 0 0 52rpx 52rpx; }
.heroCopy { flex: 1; min-width: 0; }
.heroDate, .heroTitle, .heroSub { display: block; }
.heroDate { font-size: 22rpx; color: #fff6ec; }
.heroTitle { margin-top: 12rpx; font-size: 56rpx; font-weight: 800; line-height: 1.3; letter-spacing: -2rpx; white-space: nowrap; }
.heroSub { margin-top: 12rpx; font-size: 24rpx; line-height: 1.6; }
.heroPill { display: inline-flex; align-items: center; gap: 8rpx; margin-top: 24rpx; padding: 8rpx 16rpx; font-size: 20rpx; background: rgba(255, 255, 255, 0.15); border-radius: $radius-round; }
.heroFeature { @include button-reset; position: relative; flex-shrink: 0; width: 206rpx; height: 218rpx; margin-top: 6rpx; overflow: visible; background: transparent; }
.heroImage { display: block; width: 200rpx; height: 200rpx; border: 6rpx solid #fff3e4; border-radius: 44rpx; transform: rotate(5deg); box-shadow: 0 12rpx 28rpx rgba(124, 43, 12, 0.16); }
.heroImageFallback { @include flex-center; background: #fff3e4; }
.heroImageLabel { position: absolute; bottom: 0; left: 12rpx; padding: 8rpx 20rpx; color: $color-primary-dark; background: white; border-radius: $radius-round; font-size: 20rpx; font-weight: 600; }
.searchBar { position: relative; display: flex; align-items: center; gap: 14rpx; min-height: 96rpx; margin-top: -42rpx; padding: 10rpx 12rpx 10rpx 28rpx; background: white; border-radius: $radius-round; box-shadow: $shadow-float; }
.searchInput { flex: 1; min-width: 0; height: 72rpx; color: $color-text-primary; font-size: 24rpx; }
.searchClear { @include button-reset; width: 52rpx; height: 60rpx; flex-shrink: 0; background: transparent; }
.searchButton { @include button-reset; height: 72rpx; padding: 0 32rpx; color: white; background: $gradient-primary; border-radius: $radius-round; font-size: 26rpx; font-weight: 600; }
.quickEntries { display: flex; gap: 20rpx; margin-top: 28rpx; }
.quickEntry { @include button-reset; flex: 1; justify-content: space-between; gap: 14rpx; padding: 24rpx 20rpx; border-radius: 28rpx; }
.quickEntryHealth { background: #e8f3e2; }
.quickEntryPlan { background: #e4f0fa; }
.entryTitle, .entryDesc { display: block; text-align: left; }
.entryTitle { color: $color-text-primary; font-size: 26rpx; font-weight: 700; }
.entryDesc { margin-top: 4rpx; color: $color-text-secondary; font-size: 20rpx; }
.decisionCard { display: flex; align-items: center; gap: 20rpx; margin-top: 24rpx; padding: 28rpx; background: #ffe8d4; border-radius: 32rpx; }
.decisionCopy { flex: 1; min-width: 0; }
.decisionTitle, .decisionDesc { display: block; }
.decisionTitle { font-size: 30rpx; font-weight: 700; }
.decisionDesc { margin-top: 8rpx; font-size: 22rpx; color: $color-text-secondary; line-height: 1.6; }
.decisionBtn { @include button-reset; @include press; gap: 8rpx; min-height: 80rpx; padding: 0 28rpx; color: white; font-size: 26rpx; font-weight: 600; background: $gradient-primary; border-radius: $radius-round; }

.ingredientSection { margin-top: 12rpx; }
.ingredientSearch { display: flex; align-items: center; gap: 12rpx; height: 76rpx; padding: 0 24rpx; background: white; border-radius: $radius-round; }
.ingredientInput { flex: 1; min-width: 0; height: 76rpx; font-size: 24rpx; }
.selectedScroll { width: 100%; margin-top: 20rpx; white-space: nowrap; }
.selectedTag { @include button-reset; display: inline-flex; gap: 12rpx; min-height: 60rpx; padding: 8rpx 18rpx; margin-right: 12rpx; color: $color-primary-dark; background: #ffe4cf; border-radius: $radius-round; font-size: 22rpx; }
.ingredientPicker { display: flex; gap: 20rpx; margin-top: 20rpx; }
.categoryRail { width: 138rpx; height: 412rpx; flex-shrink: 0; padding: 8rpx; background: white; border-radius: 28rpx; }
.categoryTab { @include button-reset; justify-content: flex-start; gap: 12rpx; width: 100%; min-height: 66rpx; padding: 0 12rpx; margin-bottom: 4rpx; color: $color-text-secondary; font-size: 24rpx; background: transparent; border-radius: 20rpx; white-space: nowrap; }
.categoryDot { width: 10rpx; height: 10rpx; border-radius: 50%; flex-shrink: 0; }
.categoryTabActive { color: $color-primary-dark; font-weight: 700; background: #fff0df; }
.ingredientChoices { flex: 1; min-width: 0; }
.ingredientListHeading { display: flex; justify-content: space-between; height: 48rpx; padding: 0 4rpx; color: $color-text-secondary; font-size: 22rpx; }
.ingredientListCount { color: $color-text-tertiary; }
.ingredientScroll { height: 364rpx; }
.ingredientGrid { display: flex; flex-wrap: wrap; gap: 16rpx 12rpx; padding-bottom: 10rpx; }
.ingredientItem { @include button-reset; @include press; justify-content: flex-start; gap: 10rpx; width: calc((100% - 12rpx) / 2); min-height: 76rpx; padding: 10rpx 10rpx 10rpx 18rpx; border: 2rpx solid transparent; color: $color-text-primary; background: white; border-radius: $radius-round; }
.ingredientItemActive { border-color: #f2ac81; background: #fff4e8; }
.ingredientDot { width: 12rpx; height: 12rpx; border-radius: 50%; flex-shrink: 0; }
.ingredientName { flex: 1; min-width: 0; text-align: left; font-size: 24rpx; @include text-ellipsis; }
.selectIndicator { @include flex-center; width: 40rpx; height: 40rpx; flex-shrink: 0; border: 2rpx solid #f5d8c2; border-radius: 50%; }
.ingredientItemActive .selectIndicator { background: $color-primary; border-color: $color-primary; }
.ingredientEmpty { padding: 40rpx 10rpx; text-align: center; color: $color-text-secondary; font-size: 24rpx; }
.ingredientEmpty button { @include button-reset; margin-top: 20rpx; padding: 16rpx; color: $color-primary-dark; background: white; font-size: 24rpx; border-radius: $radius-round; }
.selectorSummary { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; padding: 24rpx; margin-top: 24rpx; background: white; border-radius: 32rpx; box-shadow: $shadow-card; }
.summaryMain, .summarySub { display: block; font-size: 24rpx; }
.summaryStrong { color: $color-primary-dark; font-size: 30rpx; font-weight: 700; }
.summarySub { margin-top: 4rpx; color: $color-text-tertiary; font-size: 20rpx; }
.viewResultsButton { @include button-reset; gap: 8rpx; height: 80rpx; padding: 0 28rpx; font-size: 26rpx; font-weight: 600; color: white; background: $gradient-primary; border-radius: $radius-round; }
.profileStatus { @include button-reset; justify-content: flex-start; gap: 16rpx; margin-top: 24rpx; padding: 24rpx; background: #e8f3e2; border-radius: 28rpx; white-space: normal; }
.profileStatusText { flex: 1; font-size: 22rpx; line-height: 1.6; color: #426f4e; }
.resultSection { margin-top: 12rpx; scroll-margin-top: 32rpx; }
.resultToolbar { display: flex; align-items: center; flex-wrap: wrap; justify-content: space-between; gap: 12rpx; margin-bottom: 24rpx; }
.quickFilters { display: flex; gap: 10rpx; }
.filterChip { @include button-reset; min-height: 64rpx; padding: 12rpx 20rpx; color: $color-text-secondary; background: white; font-size: 22rpx; border-radius: $radius-round; }
.filterChipActive { color: white; background: $color-primary; }
.sortButton { @include button-reset; gap: 6rpx; min-height: 64rpx; padding: 8rpx 0; color: $color-text-secondary; font-size: 22rpx; background: transparent; }
.list { display: flex; flex-direction: column; gap: 28rpx; }
.loadMore { @include button-reset; gap: 12rpx; width: 100%; min-height: 88rpx; margin-top: 28rpx; color: $color-primary-dark; font-size: 26rpx; font-weight: 600; border: 2rpx solid $color-border; background: white; border-radius: $radius-round; }
.listCount { display: block; padding: 24rpx 0; text-align: center; color: $color-text-tertiary; font-size: 22rpx; }
.onlineCallout { display: flex; align-items: center; gap: 20rpx; padding: 28rpx; background: #e4f0fa; border-radius: 32rpx; }
.onlineCalloutText { flex: 1; min-width: 0; }
.onlineCalloutTitle, .onlineCalloutDesc { display: block; }
.onlineCalloutTitle { font-size: 26rpx; font-weight: 700; color: #315f8d; }
.onlineCalloutDesc { margin-top: 12rpx; font-size: 22rpx; line-height: 1.7; color: $color-text-secondary; }
.onlineButton { @include button-reset; flex-shrink: 0; min-height: 80rpx; padding: 0 24rpx; color: white; background: $color-info; border-radius: $radius-round; font-size: 24rpx; }
.onlineButton[disabled], .retryAction[disabled] { opacity: 0.6; }
.onlineError, .onlineFooter { display: flex; align-items: center; gap: 16rpx; justify-content: space-between; margin-top: 16rpx; padding: 20rpx 24rpx; border-radius: 24rpx; background: white; color: $color-text-secondary; font-size: 22rpx; line-height: 1.6; }
.retryAction { @include button-reset; flex-shrink: 0; min-height: 64rpx; padding: 0 12rpx; background: transparent; color: $color-info; font-size: 22rpx; }
.onlineList { display: flex; flex-direction: column; gap: 24rpx; }
.pageFootnote { display: block; margin-top: 48rpx; text-align: center; color: $color-text-tertiary; font-size: 22rpx; }
@media (max-width: 360px) {
  .heroTitle { font-size: 50rpx; }
  .heroFeature { width: 180rpx; }
  .heroImage { width: 174rpx; height: 174rpx; }
  .quickEntry { gap: 10rpx; padding: 22rpx 16rpx; }
  .entryDesc { font-size: 19rpx; }
}
</style>
