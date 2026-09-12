import { healthProfiles } from '@/data/healthProfiles'
import type { DietaryProfile, HealthGroup } from '@/types/recipe'
import { DIETARY_PROFILE_STORAGE_KEY } from '@/utils/storageKeys'

const isHealthGroup = (value: unknown): value is HealthGroup => {
  return typeof value === 'string' && healthProfiles.some((profile) => profile.id === value)
}

const normalizeProfile = (value: unknown): DietaryProfile => {
  if (!value || typeof value !== 'object') return { excludedIngredients: [] }

  const profile = value as Partial<DietaryProfile>
  const excludedIngredients = Array.isArray(profile.excludedIngredients)
    ? [...new Set(profile.excludedIngredients.filter((item): item is string => typeof item === 'string'))]
    : []

  return {
    healthGroup: isHealthGroup(profile.healthGroup) ? profile.healthGroup : undefined,
    excludedIngredients,
  }
}

export const getDietaryProfile = (): DietaryProfile => {
  try {
    return normalizeProfile(uni.getStorageSync(DIETARY_PROFILE_STORAGE_KEY))
  } catch (error) {
    console.error('[DietaryProfile] 读取饮食档案失败', error)
    return { excludedIngredients: [] }
  }
}

export const saveDietaryProfile = (profile: DietaryProfile): boolean => {
  try {
    uni.setStorageSync(DIETARY_PROFILE_STORAGE_KEY, normalizeProfile(profile))
    return true
  } catch (error) {
    console.error('[DietaryProfile] 保存饮食档案失败', error)
    return false
  }
}
