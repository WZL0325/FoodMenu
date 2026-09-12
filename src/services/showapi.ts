import type { IngredientOption, IngredientType } from '@/types/recipe'
import type {
  ShowApiCategoryTree,
  ShowApiIngredientOption,
  ShowApiRecipe,
  ShowApiSearchResult,
} from '@/types/showapi'
import {
  SHOWAPI_CATEGORY_CACHE_KEY,
  SHOWAPI_RECIPE_CACHE_PREFIX,
} from '@/utils/storageKeys'

const CLOUD_FUNCTION_NAME = 'showapiRecipes'
const CATEGORY_CACHE_TTL = 7 * 24 * 60 * 60 * 1000

interface CloudSuccess<T> {
  ok: true
  data: T
}

interface CloudFailure {
  ok: false
  error: string
  code?: string
}

type CloudResponse<T> = CloudSuccess<T> | CloudFailure

interface CloudResult<T> {
  result?: CloudResponse<T>
}

interface CategoryCache {
  expiresAt: number
  options: ShowApiIngredientOption[]
}

const isCloudResponse = <T>(value: unknown): value is CloudResponse<T> => {
  return Boolean(value && typeof value === 'object' && 'ok' in value)
}

const callShowApiCloud = async <T>(action: string, data: Record<string, unknown> = {}): Promise<T> => {
  if (typeof wx === 'undefined' || !wx.cloud) {
    throw new Error('在线菜谱仅在已启用云开发的微信小程序中可用')
  }

  const response = await wx.cloud.callFunction({
    name: CLOUD_FUNCTION_NAME,
    data: { action, ...data },
  }) as CloudResult<T>
  const result = response.result

  if (!isCloudResponse<T>(result)) {
    throw new Error('在线菜谱服务返回格式异常')
  }
  if (!result.ok) {
    throw new Error(result.error || '在线菜谱服务暂不可用')
  }

  return result.data
}

const toIngredientType = (level1: string, level2: string): IngredientType | undefined => {
  if (level1 === '肉类') return 'meat'
  if (level1 === '水产') return 'seafood'
  if (level1 === '蛋奶豆制品') return 'eggSoy'
  if (level1 === '蔬菜水果') {
    if (level2 === '水果') return 'fruit'
    if (level2 === '菌菇类') return 'fungi'
    return 'vegetable'
  }
  if (level1 === '米面干果腌咸' && level2 === '米面类') return 'staple'
  return undefined
}

const normalizeCategoryTree = (tree: ShowApiCategoryTree): ShowApiIngredientOption[] => {
  const seen = new Set<string>()
  const options: ShowApiIngredientOption[] = []

  Object.entries(tree).forEach(([level1, level2Value]) => {
    if (!level2Value || typeof level2Value !== 'object' || Array.isArray(level2Value)) return

    Object.entries(level2Value).forEach(([level2, names]) => {
      const type = toIngredientType(level1, level2)
      if (!type || !Array.isArray(names)) return

      names.forEach((name) => {
        if (typeof name !== 'string') return
        const normalizedName = name.trim()
        if (!normalizedName || seen.has(normalizedName)) return
        seen.add(normalizedName)
        options.push({
          id: `showapi-${type}-${options.length}`,
          name: normalizedName,
          type,
        })
      })
    })
  })

  return options
}

const readCategoryCache = (): ShowApiIngredientOption[] | undefined => {
  try {
    const cached = uni.getStorageSync(SHOWAPI_CATEGORY_CACHE_KEY) as CategoryCache | undefined
    if (!cached || cached.expiresAt <= Date.now() || !Array.isArray(cached.options)) return undefined
    return cached.options
  } catch (error) {
    console.warn('[ShowAPI] 读取分类缓存失败', error)
    return undefined
  }
}

export const loadShowApiIngredientOptions = async (): Promise<ShowApiIngredientOption[]> => {
  const cached = readCategoryCache()
  if (cached) return cached

  const tree = await callShowApiCloud<ShowApiCategoryTree>('categories')
  const options = normalizeCategoryTree(tree)

  try {
    uni.setStorageSync(SHOWAPI_CATEGORY_CACHE_KEY, {
      expiresAt: Date.now() + CATEGORY_CACHE_TTL,
      options,
    } satisfies CategoryCache)
  } catch (error) {
    console.warn('[ShowAPI] 写入分类缓存失败', error)
  }

  return options
}

export const mergeIngredientOptions = (
  localOptions: IngredientOption[],
  onlineOptions: ShowApiIngredientOption[],
): IngredientOption[] => {
  const localNames = new Set(localOptions.map((item) => item.name))
  return [
    ...localOptions,
    ...onlineOptions
      .filter((item) => !localNames.has(item.name))
      .map((item) => ({ ...item })),
  ]
}

export const searchShowApiRecipes = async (keywords: string[]): Promise<ShowApiSearchResult> => {
  const normalizedKeywords = [...new Set(keywords.map((item) => item.trim()).filter(Boolean))].slice(0, 3)
  if (normalizedKeywords.length === 0) {
    return { recipes: [], queriedKeywords: [] }
  }

  return callShowApiCloud<ShowApiSearchResult>('search', { keywords: normalizedKeywords })
}

export const saveShowApiRecipe = (recipe: ShowApiRecipe): boolean => {
  try {
    uni.setStorageSync(`${SHOWAPI_RECIPE_CACHE_PREFIX}${recipe.id}`, recipe)
    return true
  } catch (error) {
    console.error('[ShowAPI] 保存在线菜谱失败', error)
    return false
  }
}

export const getShowApiRecipe = (recipeId: string): ShowApiRecipe | undefined => {
  try {
    const recipe = uni.getStorageSync(`${SHOWAPI_RECIPE_CACHE_PREFIX}${recipeId}`) as ShowApiRecipe | undefined
    return recipe && recipe.id === recipeId ? recipe : undefined
  } catch (error) {
    console.error('[ShowAPI] 读取在线菜谱失败', error)
    return undefined
  }
}
