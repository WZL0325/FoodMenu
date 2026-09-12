# Layouts — 今天吃啥 (uni-app 微信小程序)

本应用**没有自定义布局组件**。外壳全部由微信小程序原生能力承担:

1. **原生导航栏**: 每页 `pages.json` 里 `style.navigationBarTitleText` 配置(米白 `#f7f5f0` 底、黑字),页面不自绘顶栏。
2. **原生 tabBar**: 3 个 tab(选菜/推荐/我的),配置在 `src/pages.json`,图标为 `src/static/tabbar/*.png`(Lucide 渲染的 PNG)。**tab 页面内容区底部统一留 `160rpx` padding 避让 tabBar**。
3. **页面壳**: 每页根节点 `.page { min-height: 100vh; padding: $spacing-lg $spacing-lg 160rpx(或 80rpx); background: $color-bg-page; }`。
4. 弹层由 `BottomSheet` 组件承担(fixed 定位)。

## 原生 tabBar 配置(摘自 src/pages.json)

```json
"tabBar": {
  "color": "#8a948c",
  "selectedColor": "#2f6b4f",
  "backgroundColor": "#ffffff",
  "borderStyle": "black",
  "list": [
    { "pagePath": "pages/index/index",    "text": "选菜", "iconPath": "static/tabbar/index.png",    "selectedIconPath": "static/tabbar/index-active.png" },
    { "pagePath": "pages/recommend/index", "text": "推荐", "iconPath": "static/tabbar/recommend.png", "selectedIconPath": "static/tabbar/recommend-active.png" },
    { "pagePath": "pages/favorites/index", "text": "我的", "iconPath": "static/tabbar/me.png",       "selectedIconPath": "static/tabbar/me-active.png" }
  ]
}
```

tabBar 图标语义(Lucide): 选菜 = utensils(餐具),推荐 = leaf(叶),我的 = user-round(人像)。

## 根组件 App.vue(全文)

```vue
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
```

## 全局样式 app.scss(全文)

```scss
@use './styles/variables.scss' as *;

page {
  font-family: $font-family-sans;
  font-size: $font-size-md;
  line-height: $line-height-normal;
  color: $color-text-primary;
  background-color: $color-bg-page;
  -webkit-tap-highlight-color: transparent;
}

view,
text,
scroll-view,
image {
  box-sizing: border-box;
}

button::after {
  border: none;
}

button,
text,
view {
  letter-spacing: 0;
}
```

## 各页通用「期刊引言头」模式(pageIntro)

推荐/我的/计划/隐私页共用同一开头模式(非组件,各页内联):

```html
<view class="pageIntro">
  <text class="introEyebrow">饮食目标</text>      <!-- 陶红小字 0.32em 字距 -->
  <text class="introTitle">适合你的日常选择</text>  <!-- 衬线 44rpx 粗体 -->
  <text class="introDesc">先选人群，再查看…</text>  <!-- 次要灰 -->
</view>
```
