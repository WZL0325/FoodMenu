# 菜谱内容扩充与年轻化界面实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将本地菜谱从 20 道扩充至 30 道，统一使用年轻食物插画，并把首页改造成“活力橙绿”主题下更轻快的内容发现页，同时保持健康边界、收藏、计划和离线能力。

**Architecture:** 以现有 `Recipe`/`IngredientOption` 数据结构和纯函数筛选链为基础，不引入后端或新的状态管理。菜谱数据、食材别名、插画资源和内容集合计算分别保持在 data、static、utils 和页面层；页面只组合纯函数结果。统一视觉通过 `variables.scss` token 和 `RecipeCard`/`SectionHeader` 复用实现。

**Tech Stack:** uni-app 3 alpha、Vue 3、TypeScript、Vite、Sass、Vitest、Sharp（生成本地 PNG 插画）、微信小程序 `mp-weixin`。

## Global Constraints

- 本地菜谱总数必须为 30 道，ID 连续覆盖 `r001`–`r030`。
- 新增菜谱固定为：`r021` 虾仁西兰花藜麦碗、`r022` 香菇鸡丝拌面、`r023` 豆腐蒸肉饼、`r024` 鳕鱼土豆泥、`r025` 西葫芦鸡蛋软饼、`r026` 山药胡萝卜鸡肉粥、`r027` 番茄牛腩焖饭、`r028` 清蒸南瓜鸡腿肉、`r029` 豆腐虾皮小白菜汤、`r030` 紫薯燕麦酸奶杯。
- `r023` 的主分类为 `老年餐`；新增后老年餐、婴儿辅食、家常菜主分类均至少 5 道。
- 所有菜谱图片必须位于 `src/static/recipes/r001.jpg`–`r030.jpg`，尺寸 800×533、3:2，不能重复，不能使用占位或与菜名无关的图片。
- 婴儿辅食必须填写 `allergens`、`ageRange`、`servingNote`，文案不能包含治疗、保证或医学功效承诺。
- 明确忌口是硬过滤；健康目标只用于推荐页筛选/排序和详情风险提醒，不把所有非适宜菜谱从首页硬删除。
- 食材别名必须通过同一套 canonical 规则用于本地匹配、忌口过滤和在线结果过滤；禁止在页面内新增 `includes` 子串判断。
- 继续使用本地存储，不引入登录、云同步、拍照识别、真实库存扣减或在线菜谱跨设备分享。
- 不使用 Emoji 或 Unicode 伪图标；图标继续使用现有 AppIcon/Lucide 体系。
- 三个 Tab 页和详情/计划/隐私页必须为原生 TabBar、安全区和底部内容留出空间。
- 保留用户当前工作区已有修改，提交时只选择本计划产生的文件；不得回滚或覆盖 `project.config.json` 现有本地修改。

---

### Task 1: 扩展类型、数据校验与失败测试

**Files:**
- Modify: `src/types/recipe.ts`
- Modify: `src/utils/recipeDataValidation.ts`
- Modify: `src/utils/recipeDataValidation.test.ts`（仅增加字段和结构断言，不提前增加 30 道数据数量断言）
- Modify: `src/utils/recipeFilters.test.ts`
- Create: `src/utils/recipeCollections.ts`
- Create: `src/utils/recipeCollections.test.ts`

**Interfaces:**
- `Recipe` 新增可选字段：`allergens?: string[]`、`ageRange?: string`、`servingNote?: string`。
- `validateRecipeData(recipes: Recipe[])` 增加 ID、图片、分类和婴儿辅食字段校验。
- 新增 `getRecipeCollection(recipes, collection, options)`，返回 `Recipe[]`，collection 取 `'quick' | 'home-style' | 'light' | 'senior' | 'baby' | 'matched'`。
- 新增 `RecipeCollectionId` 和 `RecipeCollectionOptions` 类型，集合函数只做分类/标签/用时条件，不读取页面状态。

- [ ] **Step 1: Write failing tests**

在 `recipeDataValidation.test.ts` 增加以下行为：

```ts
it('要求菜谱 ID 连续覆盖 r001 到 r030', () => {
  expect(validateRecipeData(recipes).filter((item) => item.level === 'error')).toEqual([])
  expect(new Set(recipes.map((recipe) => recipe.id)).size).toBe(30)
})

it('婴儿辅食必须有年龄、过敏原和食用说明', () => {
  const babyRecipe = recipes.find((recipe) => recipe.category === '婴儿辅食')
  expect(babyRecipe?.ageRange).toBeTruthy()
  expect(babyRecipe?.allergens).toBeDefined()
  expect(babyRecipe?.servingNote).toBeTruthy()
})

it('每道菜的图片路径唯一且对应自身 ID', () => {
  const images = recipes.map((recipe) => recipe.image)
  expect(new Set(images).size).toBe(30)
  expect(images.every((image, index) => image.includes(recipes[index].id))).toBe(true)
})
```

在 `recipeCollections.test.ts` 增加：

```ts
it('快手集合只返回 20 分钟及以内的菜', () => {
  expect(getRecipeCollection(recipes, 'quick').every((recipe) => recipe.cookingTime <= 20)).toBe(true)
})

it('家常集合返回家常菜或家庭一锅饭标签', () => {
  expect(getRecipeCollection(recipes, 'home-style').some((recipe) => recipe.id === 'r022')).toBe(true)
})

it('婴儿集合只返回婴儿辅食分类', () => {
  expect(getRecipeCollection(recipes, 'baby').every((recipe) => recipe.category === '婴儿辅食')).toBe(true)
})
```

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
npm test -- src/utils/recipeDataValidation.test.ts src/utils/recipeCollections.test.ts
```

Expected: new assertions fail because 20 道数据、字段和集合函数尚不存在。

- [ ] **Step 3: Implement minimal contracts**

实现校验错误对象时沿用现有 `level/message/recipeId` 结构；集合函数不得复制菜谱对象，不满足条件时返回空数组。不要在此任务实现页面样式。

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the same command; expected all focused tests pass after Task 2 supplies the 30 道数据. 在 Task 1 完成接口后，允许暂时只验证集合函数的空结果和校验函数的字段规则，再由 Task 2 完成全量数据测试。

- [ ] **Step 5: Commit**

```bash
git add src/types/recipe.ts src/utils/recipeDataValidation.ts src/utils/recipeDataValidation.test.ts src/utils/recipeFilters.test.ts src/utils/recipeCollections.ts src/utils/recipeCollections.test.ts
git commit -m "feat: add recipe collection and content validation contracts"
```

---

### Task 2: 扩充 30 道菜谱和食材别名

**Files:**
- Modify: `src/data/recipes.ts`
- Modify: `src/data/ingredients.ts`
- Modify: `src/data/healthProfiles.ts`（仅当新增字段需要展示辅助说明）
- Modify: `src/utils/recipeDataValidation.test.ts`
- Modify: `src/utils/recipeFilters.test.ts`

**Interfaces:**
- 输出完整 `recipes: Recipe[]`，保留 `r001`–`r020` 的现有 ID 和字段，新增 `r021`–`r030`。
- 每道新菜必须包含：标题、插画路径、描述、主分类、用料、肉/菜类型、适宜/注意人群、健康标签、用时、难度、单份营养、tips、3–6 个步骤。
- 新增食材至少包括：西兰花（已有则复用）、藜麦、香菇（已有则复用）、面条或全麦面、牛腩、燕麦片、无糖酸奶、西葫芦、鸡腿肉、虾皮；每个新增显示名提供常见别名。

- [ ] **Step 1: Write failing data assertions**

在测试中固定以下结果：

```ts
expect(recipes).toHaveLength(30)
expect(recipes.map((recipe) => recipe.id)).toEqual(
  Array.from({ length: 30 }, (_, index) => `r${String(index + 1).padStart(3, '0')}`),
)
expect(recipes.filter((recipe) => recipe.category === '老年餐').length).toBeGreaterThanOrEqual(5)
expect(recipes.filter((recipe) => recipe.category === '婴儿辅食').length).toBeGreaterThanOrEqual(5)
expect(recipes.filter((recipe) => recipe.category === '家常菜').length).toBeGreaterThanOrEqual(5)
expect(recipes.find((recipe) => recipe.id === 'r023')?.category).toBe('老年餐')
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
npm test -- src/utils/recipeDataValidation.test.ts src/utils/recipeFilters.test.ts
```

Expected: 20 道菜和分类数量断言失败。

- [ ] **Step 3: Add the ten recipes and aliases**

按 Global Constraints 中的固定清单加入 10 道菜，婴儿辅食数据必须具体填写：

- `r024 鳕鱼土豆泥`：`ageRange: '7–9 个月'`，过敏原包含鱼类，说明去刺、充分蒸熟、首次尝试少量观察；
- `r025 西葫芦鸡蛋软饼`：`ageRange: '10 个月以上'`，过敏原包含鸡蛋，说明不加盐糖且彻底熟透；
- `r026 山药胡萝卜鸡肉粥`：`ageRange: '8 个月以上'`，过敏原包含鸡肉，说明食材煮软并根据吞咽能力压碎。

不得把“补铁、温补、利水、降糖”等作为确定性功效写入新增 `description`/`tips`；使用“低油、软嫩、少盐、富含蛋白质”等可由数据或做法支持的描述。

- [ ] **Step 4: Run data and filter tests**

Run:

```bash
npm test -- src/utils/recipeDataValidation.test.ts src/utils/recipeFilters.test.ts src/utils/recipeCollections.test.ts
```

Expected: all recipe count, category, alias, collection and safety-field assertions pass.

- [ ] **Step 5: Commit**

```bash
git add src/data/recipes.ts src/data/ingredients.ts src/data/healthProfiles.ts src/utils/recipeDataValidation.test.ts src/utils/recipeFilters.test.ts
git commit -m "feat: expand local recipe catalog to thirty dishes"
```

---

### Task 3: 生成并接入 30 张年轻食物插画

**Files:**
- Create: `scripts/generate-recipe-illustrations.mjs`
- Create: `scripts/verify-recipe-images.mjs`
- Create/replace: `src/static/recipes/r001.jpg`–`r030.jpg`
- Create/replace: `scripts/raw-recipes/r001.jpg`–`r030.jpg`（若原始目录仍被项目流程使用）
- Modify: `README.md`（更新素材说明，删除 loremflickr 占位描述）

**Interfaces:**
- 脚本命令：`node scripts/generate-recipe-illustrations.mjs`。
- 脚本读取 `src/data/recipes.ts` 不可直接执行 TypeScript；使用固定的菜谱 ID/色板配置或从可解析的 JSON 映射导入。
- 输出每个 ID 一个 800×533 progressive JPEG，脚本重复运行结果稳定。

- [ ] **Step 1: Add an asset-level verification script/test first**

在脚本中加入可独立调用的 `validateRecipeImageSet(imageDir, recipeIds)`，并在 `scripts/verify-recipe-images.mjs` 或 `src/utils/recipeDataValidation.test.ts` 中检查：

```ts
expect(recipeIds).toHaveLength(30)
expect(new Set(recipeIds.map((id) => `${id}.jpg`)).size).toBe(30)
```

- [ ] **Step 2: Run the asset check and verify RED**

Run:

```bash
node scripts/verify-recipe-images.mjs
```

Expected: current资源集因只有 20 张或存在重复而失败。

- [ ] **Step 3: Generate deterministic vector-style food illustrations**

使用 Sharp 将 800×533 的 SVG 画布栅格化为 JPG。每个 ID 使用不同的盘型、主色、食材圆块/叶片/谷物形状和背景组合，确保图片内容与菜名的主要食材对应；不得复制同一张文件。视觉规则：橙/草木绿/莓果红为点缀，浅奶油或浅蓝绿为背景，主体位于中心 70% 安全区域，不绘制文字、水印或品牌标识。

脚本必须在生成后读取文件尺寸和 SHA-256，若发现重复哈希则以非零退出。

- [ ] **Step 4: Run asset verification**

Run:

```bash
node scripts/generate-recipe-illustrations.mjs
node scripts/verify-recipe-images.mjs
```

Expected: 30 个文件、全部 800×533、哈希唯一，验证通过。

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-recipe-illustrations.mjs scripts/verify-recipe-images.mjs src/static/recipes scripts/raw-recipes README.md
git commit -m "feat: add unique illustrated recipe artwork"
```

---

### Task 4: 年轻化视觉 token 与菜谱卡片变体

**Files:**
- Modify: `src/styles/variables.scss`
- Modify: `src/components/RecipeCard/RecipeCard.vue`
- Modify: `src/components/SectionHeader/SectionHeader.vue`
- Modify: `src/pages/recommend/index.vue`
- Modify: `src/pages/favorites/index.vue`
- Test: `src/utils/recipeCollections.test.ts`（集合显示所需数据）

**Interfaces:**
- 新增或更新 Sass token：`$color-primary`、`$color-primary-dark`、`$color-success`、`$color-success-light`、`$color-accent-berry`、`$color-accent-berry-light`、`$color-bg-page`。
- `RecipeCard` 支持 `compact?: boolean`、`recommendationReason?: string`，首页 compact 隐藏长描述和反馈按钮但保留标题、用时、热量、匹配度、已有/还需。
- `SectionHeader` 的 `index` 必须实际渲染，且不破坏无 index 的调用。

- [ ] **Step 1: Add visual contract checks**

使用现有 Lint/构建作为组件模板检查，并在代码审查中确认：

- 首页 compact 卡不会使用横向卡片的固定宽度；
- `RecipeCard` 的反馈按钮仍 `@tap.stop`；
- `SectionHeader index="01"` 能在模板中看到；
- 主 CTA 白字背景使用深橙或有足够对比度的渐变。

- [ ] **Step 2: Run current checks and record baseline**

Run:

```bash
npm run typecheck
npm run lint
```

- [ ] **Step 3: Implement tokens and variants**

保持暖色页面底，但使用更清亮的 `#F45B3C`/`#C83D2C`，草木绿只用于健康/已拥有状态，莓果色只用于收藏/灵感；将首页长卡片变为紧凑纵向卡，推荐页保留推荐依据，收藏页保留完整信息。

- [ ] **Step 4: Run component checks**

Run:

```bash
npm run typecheck
npm run lint
npm run build:h5
```

Expected: all pass and no新增模板编译错误。

- [ ] **Step 5: Commit**

```bash
git add src/styles/variables.scss src/components/RecipeCard/RecipeCard.vue src/components/SectionHeader/SectionHeader.vue src/pages/recommend/index.vue src/pages/favorites/index.vue
git commit -m "feat: refresh recipe card visual language"
```

---

### Task 5: 首页内容集合与活力橙绿布局

**Files:**
- Modify: `src/pages/index/index.vue`
- Modify: `src/utils/recipeCollections.ts`
- Modify: `src/utils/recipeCollections.test.ts`

**Interfaces:**
- 首页使用 `getRecipeCollection` 生成以下集合：`matched`、`quick`、`home-style`、`light`、`senior`、`baby`。
- 首页继续使用 `filterRecipesByDietaryProfile` 做明确忌口过滤，健康目标不做首页硬过滤。
- 保留现有搜索、食材选择、在线扩展、计划 handoff、反馈刷新和空态行为。

- [ ] **Step 1: Write failing collection integration tests**

在集合测试中固定：

```ts
expect(getRecipeCollection(recipes, 'senior').every((recipe) => recipe.category === '老年餐')).toBe(true)
expect(getRecipeCollection(recipes, 'baby').every((recipe) => recipe.category === '婴儿辅食')).toBe(true)
expect(getRecipeCollection(recipes, 'light').every((recipe) => recipe.healthTags.some((tag) => ['低脂', '低糖', '高纤维'].includes(tag)))).toBe(true)
```

- [ ] **Step 2: Run RED**

Run `npm test -- src/utils/recipeCollections.test.ts`; expected missing/未接入集合断言失败。

- [ ] **Step 3: Implement homepage content flow**

首页结构调整为：Hero 今日灵感 → “今晚吃什么/本周餐桌” → 搜索 → 今日高匹配 → 横向快手/家常/轻食集合 → 冰箱食材选择 → 完整结果列表 → 在线扩展。集合卡使用 `RecipeCard compact`，横向集合使用 `scroll-view scroll-x`，纵向主结果使用普通列表；每个集合提供“查看全部”动作，将现有筛选状态滚动到结果区或切换 quick filter，不创建重复推荐逻辑。

首页 Hero 文案显示 30 道本地菜；若存在 `pendingPlanTarget`，在首屏显示目标日期/餐次和取消按钮。

- [ ] **Step 4: Run page verification**

Run:

```bash
npm test -- src/utils/recipeCollections.test.ts src/utils/recipeFilters.test.ts
npm run typecheck
npm run lint
npm run build:h5
npm run build:mp-weixin
```

Expected: tests、类型、Lint、H5 和微信构建全部通过。

- [ ] **Step 5: Commit**

```bash
git add src/pages/index/index.vue src/pages/index/index.config.ts src/utils/recipeCollections.ts src/utils/recipeCollections.test.ts
git commit -m "feat: turn homepage into recipe discovery flow"
```

---

### Task 6: 详情页特殊人群信息与文案收口

**Files:**
- Modify: `src/pages/detail/index.vue`
- Modify: `src/pages/privacy/index.vue`
- Modify: `src/pages/online-detail/index.vue`

**Interfaces:**
- 详情页在用料/风险区域展示 `allergens`、`ageRange`、`servingNote`，缺失时不渲染空区块。
- 风险提醒继续使用 `getRecipeDietaryRisk`；加入计划前二次确认；计划 handoff 只有保存成功后消费。
- 在线详情继续标明“仅本机缓存”，不恢复跨设备分享。

- [ ] **Step 1: Add failing content assertions**

在可测试的纯数据或模板检查中固定：婴儿菜谱有安全字段；详情文案必须包含“单份估算值”“不代表每日建议摄入量”；在线详情必须包含“仅本机缓存”而不包含 `open-type="share"`。

- [ ] **Step 2: Verify RED against current template/data**

Run `npm run typecheck` and the focused validation test; expected new assertions fail before fields/blocks接入。

- [ ] **Step 3: Implement detail blocks and copy**

在风险 Callout 后增加特殊人群信息卡；营养区域使用数值优先、免责声明清晰的表达；隐私页底部继续使用浅色圆角 Callout；在线详情页保留来源说明和本机缓存标识。

- [ ] **Step 4: Run page checks**

Run:

```bash
npm run typecheck
npm run lint
npm run build:h5
npm run build:mp-weixin
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/detail/index.vue src/pages/detail/index.config.ts src/pages/privacy/index.vue src/pages/online-detail/index.vue
git commit -m "feat: surface recipe safety context in detail"
```

---

### Task 7: 全量验证、微信开发者工具刷新和交付审计

**Files:**
- Modify: `README.md`（仅同步最终实际数量、图片和页面说明）
- Modify: `docs/competition-roadmap.md`（同步 30 道菜和验收状态，如实际需要）
- No source changes unless verification exposes a defect.

- [ ] **Step 1: Run the complete verification set**

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build:h5
npm run build:mp-weixin
node scripts/verify-recipe-images.mjs
node -e "const fs=require('fs'); for (const p of ['src/pages.json','project.config.json']) JSON.parse(fs.readFileSync(p,'utf8')); console.log('JSON configs valid')"
git diff --check
```

Expected: all commands exit 0; Sass may print the known legacy JS API deprecation warning but must not fail the build.

- [ ] **Step 2: Refresh WeChat Developer Tools**

Ensure `npm run dev:mp-weixin` is running and `dist/dev/mp-weixin/app.json` exists. In the `food-menu` WeChat Developer Tools window, refresh/recompile the simulator. Check:

- 首页显示 30 道本地菜和活力橙绿主题；
- 今日高匹配、快手、家常、轻食、老年餐、婴儿辅食集合可见；
- 插画不重复、与菜名主要食材相符；
- 详情页特殊人群说明和风险提示可见；
- 空餐位 handoff、BottomSheet 滚动和 TabBar 底部安全区没有遮挡。

- [ ] **Step 3: Audit requirements against artifacts**

核对本计划每个 Global Constraint、设计文档中每个完成标准、每个新增文件和每条验证命令。将未能在当前环境验证的真机/云函数项明确记录，不以构建成功代替真机证据。

- [ ] **Step 4: Commit documentation-only updates**

```bash
git add README.md docs/competition-roadmap.md
git commit -m "docs: sync recipe catalog and youthful ui delivery notes"
```
