# Routes — 今天吃啥 (uni-app 微信小程序)

路由配置: `src/pages.json`(uni-app 约定式,非文件路由)。7 个页面 + 3 tab。

| 路由 | 页面 | 导航栏标题 | tab | 布局 |
|---|---|---|---|---|
| `pages/index/index` | 首页·选菜 | 选菜 · 今天吃啥 | ✅ tab1 | 杂志封面 hero + 食材选择卡 + 匹配结果列表 + 联网扩展 |
| `pages/recommend/index` | 健康推荐 | 健康推荐 | ✅ tab2 | 人群横滑标签 + 今日提醒卡 + 推荐菜谱列表 + 健康边界声明 |
| `pages/detail/index` | 菜谱详情 | 菜谱详情 | ❌ | 大图封面 + 文章头(收藏/分享) + 反馈面板 + 用料/营养条/人群/编号步骤 + 小贴士 + 加计划弹层 |
| `pages/online-detail/index` | 在线菜谱详情 | 在线菜谱 | ❌ | 蓝灰渐变封面(无图,食材标签代替) + 用料表 + 编号步骤 + 来源声明 |
| `pages/favorites/index` | 我的 | 我的 | ✅ tab3 | 引言 + 01 饮食档案(人群/忌口) + 02 收藏 + 03 餐桌安排入口 + 04 隐私与数据管理面板 |
| `pages/meal-plan/index` | 本周计划 | 本周计划 | ❌ | 引言 + 分段控件(本周计划/购物清单) + 7 天×3 餐网格 / 采购进度条 + 勾选清单 |
| `pages/privacy/index` | 隐私与数据说明 | 隐私与数据说明 | ❌ | 期刊式文章排版: 引言 + 01-04 编号章节 + 返回按钮 |

## src/pages.json(全文)

```json
{
  "pages": [
    { "path": "pages/index/index", "style": { "navigationBarTitleText": "选菜 · 今天吃啥" } },
    { "path": "pages/recommend/index", "style": { "navigationBarTitleText": "健康推荐" } },
    { "path": "pages/detail/index", "style": { "navigationBarTitleText": "菜谱详情", "enableShareAppMessage": true } },
    { "path": "pages/online-detail/index", "style": { "navigationBarTitleText": "在线菜谱", "enableShareAppMessage": true } },
    { "path": "pages/favorites/index", "style": { "navigationBarTitleText": "我的" } },
    { "path": "pages/meal-plan/index", "style": { "navigationBarTitleText": "本周计划" } },
    { "path": "pages/privacy/index", "style": { "navigationBarTitleText": "隐私与数据说明" } }
  ],
  "globalStyle": {
    "backgroundTextStyle": "light",
    "navigationBarBackgroundColor": "#f7f5f0",
    "navigationBarTitleText": "今天吃啥",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#f7f5f0"
  },
  "tabBar": {
    "color": "#8a948c",
    "selectedColor": "#2f6b4f",
    "backgroundColor": "#ffffff",
    "borderStyle": "black",
    "list": [
      { "pagePath": "pages/index/index", "text": "选菜", "iconPath": "static/tabbar/index.png", "selectedIconPath": "static/tabbar/index-active.png" },
      { "pagePath": "pages/recommend/index", "text": "推荐", "iconPath": "static/tabbar/recommend.png", "selectedIconPath": "static/tabbar/recommend-active.png" },
      { "pagePath": "pages/favorites/index", "text": "我的", "iconPath": "static/tabbar/me.png", "selectedIconPath": "static/tabbar/me-active.png" }
    ]
  }
}
```

## 页面导航关系

- 首页 RecipeCard/「帮我决定」→ `navigateTo` 详情页
- 首页「查更多」结果 OnlineRecipeCard → `navigateTo` 在线详情页
- 详情页适宜/需注意人群标签 → `setPendingRecommendGroup` + `switchTab` 推荐页
- 我的页 → `navigateTo` 本周计划 / 隐私说明
- 各空态按钮 → `switchTab` 回首页
- tabBar: 首页(选菜)/推荐/我的 三 tab

## 数据要点

- 20 道本地菜谱(`src/data/recipes.ts`,r001-r020 配图 3:2),分类: 家常菜/健身餐/婴儿辅食/老年餐/控糖餐/低脂餐
- 38 种食材选项,9 个分类 tab(常用/蔬菜/肉禽/蛋豆/海鲜/主食/菌菇/水果/调味)
- 6 类健康人群: 三高人群/健身人群/婴儿辅食/白领轻食/老年人/控糖人群
