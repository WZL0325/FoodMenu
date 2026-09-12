<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { ingredientOptions } from '@/data/ingredients'
import { recipes } from '@/data/recipes'
import { healthProfiles } from '@/data/healthProfiles'
import { validateRecipeData } from '@/utils/recipeDataValidation'
import './app.scss'

onLaunch(() => {
  const dataIssues = validateRecipeData(recipes, ingredientOptions, healthProfiles)
  if (dataIssues.length) {
    console.error('[RecipeData] 本地菜谱数据校验失败', dataIssues)
  }

  // #ifdef MP-WEIXIN
  if (typeof wx !== 'undefined' && wx.cloud) {
    const env = import.meta.env.VITE_WEIXIN_CLOUD_ENV
    wx.cloud.init({
      ...(env ? { env } : {}),
      traceUser: false,
    })
  }
  // #endif
})
</script>

<template>
  <slot />
</template>
