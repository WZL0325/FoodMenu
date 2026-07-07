# 健康菜谱小程序 — 设计文档

日期:2026-07-07
状态:已确认,待写实现计划

## 背景与现状

项目 `e:/WZL/food` 是一个基于 Taro 4(React + TypeScript + Sass)的跨端小程序脚手架。数据层与基础组件已经搭好:

- `src/types/recipe.ts` — `Recipe`、`HealthProfile`、`IngredientOption` 等类型定义。
- `src/data/recipes.ts` — 6 道示例菜谱。
- `src/data/ingredients.ts` — 12 种食材(蔬菜 / 肉类 / 其他)。
- `src/data/healthProfiles.ts` — 6 个人群及其饮食提醒。
- `src/utils/recipeFilters.ts` — 按食材、按人群筛选的纯函数。
- `src/utils/favorites.ts` — 基于本地缓存的收藏读写。
- `src/services/cloud.ts` — 云函数封装(首版不使用)。
- `src/components/RecipeCard`、`src/components/SectionHeader` — 展示组件。

**问题**:`app.config.ts` 只注册了一个页面 `pages/index/index`,而该页面仍是脚手架模板占位页("欢迎使用 PAI 小程序")。`RecipeCard` 点击会跳转 `/pages/detail/index`,但该详情页尚不存在。也就是说:数据层和组件就绪,但没有真正的功能页面。

## 目标

把模板占位页替换为真正的功能,补齐详情页和推荐页,交付一个首版可用的"今天吃什么"健康菜谱小程序。核心两条用户路径:

1. **按食材查菜谱**:用户选择手上的蔬菜/肉类,看到能做的菜,点进去看做菜教程。
2. **按人群/病情推荐**:用户选择自己所属人群(三高、健身、婴儿辅食、白领、老年人、控糖),看到专属推荐菜和饮食提醒。

## 非目标(YAGNI,首版不做)

- 搜索框(标签多选已满足需求)。
- 食材"任一/全部"匹配切换(首版固定"任一"匹配)。
- 营养雷达图或第三方图表库。
- 多人群标签交集筛选。
- 后端 / 云函数 / 用户登录(首版纯前端 + 本地缓存)。
- 真实菜品图片(首版用固定 picsum 占位图)。

## 主结构

底部 3 个 Tab(在 `app.config.ts` 配置 `tabBar`):

| Tab | 页面路径 | 作用 |
|---|---|---|
| 选菜(首页) | `pages/index/index` | 按食材多选筛选菜谱 |
| 推荐 | `pages/recommend/index` | 按人群看专属推荐 |
| 我的 | `pages/favorites/index` | 收藏的菜谱 |

详情页(非 tab,从卡片跳入):`pages/detail/index?id=<recipeId>`。

## 各页面设计

### 1. 选菜首页 `pages/index/index`(改造)

替换现有模板占位页。布局自上而下:

1. 页头标题"今天吃点什么?"+ 副标题"选你手上的食材"。
2. 食材选择区:从 `ingredientOptions` 读取,分三组横向滚动标签——蔬菜 / 肉类 / 其他。支持**多选**,选中态高亮。
3. "看看能做什么菜"按钮:点击后调用 `filterRecipesByIngredients` 筛选。
4. 结果区:用 `RecipeCard` 渲染。无选中时显示全部菜谱。
5. 空状态:选了食材但无匹配时,提示"试试少选一种或换一种搭配"。

匹配规则:**任一匹配**(选中的食材只要命中菜谱任一相关食材即算匹配),首版不做"全部匹配"开关。`filterRecipesByIngredients` 现有实现即满足,无需改动。

复用:`SectionHeader`、`RecipeCard`、`filterRecipesByIngredients`、`ingredientOptions`。

### 2. 人群推荐页 `pages/recommend/index`(新建)

1. 人群选择区:从 `healthProfiles` 读取 6 个人群,横向标签,**单选**,默认选中第一个。
2. 饮食提醒卡片:显示选中人群的 `description` + `avoidTips` 列表。
3. 推荐菜列表:调用 `filterRecipesByHealthGroup` 筛选,`RecipeCard` 渲染。

**URL 入参支持**:`?group=<HealthGroup>` 用于从详情页"适宜人群"跳转时自动选中对应人群。页面 `onLoad` 读取参数,匹配则预选;不匹配或无参则默认选第一个。

复用:`SectionHeader`、`RecipeCard`、`filterRecipesByHealthGroup`、`healthProfiles`。

### 3. 菜谱详情页 `pages/detail/index`(新建)

从 URL 取 `id`,用 `findRecipeById` 查菜谱;查不到显示"菜谱不存在"空状态。内容:

1. 顶部大图:`recipe.image`(固定 picsum id)。
2. 标题 + 收藏按钮:右上角心形按钮,点击 `toggleFavoriteRecipe`,根据返回状态切换图标与 toast。
3. 基本信息行:烹饪时间 / 难度 / 卡路里。
4. 用料表:`recipe.ingredients` 清单。
5. 营养信息(可视化):calories / protein / carbs / fat 四项,用**纯 CSS 横向进度条**,每项相对于一个参考值(calories 参考约 800kcal/餐、protein 50g、carbs 80g、fat 30g)显示占比。不引入图表库。
6. 适宜/忌口人群提示:两条——"适合:`suitableGroups`""需注意:`avoidGroups`"(为空则不显示对应条)。点击一个人群标签跳转 `pages/recommend/index?group=<人群>`。
7. 烹饪步骤:`recipe.steps` 有序列表,每步含 `title` + `description`。
8. 小贴士:`recipe.tips`,单独高亮卡片。

复用:`findRecipeById`、`isFavoriteRecipe`、`toggleFavoriteRecipe`、`healthProfiles`(可选,展示人群标题)。

### 4. 我的收藏页 `pages/favorites/index`(新建)

1. 标题"我的收藏"。
2. 收藏列表:`getFavoriteRecipeIds()` 取 ID 列表,过滤出对应菜谱,`RecipeCard` 渲染。
3. 空状态:无收藏时显示"还没有收藏的菜谱,去首页看看吧"。
4. 实时性:页面 `onShow` 重新读缓存(用户在详情页改了收藏后返回能刷新)。

复用:`RecipeCard`、`getFavoriteRecipeIds`、`recipes`。

## 数据扩充

`src/data/recipes.ts` 从 6 道扩充到 **~20 道**,约束:

- 每个人群(`suitableGroups`)至少有 3-4 道可选菜。
- 每个常见食材(鸡胸肉、牛肉、鱼肉、虾仁、番茄、豆腐、西兰花、菠菜、香菇、南瓜、芹菜等)至少挂 2 道菜。
- 新菜按现有 `Recipe` 结构完整填写(标题、图片固定 picsum id、描述、分类、用料、meatTypes/vegetableTypes、suitableGroups/avoidGroups、healthTags、烹饪时间、难度、营养、tips、steps)。
- `src/data/ingredients.ts` 视新菜补充新食材(如玉米等)。

新菜内容由实现阶段编写,无需用户手写。

## 架构与单元边界

```
src/
├── types/recipe.ts        类型定义(无依赖)
├── data/                  纯数据源(菜谱/食材/人群)
├── utils/                 favorites(本地缓存) + recipeFilters(筛选纯函数)
├── services/cloud.ts      云函数封装(首版不调用,保留)
├── components/            RecipeCard / SectionHeader(纯展示,只吃 props)
└── pages/                 4 个页面,只编排上述各层
```

边界原则:

- **筛选是纯函数**(`recipeFilters.ts`),可独立测试、可跨页复用。
- **`RecipeCard` 不关心菜谱来源**,只负责渲染 + 跳详情。
- **页面只做编排**:读数据 → 筛选 → 渲染组件,业务逻辑下沉到 utils。
- **无后端依赖**:首版纯前端,收藏用本地缓存,`cloud.ts` 保留但本版不触发。

## 关于"健身忌碳水"的说明

需求中"健身不能吃碳水"在实际营养学上应为"控制精制碳水",而非完全禁碳水。本设计沿用现有 `healthProfiles` 中健身人群的 `avoidTips`("减少精制主食")这一更准确的表述,并依靠 `avoidGroups` 字段做禁忌过滤,不额外增加"碳水归零"的硬过滤规则。数据层无需为此改动。

## 测试策略

- **纯函数**(`recipeFilters.ts`、`favorites.ts` 的逻辑部分):可用单元测试覆盖关键路径(空输入、单选、多选、人群命中/排除)。
- **页面与组件**:首版以人工在微信开发者工具中验证为主(选食材 → 看结果 → 进详情 → 收藏 → 推荐页跳转 → 收藏页刷新)。
- 不引入 E2E 框架(YAGNI)。
