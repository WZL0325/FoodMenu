<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onHide, onShow } from '@dcloudio/uni-app'
import { ingredientOptions } from '@/data/ingredients'
import { recipes } from '@/data/recipes'
import { saveShowApiRecipe, searchShowApiRecipes } from '@/services/showapi'
import { filterRecipesByDietaryProfile, getIngredientConflicts, rankRecipesByIngredients } from '@/utils/recipeFilters'
import { browseRecipeMatches } from '@/utils/recipeBrowse'
import type { RecipeQuickFilter, RecipeSort } from '@/utils/recipeBrowse'
import { getRecipeCollection } from '@/utils/recipeCollections'
import type { RecipeCollectionId } from '@/utils/recipeCollections'
import { getDietaryProfile } from '@/utils/dietaryProfile'
import { getRecipeFeedbackMap } from '@/utils/recipeFeedback'
import { createRequestGuard } from '@/utils/requestGuard'
import { clearPendingPlanTarget, peekPendingPlanTarget } from '@/utils/recommendHandoff'
import { getWeekDays, mealOptions } from '@/utils/mealPlan'
import type { DietaryProfile, IngredientType, Recipe } from '@/types/recipe'
import type { PlanTarget } from '@/types/mealPlan'
import type { RecipeFeedbackMap } from '@/types/recipeFeedback'
import type { ShowApiRecipe } from '@/types/showapi'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import OnlineRecipeCard from '@/components/OnlineRecipeCard/OnlineRecipeCard.vue'
import RecipeCard from '@/components/RecipeCard/RecipeCard.vue'
import SectionHeader from '@/components/SectionHeader/SectionHeader.vue'
import EmptyState from '@/components/EmptyState/EmptyState.vue'

type IngredientCategory = 'common' | IngredientType

const categories: { id: IngredientCategory, label: string, color: string }[] = [
  { id: 'common', label: '常用', color: '#F45B3C' },
  { id: 'vegetable', label: '蔬菜', color: '#56A968' },
  { id: 'meat', label: '肉禽', color: '#E0705F' },
  { id: 'eggSoy', label: '蛋豆', color: '#E8B54D' },
  { id: 'seafood', label: '海鲜', color: '#6FA8D8' },
  { id: 'staple', label: '主食', color: '#E8955C' },
  { id: 'fungi', label: '菌菇', color: '#A9846B' },
  { id: 'fruit', label: '水果', color: '#D94B71' },
  { id: 'seasoning', label: '调味', color: '#9B8BC4' },
]
const collections: { id: RecipeCollectionId, label: string, subtitle: string }[] = [
  { id: 'quick', label: '20 分钟快手', subtitle: '下班也能快速开饭' },
  { id: 'home-style', label: '家常下饭', subtitle: '熟悉的家味道' },
  { id: 'light', label: '轻食低负担', subtitle: '低脂低糖更轻盈' },
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
const pendingPlanTarget = ref<PlanTarget>()
const requestGuard = createRequestGuard()

const dateStamp = computed(() => `${today.value.getMonth() + 1}月${today.value.getDate()}日`)
const availableRecipes = computed(() => filterRecipesByDietaryProfile(recipes, dietaryProfile.value))
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
const collectionRows = computed(() => collections
  .map(({ id, label, subtitle }) => ({
    id,
    label,
    subtitle,
    recipes: getRecipeCollection(rankedRecipes.value.map(({ recipe }) => recipe), id, { selectedIngredients: selected.value }).slice(0, 6),
  }))
  .filter((row) => row.recipes.length > 0))
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
  const ingredientNames = recipe.ingredients.map((ingredient) => ingredient.name)
  return getIngredientConflicts(ingredientNames, dietaryProfile.value.excludedIngredients).length === 0
}))
const activeCategoryLabel = computed(() => ingredientQuery.value.trim()
  ? `找到 ${visibleIngredients.value.length} 种食材`
  : categories.find((item) => item.id === activeCategory.value)?.label ?? '食材')
const sortLabel = computed(() => sortOptions.find((item) => item.id === sort.value)?.label)

onShow(() => {
  today.value = new Date()
  dietaryProfile.value = getDietaryProfile()
  feedbackMap.value = getRecipeFeedbackMap()
  pendingPlanTarget.value = peekPendingPlanTarget()
})
onHide(() => {
  requestGuard.invalidate()
  onlineLoading.value = false
})
const clearPlanTarget = () => {
  clearPendingPlanTarget()
  pendingPlanTarget.value = undefined
}
const pendingPlanTargetLabel = computed(() => {
  const target = pendingPlanTarget.value
  if (!target) return ''
  const day = getWeekDays().find((item) => item.key === target.date)
  const meal = mealOptions.find((item) => item.id === target.meal)
  return `${day?.weekday ?? target.date} ${meal?.label ?? ''}`
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
const openDetail = (recipe: Recipe) => uni.navigateTo({ url: `/pages/detail/index?id=${encodeURIComponent(recipe.id)}` })
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
  openDetail(choice.recipe)
}
const openFeatured = () => {
  if (featuredRecipe.value) openDetail(featuredRecipe.value)
}
</script>

<template>
  <view class="page">
    <view class="hero">
      <view class="heroCopy">
        <text class="heroDate">{{ dateStamp }}，好好吃饭</text>
        <text class="heroTitle">今天吃什么？</text>
        <text class="heroSub">不纠结，从 {{ recipes.length }} 道本地菜里选一道。</text>
        <view class="heroPill"><AppIcon name="utensils" :size="24" color="#ffffff" /><text>{{ recipes.length }} 道本地菜 · 离线可看</text></view>
      </view>
      <button v-if="featuredRecipe" class="heroFeature" :aria-label="`查看今日灵感：${featuredRecipe.title}`" @tap="openFeatured">
        <image v-if="!heroImageFailed" class="heroImage" :src="featuredRecipe.image" mode="aspectFill" @error="heroImageFailed = true" />
        <view v-else class="heroImage heroImageFallback"><AppIcon name="utensils" :size="70" color="#ffffff" /></view>
        <text class="heroImageLabel">今日灵感</text>
      </button>
    </view>

    <view class="searchBar">
      <AppIcon name="search" :size="34" color="#8f8a97" />
      <input v-model="searchQuery" class="searchInput" type="text" confirm-type="search" placeholder="搜菜名、食材，如番茄鸡蛋" aria-label="搜索菜谱" @confirm="viewResults" />
      <button v-if="searchQuery" class="searchClear" aria-label="清空菜谱搜索" @tap="searchQuery = ''"><AppIcon name="x" :size="28" color="#8f8a97" /></button>
      <button class="searchButton" @tap="viewResults">开始找</button>
    </view>

    <view class="decisionRow">
      <button class="decisionCard decisionCardRandom" @tap="decideForMe">
        <view class="decisionIconWrap decisionIconRandom"><AppIcon name="sparkles" :size="34" color="#ffffff" /></view>
        <view class="decisionCopy"><text class="decisionTitle">今晚吃什么</text><text class="decisionDesc">帮我随机选一道</text></view>
      </button>
      <button class="decisionCard decisionCardPlan" @tap="goMealPlan">
        <view class="decisionIconWrap decisionIconPlan"><AppIcon name="calendar" :size="34" color="#ffffff" /></view>
        <view class="decisionCopy"><text class="decisionTitle">本周餐桌</text><text class="decisionDesc">计划与买菜</text></view>
      </button>
      <button class="decisionCard decisionCardHealth" @tap="goRecommend">
        <view class="decisionIconWrap decisionIconHealth"><AppIcon name="leaf" :size="34" color="#ffffff" /></view>
        <view class="decisionCopy"><text class="decisionTitle">按人群推荐</text><text class="decisionDesc">健康目标筛选</text></view>
      </button>
    </view>

    <view v-if="pendingPlanTarget" class="pendingPlanBar">
      <AppIcon name="calendar-plus" :size="28" color="#c83d2c" />
      <view class="pendingPlanCopy"><text class="pendingPlanTitle">正在为 {{ pendingPlanTargetLabel }} 选菜</text><text class="pendingPlanDesc">打开菜谱后会自动预选这个餐次</text></view>
      <button class="pendingPlanCancel" aria-label="取消餐次定位" @tap="clearPlanTarget">取消</button>
    </view>

    <view v-if="collectionRows.length" class="collectionArea">
      <view v-for="row in collectionRows" :key="row.id" class="collectionBlock">
        <view class="collectionHeader">
          <view class="collectionHeading"><text class="collectionTitle">{{ row.label }}</text><text class="collectionSub">{{ row.subtitle }}</text></view>
        </view>
        <scroll-view scroll-x class="collectionScroll" :show-scrollbar="false">
          <view class="collectionTrack">
            <view v-for="item in row.recipes" :key="item.id" class="collectionCard">
              <RecipeCard :recipe="item" compact @tap="openDetail(item)" />
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <view class="ingredientSection">
      <SectionHeader title="冰箱里有什么" subtitle="任选食材即可匹配，选得越多匹配越准" :action-text="selected.length ? '清空已选' : undefined" @action="clearSelected" />
      <view class="ingredientSearch"><AppIcon name="search" :size="28" color="#8f8a97" /><input v-model="ingredientQuery" class="ingredientInput" placeholder="找食材，支持西红柿等别名" aria-label="搜索食材" /><button v-if="ingredientQuery" class="searchClear" aria-label="清空食材搜索" @tap="ingredientQuery = ''"><AppIcon name="x" :size="26" color="#8f8a97" /></button></view>
      <scroll-view v-if="selected.length" scroll-x class="selectedScroll">
        <button v-for="name in selected" :key="name" class="selectedTag" :aria-label="`移除已选食材${name}`" @tap="toggle(name)"><text>{{ name }}</text><AppIcon name="x" :size="22" color="#c83d2c" /></button>
      </scroll-view>
      <view class="ingredientPicker">
        <scroll-view scroll-x class="categoryRail">
          <button v-for="category in categories" :key="category.id" class="categoryTab" :class="{ categoryTabActive: !ingredientQuery && activeCategory === category.id }" @tap="selectCategory(category.id)"><view class="categoryDot" :style="{ backgroundColor: category.color }" /><text>{{ category.label }}</text></button>
        </scroll-view>
        <view class="ingredientChoices">
          <view class="ingredientListHeading"><text>{{ activeCategoryLabel }}</text><text class="ingredientListCount">{{ visibleIngredients.length }} 种</text></view>
          <view class="ingredientScroll">
            <view v-if="visibleIngredients.length" class="ingredientGrid">
              <button v-for="item in visibleIngredients" :key="item.id" class="ingredientItem" :class="{ ingredientItemActive: selected.includes(item.name) }" :aria-label="`${selected.includes(item.name) ? '取消选择' : '选择'}${item.name}`" @tap="toggle(item.name)">
                <view class="ingredientDot" :style="{ backgroundColor: ingredientColor(item.type) }" /><text class="ingredientName">{{ item.name }}</text><view class="selectIndicator"><AppIcon :name="selected.includes(item.name) ? 'check' : 'plus'" :size="24" :color="selected.includes(item.name) ? '#ffffff' : '#f45b3c'" /></view>
              </button>
            </view>
            <view v-else class="ingredientEmpty"><text>没有找到这种食材</text><button @tap="ingredientQuery = ''">查看全部分类</button></view>
          </view>
        </view>
      </view>
      <view class="selectorSummary"><view><text class="summaryMain">已选 <text class="summaryStrong">{{ selected.length }}</text> 种食材</text><text class="summarySub">{{ result.length }} 道菜可供选择</text></view><button class="viewResultsButton" @tap="viewResults">查看能做啥<AppIcon name="chevron-right" :size="26" color="#ffffff" /></button></view>
    </view>

    <button v-if="dietaryProfile.healthGroup || dietaryProfile.excludedIngredients.length" class="profileStatus" @tap="goProfile"><AppIcon name="circle-check" :size="30" color="#56a968" /><text class="profileStatusText">{{ dietaryProfile.healthGroup ? `目标：${dietaryProfile.healthGroup}` : '已设置忌口' }}{{ dietaryProfile.excludedIngredients.length ? ` · 已排除 ${dietaryProfile.excludedIngredients.join('、')}` : '' }}</text><AppIcon name="chevron-right" :size="26" color="#56a968" /></button>

    <view id="recipe-results" class="resultSection">
      <SectionHeader :title="hasFilters ? `为你找到 ${result.length} 道菜` : '全部菜谱'" :subtitle="searchQuery.trim() ? `搜索“${searchQuery.trim()}”` : (selected.length ? '匹配度基于食材重合，不代表健康适合度' : `${recipes.length} 道本地菜，步骤与用料一目了然`)" :action-text="hasFilters ? '重置' : undefined" @action="resetFilters" />
      <view class="resultToolbar"><view class="quickFilters"><button v-for="filter in quickFilters" :key="filter.id" class="filterChip" :class="{ filterChipActive: quickFilter === filter.id }" @tap="quickFilter = filter.id">{{ filter.label }}</button></view><button class="sortButton" @tap="changeSort"><text>{{ sortLabel }}</text><AppIcon name="chevron-down" :size="24" color="#8f8a97" /></button></view>
      <EmptyState v-if="!result.length" icon="utensils" description="暂时没有合适的菜，换个关键词或放宽筛选试试。" :action-text="hasFilters ? '重置筛选' : '管理饮食偏好'" @action="hasFilters ? resetFilters() : goProfile()" />
      <view v-else class="list"><RecipeCard v-for="item in visibleRecipes" :key="item.recipe.id" :recipe="item.recipe" compact :match-score="selected.length ? item.score : undefined" :matched-ingredients="item.matchedIngredients" :missing-ingredients="item.missingIngredients" :feedback="feedbackMap[item.recipe.id]" /></view>
      <button v-if="result.length > visibleCount" class="loadMore" @tap="visibleCount += 6">再看 {{ Math.min(6, result.length - visibleCount) }} 道菜<AppIcon name="chevron-down" :size="26" color="#c83d2c" /></button>
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
.page { min-height: 100vh; padding: 0 $spacing-lg calc(160rpx + env(safe-area-inset-bottom)); background: $color-bg-page; }
.hero { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; margin: 0 (-$spacing-lg); padding: 36rpx $spacing-lg 84rpx; color: white; background: $gradient-primary; border-radius: 0 0 48rpx 48rpx; }
.heroCopy { flex: 1; min-width: 0; }
.heroDate, .heroTitle, .heroSub { display: block; }
.heroDate { font-size: 22rpx; color: #ffe9de; }
.heroTitle { margin-top: 12rpx; font-size: 56rpx; font-weight: 800; line-height: 1.3; letter-spacing: -2rpx; white-space: nowrap; }
.heroSub { margin-top: 12rpx; font-size: 24rpx; line-height: 1.6; }
.heroPill { display: inline-flex; align-items: center; gap: 8rpx; margin-top: 24rpx; padding: 8rpx 16rpx; font-size: 20rpx; background: rgba(255, 255, 255, 0.18); border-radius: $radius-round; }
.heroFeature { @include button-reset; position: relative; flex-shrink: 0; width: 206rpx; height: 218rpx; margin-top: 6rpx; overflow: visible; background: transparent; }
.heroImage { display: block; width: 200rpx; height: 200rpx; border: 6rpx solid rgba(255, 255, 255, 0.85); border-radius: 44rpx; transform: rotate(5deg); box-shadow: 0 12rpx 28rpx rgba(140, 32, 12, 0.2); }
.heroImageFallback { @include flex-center; background: rgba(255, 255, 255, 0.25); }
.heroImageLabel { position: absolute; bottom: 0; left: 12rpx; padding: 8rpx 20rpx; color: $color-primary-dark; background: white; border-radius: $radius-round; font-size: 20rpx; font-weight: 600; }
.searchBar { position: relative; display: flex; align-items: center; gap: 14rpx; min-height: 96rpx; margin-top: -46rpx; padding: 10rpx 12rpx 10rpx 28rpx; background: white; border-radius: $radius-round; box-shadow: $shadow-float; }
.searchInput { flex: 1; min-width: 0; height: 72rpx; color: $color-text-primary; font-size: 24rpx; }
.searchClear { @include button-reset; width: 52rpx; height: 60rpx; flex-shrink: 0; background: transparent; }
.searchButton { @include button-reset; height: 72rpx; padding: 0 32rpx; color: $color-text-white; background: $color-primary-dark; border-radius: $radius-round; font-size: 26rpx; font-weight: 600; }
.decisionRow { display: flex; gap: 16rpx; margin-top: 28rpx; }
.decisionCard { @include button-reset; @include press; flex: 1; flex-direction: column; gap: 12rpx; padding: 24rpx 12rpx 20rpx; border-radius: 28rpx; }
.decisionCardRandom { color: $color-primary-dark; background: #ffe9dd; }
.decisionCardPlan { color: #3d7a4d; background: $color-green-light; }
.decisionCardHealth { color: #b03a5b; background: $color-berry-light; }
.decisionIconWrap { @include flex-center; width: 72rpx; height: 72rpx; border-radius: 50%; }
.decisionIconRandom { background: $color-primary; }
.decisionIconPlan { background: $color-green; }
.decisionIconHealth { background: $color-berry; }
.decisionCopy { display: flex; flex-direction: column; align-items: center; }
.decisionTitle { font-size: 25rpx; font-weight: 700; }
.decisionDesc { margin-top: 4rpx; font-size: 20rpx; opacity: 0.75; }
.pendingPlanBar { display: flex; align-items: center; gap: 16rpx; margin-top: 24rpx; padding: 20rpx 24rpx; background: #ffe9dd; border: 2rpx solid rgba(200, 61, 44, 0.16); border-radius: 24rpx; }
.pendingPlanCopy { flex: 1; min-width: 0; }
.pendingPlanTitle, .pendingPlanDesc { display: block; }
.pendingPlanTitle { color: $color-primary-dark; font-size: 24rpx; font-weight: 700; }
.pendingPlanDesc { margin-top: 4rpx; color: $color-text-secondary; font-size: 20rpx; }
.pendingPlanCancel { @include button-reset; min-height: 56rpx; padding: 0 16rpx; color: $color-primary-dark; font-size: 22rpx; background: white; border-radius: $radius-round; }
.collectionArea { margin-top: 8rpx; }
.collectionBlock { margin-top: 32rpx; }
.collectionHeader { display: flex; align-items: center; justify-content: space-between; padding: 0 4rpx; }
.collectionHeading { display: flex; align-items: baseline; gap: 14rpx; }
.collectionTitle { color: $color-text-primary; font-size: 32rpx; font-weight: 800; letter-spacing: -1rpx; }
.collectionSub { color: $color-text-tertiary; font-size: 22rpx; }
.collectionScroll { width: 100%; margin-top: 20rpx; white-space: nowrap; }
.collectionTrack { display: inline-flex; gap: 20rpx; padding: 4rpx; }
.collectionCard { @include scroll-x-item(420rpx); }
.ingredientSection { margin-top: 16rpx; }
.ingredientSearch { display: flex; align-items: center; gap: 12rpx; height: 76rpx; padding: 0 24rpx; background: white; border-radius: $radius-round; }
.ingredientInput { flex: 1; min-width: 0; height: 76rpx; font-size: 24rpx; }
.selectedScroll { width: 100%; margin-top: 20rpx; white-space: nowrap; }
.selectedTag { @include button-reset; display: inline-flex; gap: 12rpx; min-height: 60rpx; padding: 8rpx 18rpx; margin-right: 12rpx; color: $color-primary-dark; background: #ffe9dd; border-radius: $radius-round; font-size: 22rpx; }
.ingredientPicker { display: block; margin-top: 20rpx; }
.categoryRail { display: flex; width: 100%; padding: 8rpx 0; white-space: nowrap; }
.categoryTab { @include button-reset; display: inline-flex; justify-content: flex-start; gap: 12rpx; min-height: 66rpx; padding: 0 20rpx; margin-right: 12rpx; color: $color-text-secondary; font-size: 24rpx; background: white; border-radius: 20rpx; white-space: nowrap; }
.categoryTab:last-child { margin-right: 0; }
.categoryDot { width: 10rpx; height: 10rpx; border-radius: 50%; flex-shrink: 0; }
.categoryTabActive { color: $color-primary-dark; font-weight: 700; background: #ffe9dd; box-shadow: inset 0 0 0 2rpx rgba(200, 61, 44, 0.18); }
.ingredientChoices { min-width: 0; }
.ingredientListHeading { margin-top: 12rpx; display: flex; justify-content: space-between; height: 48rpx; padding: 0 4rpx; color: $color-text-secondary; font-size: 22rpx; }
.ingredientListCount { color: $color-text-tertiary; }
.ingredientScroll { min-height: 180rpx; }
.ingredientGrid { display: flex; flex-wrap: wrap; gap: 16rpx 12rpx; padding-bottom: 10rpx; }
.ingredientItem { @include button-reset; @include press; justify-content: flex-start; gap: 10rpx; width: calc((100% - 12rpx) / 2); min-height: 76rpx; padding: 10rpx 10rpx 10rpx 18rpx; border: 2rpx solid transparent; color: $color-text-primary; background: white; border-radius: $radius-round; }
.ingredientItemActive { border-color: #f5a48f; background: #fff1ea; }
.ingredientDot { width: 12rpx; height: 12rpx; border-radius: 50%; flex-shrink: 0; }
.ingredientName { flex: 1; min-width: 0; text-align: left; font-size: 24rpx; @include text-ellipsis; }
.selectIndicator { @include flex-center; width: 40rpx; height: 40rpx; flex-shrink: 0; border: 2rpx solid #f5d3c8; border-radius: 50%; }
.ingredientItemActive .selectIndicator { background: $color-primary; border-color: $color-primary; }
.ingredientEmpty { padding: 40rpx 10rpx; text-align: center; color: $color-text-secondary; font-size: 24rpx; }
.ingredientEmpty button { @include button-reset; margin-top: 20rpx; padding: 16rpx; color: $color-primary-dark; background: white; font-size: 24rpx; border-radius: $radius-round; }
.selectorSummary { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; padding: 24rpx; margin-top: 24rpx; background: white; border-radius: 32rpx; box-shadow: $shadow-card; }
.summaryMain, .summarySub { display: block; font-size: 24rpx; }
.summaryStrong { color: $color-primary-dark; font-size: 30rpx; font-weight: 700; }
.summarySub { margin-top: 4rpx; color: $color-text-tertiary; font-size: 20rpx; }
.viewResultsButton { @include button-reset; gap: 8rpx; height: 80rpx; padding: 0 28rpx; font-size: 26rpx; font-weight: 600; color: $color-text-white; background: $color-primary-dark; border-radius: $radius-round; }
.profileStatus { @include button-reset; justify-content: flex-start; gap: 16rpx; margin-top: 24rpx; padding: 24rpx; background: $color-green-light; border-radius: 28rpx; white-space: normal; }
.profileStatusText { flex: 1; font-size: 22rpx; line-height: 1.6; color: #3d6f4b; }
.resultSection { margin-top: 16rpx; scroll-margin-top: 32rpx; }
.resultToolbar { display: flex; align-items: center; flex-wrap: wrap; justify-content: space-between; gap: 12rpx; margin-bottom: 24rpx; }
.quickFilters { display: flex; gap: 10rpx; }
.filterChip { @include button-reset; min-height: 64rpx; padding: 12rpx 20rpx; color: $color-text-secondary; background: white; font-size: 22rpx; border-radius: $radius-round; }
.filterChipActive { color: $color-text-white; background: $color-primary-dark; }
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
  .decisionTitle { font-size: 23rpx; }
  .decisionDesc { font-size: 19rpx; }
  .collectionCard { @include scroll-x-item(380rpx); }
}
</style>
