const https = require('https')
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const API_HOST = 'route.showapi.com'
const CACHE_TTL = 6 * 60 * 60 * 1000
const memoryCache = new Map()

const success = (data) => ({ ok: true, data })
const failure = (error, code = 'SHOWAPI_ERROR') => ({ ok: false, error, code })

const getCached = (key) => {
  const cached = memoryCache.get(key)
  if (!cached || cached.expiresAt <= Date.now()) {
    memoryCache.delete(key)
    return undefined
  }
  return cached.data
}

const setCached = (key, data) => {
  memoryCache.set(key, { expiresAt: Date.now() + CACHE_TTL, data })
}

const requestShowApi = (point, form = {}) => {
  const appKey = process.env.SHOWAPI_APP_KEY
  if (!appKey) {
    return Promise.reject(new Error('云函数未配置 SHOWAPI_APP_KEY'))
  }

  const body = new URLSearchParams(form).toString()
  const path = `/${point}?appKey=${encodeURIComponent(appKey)}`

  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: API_HOST,
      path,
      method: 'POST',
      timeout: 12000,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'content-length': Buffer.byteLength(body),
      },
    }, (response) => {
      let raw = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => { raw += chunk })
      response.on('end', () => {
        if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`ShowAPI HTTP ${response.statusCode || 'unknown'}`))
          return
        }

        try {
          const parsed = JSON.parse(raw)
          if (parsed.showapi_res_code !== undefined && Number(parsed.showapi_res_code) !== 0) {
            reject(new Error(parsed.showapi_res_error || 'ShowAPI 请求失败'))
            return
          }
          resolve(parsed.showapi_res_body || parsed)
        } catch (error) {
          reject(new Error('ShowAPI 返回了无效 JSON'))
        }
      })
    })

    request.on('timeout', () => request.destroy(new Error('ShowAPI 请求超时')))
    request.on('error', reject)
    request.write(body)
    request.end()
  })
}

const asText = (value) => typeof value === 'string' ? value.trim() : ''

const normalizeIngredients = (value) => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => ({
      name: asText(item && (item.ylName || item.name)),
      amount: asText(item && (item.ylUnit || item.unit)),
    }))
    .filter((item) => item.name)
}

const normalizeSteps = (value) => {
  if (!Array.isArray(value)) return []
  return value
    .map((item, index) => ({
      content: asText(item && item.content),
      image: asText(item && item.imgUrl),
      order: Number(item && item.orderNum) || index + 1,
    }))
    .filter((item) => item.content)
    .sort((a, b) => a.order - b.order)
}

const normalizeRecipe = (item, queriedKeywords) => {
  const ingredients = normalizeIngredients(item && item.yl)
  const ingredientText = ingredients.map((ingredient) => ingredient.name).join(' ')
  const name = asText(item && item.cpName)
  const matchedIngredients = queriedKeywords.filter((keyword) => {
    return name.includes(keyword) || ingredientText.includes(keyword)
  })

  return {
    id: asText(item && item.id),
    name,
    description: asText(item && item.des),
    category: asText(item && item.type),
    categoryLevel1: asText(item && item.type_v1),
    categoryLevel2: asText(item && item.type_v2),
    categoryLevel3: asText(item && item.type_v3),
    ingredients,
    steps: normalizeSteps(item && item.steps),
    tips: asText(item && item.tip),
    image: asText(item && (item.largeImg || item.smallImg)),
    matchedIngredients,
    source: 'ShowAPI',
  }
}

const loadCategories = async () => {
  const cached = getCached('categories')
  if (cached) return cached

  const body = await requestShowApi('1164-2')
  if (String(body.ret_code) !== '0' || body.flag === false) {
    throw new Error(body.msg || body.remark || '菜谱分类查询失败')
  }

  const categories = { ...body }
  delete categories.ret_code
  delete categories.flag
  delete categories.msg
  delete categories.remark
  setCached('categories', categories)
  return categories
}

const searchRecipes = async (rawKeywords) => {
  const keywords = [...new Set((Array.isArray(rawKeywords) ? rawKeywords : [])
    .map(asText)
    .filter(Boolean))]
    .slice(0, 3)

  if (keywords.length === 0) return { recipes: [], queriedKeywords: [] }

  const cacheKey = `search:${keywords.sort().join('|')}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  const bodies = await Promise.all(keywords.map((keyword) => requestShowApi('1164-4', {
    cpName: keyword,
    maxResults: '10',
    page: '1',
  })))

  const recipeMap = new Map()
  bodies.forEach((body) => {
    if (!Array.isArray(body.datas)) return
    body.datas.forEach((item) => {
      const recipe = normalizeRecipe(item, keywords)
      if (!recipe.id || !recipe.name) return
      const existing = recipeMap.get(recipe.id)
      if (!existing || recipe.matchedIngredients.length > existing.matchedIngredients.length) {
        recipeMap.set(recipe.id, recipe)
      }
    })
  })

  const recipes = [...recipeMap.values()]
    .filter((recipe) => recipe.ingredients.length > 0 && recipe.steps.length > 0)
    .sort((a, b) => b.matchedIngredients.length - a.matchedIngredients.length
      || b.ingredients.length - a.ingredients.length
      || a.name.localeCompare(b.name, 'zh-CN'))
    .slice(0, 20)

  const result = { recipes, queriedKeywords: keywords }
  setCached(cacheKey, result)
  return result
}

exports.main = async (event = {}) => {
  try {
    if (event.action === 'categories') {
      return success(await loadCategories())
    }
    if (event.action === 'search') {
      return success(await searchRecipes(event.keywords))
    }
    return failure('不支持的操作', 'INVALID_ACTION')
  } catch (error) {
    console.error('[showapiRecipes]', error)
    return failure(error instanceof Error ? error.message : '在线菜谱服务异常')
  }
}

