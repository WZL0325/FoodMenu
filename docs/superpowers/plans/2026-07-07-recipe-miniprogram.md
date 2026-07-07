# 健康菜谱小程序 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 Taro4 模板占位页替换为可用的健康菜谱小程序:首页按食材多选查菜、推荐页按人群推荐、详情页看做菜教程、收藏页,并扩充菜谱到 ~20 道。

**Architecture:** 纯前端(无后端)。数据层 / 类型 / 筛选纯函数 / 展示组件均已存在,本计划只编排页面、补 `tabBar`、扩数据。筛选逻辑下沉到 `utils/recipeFilters.ts`(纯函数,带单测),页面只做"读数据 → 筛选 → 渲染"。

**Tech Stack:** Taro 4.1.9、React 18、TypeScript 5、Sass(CSS Modules,`*.module.scss`)、`@/*`→`src/*` 路径别名、vitest(仅纯函数单测)。

## Global Constraints

- 路径别名:`@/*` 映射到 `src/*`(见 `tsconfig.json`)。
- 样式:每个页面/组件用 `index.module.scss`,顶部 `@use '@/styles/variables.scss' as *;`,复用现有 SCSS 变量(`$color-*`、`$spacing-*`、`$radius-*`、`$font-size-*`、mixin `text-ellipsis` 等,见 `src/styles/variables.scss` 与 `theme.scss`)。类名通过 `styles.foo` 引用。
- TS 严格项开启:`noUnusedLocals`、`noUnusedParameters`、`strictNullChecks` —— 禁止未使用的 import / 变量 / 参数。
- 现有可复用资产(不要重写):
  - 类型 `src/types/recipe.ts`:`Recipe`、`HealthProfile`、`IngredientOption`、`HealthGroup`、`RecipeCategory` 等。
  - 数据 `src/data/`:`recipes`、`ingredientOptions`、`healthProfiles`。
  - 纯函数 `src/utils/recipeFilters.ts`:`findRecipeById`、`filterRecipesByIngredients`(任一匹配)、`filterRecipesByHealthGroup`。
  - 收藏 `src/utils/favorites.ts`:`getFavoriteRecipeIds`、`isFavoriteRecipe`、`toggleFavoriteRecipe`(基于 `Taro.getStorageSync`,key=`healthy_recipe_favorites`)。
  - 组件 `RecipeCard`(props:`{ recipe: Recipe; compact?: boolean }`,点击跳 `/pages/detail/index?id=<id>`)、`SectionHeader`(props:`{ title; subtitle?; actionText?; onActionClick? }`)。
- 页面配置用全局 `definePageConfig`、app 配置用 `defineAppConfig`(已在模板中作为全局类型可用)。
- 图片:菜谱 `image` 用固定 picsum id 形式 `https://picsum.photos/id/<n>/750/500`。
- TabBar 图标首版用本地 png 占位(见 Task 2),不可用网络图(微信 tabBar 不支持网络图)。
- 提交规范:`feat:`/`fix:`/`chore:`/`test:`/`docs:` 前缀。本项目非 git 仓库 —— 见下方"关于提交"。

## 关于提交(重要)

工作目录 `e:/WZL/food` **当前不是 git 仓库**(`Is a git repository: false`)。Task 1 第一步会 `git init` 并做首次提交,之后每个 Task 末尾按计划提交。若用户明确不希望纳入 git,则跳过所有 `git` 步骤,但**仍需在每个 Task 末尾运行验证命令**。

---

## File Structure(本计划涉及的全部文件)

**新增:**
- `src/utils/recipeFilters.test.ts` — 筛选纯函数单测。
- `vitest.config.ts` — vitest 配置(仅 test,不影响 Taro 构建)。
- `src/pages/recommend/index.tsx` + `index.config.ts` + `index.module.scss` — 人群推荐页。
- `src/pages/detail/index.tsx` + `index.config.ts` + `index.module.scss` — 菜谱详情页。
- `src/pages/favorites/index.tsx` + `index.config.ts` + `index.module.scss` — 收藏页。
- `src/assets/tabbar/`(8 个 png:3 个 tab × 正常/选中)— tabBar 图标占位。

**修改:**
- `package.json` — 加 vitest 依赖与 `test` script。
- `src/app.config.ts` — 注册 4 个页面 + `tabBar`。
- `src/pages/index/index.tsx` + `index.module.scss` — 替换占位页为食材筛选页。
- `src/data/recipes.ts` — 扩充到 ~20 道。
- `src/data/ingredients.ts` — 视新菜补充食材。

---

## Task 1: 测试环境 + 筛选纯函数单测

**Files:**
- Create: `vitest.config.ts`
- Create: `src/utils/recipeFilters.test.ts`
- Modify: `package.json`(加依赖与 script)
- Test: `src/utils/recipeFilters.test.ts`

**Interfaces:**
- Consumes: `src/utils/recipeFilters.ts` 已有的 `findRecipeById`、`filterRecipesByIngredients`、`filterRecipesByHealthGroup`;`src/data/recipes.ts` 的 `recipes`。
- Produces:`npm run test` 可运行的纯函数单测;无新增导出。

- [ ] **Step 1: 初始化 git(若已是仓库则跳过)**

Run:
```bash
cd e:/WZL/food && git rev-parse --is-inside-work-tree 2>/dev/null || git init
```
Expected: 输出 `true` 或初始化一个新仓库(无报错)。

- [ ] **Step 2: 安装 vitest 为开发依赖**

Run:
```bash
cd e:/WZL/food && npm install -D vitest@^1.6.0
```
Expected: 安装成功,`package.json` 的 `devDependencies` 出现 `vitest`。

- [ ] **Step 3: 创建 vitest 配置(仅 test,不动 Taro 构建)**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    plugins: [TsconfigPathsPlugin()],
  },
});
```

- [ ] **Step 4: 在 package.json 加 test script**

Modify `package.json`,在 `scripts` 里(`"dev:quickapp"` 那一行之后)增加:
```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 5: 写筛选纯函数的失败测试**

Create `src/utils/recipeFilters.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import {
  findRecipeById,
  filterRecipesByIngredients,
  filterRecipesByHealthGroup,
} from './recipeFilters';
import { recipes } from '@/data/recipes';

describe('findRecipeById', () => {
  it('返回 id 匹配的菜谱', () => {
    expect(findRecipeById(recipes, 'r001')?.title).toBe('西兰花鸡胸肉轻食碗');
  });

  it('id 不存在时返回 undefined', () => {
    expect(findRecipeById(recipes, 'not-exist')).toBeUndefined();
  });

  it('id 为 undefined 时返回 undefined', () => {
    expect(findRecipeById(recipes, undefined)).toBeUndefined();
  });
});

describe('filterRecipesByIngredients', () => {
  it('未选食材时返回全部', () => {
    expect(filterRecipesByIngredients(recipes, [])).toHaveLength(recipes.length);
  });

  it('按任一匹配筛选:选鸡胸肉应包含含鸡胸肉的菜', () => {
    const result = filterRecipesByIngredients(recipes, ['鸡胸肉']);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((r) => [...r.ingredients, ...r.meatTypes, ...r.vegetableTypes].includes('鸡胸肉'))).toBe(true);
  });

  it('选了食材但无匹配时返回空数组', () => {
    expect(filterRecipesByIngredients(recipes, ['不存在的食材'])).toEqual([]);
  });
});

describe('filterRecipesByHealthGroup', () => {
  it('只返回 suitableGroups 命中且不在 avoidGroups 的菜', () => {
    const result = filterRecipesByHealthGroup(recipes, '健身人群');
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((r) => r.suitableGroups.includes('健身人群') && !r.avoidGroups.includes('健身人群'))).toBe(true);
  });
});
```

- [ ] **Step 6: 运行测试,确认通过(函数已存在,应直接通过)**

Run:
```bash
cd e:/WZL/food && npm run test
```
Expected: 全部测试 PASS(若失败,说明 `recipes.ts` 里 `r001` 标题被改过或筛选逻辑有 bug,需对照修正)。

- [ ] **Step 7: 提交**

Run:
```bash
cd e:/WZL/food && git add -A && git commit -m "test: 增加菜谱筛选纯函数单测与 vitest 配置"
```
Expected: 提交成功。

---

## Task 2: 配置 tabBar 与页面注册

**Files:**
- Create: `src/assets/tabbar/index.png`、`index-active.png`、`recommend.png`、`recommend-active.png`、`me.png`、`me-active.png`(6 个 81×81 png 占位)
- Create: `src/pages/recommend/index.config.ts`、`src/pages/detail/index.config.ts`、`src/pages/favorites/index.config.ts`(占位,先让路由成立)
- Modify: `src/app.config.ts`

**Interfaces:**
- Consumes: 无。
- Produces: 小程序存在 4 个已注册页面 + 3 个 tab。后续 Task 3-5 依赖这些路由可访问。

> 说明:Task 2 与 Task 3-5 互不依赖其内部代码,只需路由先注册好。占位 config 让编译通过,Task 3-5 再填实。

- [ ] **Step 1: 生成 6 个 tabBar 占位图标(纯色 png,81×81)**

由于无法手画,用 Node 生成最小有效 png。Run(在 `e:/WZL/food` 下):
```bash
cd e:/WZL/food && mkdir -p src/assets/tabbar && node -e "
const fs=require('fs');
const zlib=require('zlib');
// 生成一张 81x81 纯色 PNG。color 为 [r,g,b]
function png(color){
  const W=81,H=81;
  const raw=Buffer.alloc((W*4+1)*H);
  for(let y=0;y<H;y++){raw[y*(W*4+1)]=0;for(let x=0;x<W;x++){const o=y*(W*4+1)+1+x*4;raw[o]=color[0];raw[o+1]=color[1];raw[o+2]=color[2];raw[o+3]=255;}}
  function chunk(type,data){const t=Buffer.from(type,'ascii');const len=Buffer.alloc(4);len.writeUInt32BE(data.length,0);const crc=Buffer.alloc(4);const c=zlib.crc32(Buffer.concat([t,data]));crc.writeUInt32BE(c>>>0,0);return Buffer.concat([len,t,data,crc]);}
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=6;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
  const idat=zlib.deflateSync(raw);
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  return Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',idat),chunk('IEND',Buffer.alloc(0))]);
}
const normal=[180,180,180], active=[22,93,255];
fs.writeFileSync('src/assets/tabbar/index.png',png(normal));
fs.writeFileSync('src/assets/tabbar/index-active.png',png(active));
fs.writeFileSync('src/assets/tabbar/recommend.png',png(normal));
fs.writeFileSync('src/assets/tabbar/recommend-active.png',png(active));
fs.writeFileSync('src/assets/tabbar/me.png',png(normal));
fs.writeFileSync('src/assets/tabbar/me-active.png',png(active));
console.log('tabbar icons generated');
"
```
Expected: 输出 `tabbar icons generated`,`src/assets/tabbar/` 下出现 6 个 png。

- [ ] **Step 2: 创建三个新页面的占位 config 与最小页面(让路由可编译)**

Create `src/pages/recommend/index.config.ts`:
```ts
export default definePageConfig({
  navigationBarTitleText: '健康推荐',
});
```

Create `src/pages/recommend/index.tsx`(占位,Task 4 替换):
```tsx
import React from 'react';
import { View, Text } from '@tarojs/components';

const Recommend: React.FC = () => (
  <View><Text>推荐页(待实现)</Text></View>
);

export default Recommend;
```

Create `src/pages/recommend/index.module.scss`:
```scss
@use '@/styles/variables.scss' as *;
```

对 `src/pages/detail/` 与 `src/pages/favorites/` 重复同样三个文件,内容相同(`detail` 的 config title 改为 `'菜谱详情'`,`favorites` 改为 `'我的收藏'`;tsx 里文案相应改"详情页(待实现)""收藏页(待实现)")。

即共创建 9 个文件:`{recommend,detail,favorites}/index.{tsx,config.ts,module.scss}`。

- [ ] **Step 3: 修改 app.config.ts 注册页面与 tabBar**

Replace `src/app.config.ts` 全文为:
```ts
export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/recommend/index',
    'pages/detail/index',
    'pages/favorites/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '今天吃啥',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#86909c',
    selectedColor: '#165dff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '选菜',
        iconPath: 'assets/tabbar/index.png',
        selectedIconPath: 'assets/tabbar/index-active.png',
      },
      {
        pagePath: 'pages/recommend/index',
        text: '推荐',
        iconPath: 'assets/tabbar/recommend.png',
        selectedIconPath: 'assets/tabbar/recommend-active.png',
      },
      {
        pagePath: 'pages/favorites/index',
        text: '我的',
        iconPath: 'assets/tabbar/me.png',
        selectedIconPath: 'assets/tabbar/me-active.png',
      },
    ],
  },
});
```

> 注:`iconPath` 相对项目根(编译时 Taro 会拷贝 `src/assets` 到产物),路径以 `src/` 之后起算写 `assets/tabbar/...`。

- [ ] **Step 4: 验证编译**

Run:
```bash
cd e:/WZL/food && npm run build:weapp 2>&1 | tail -20
```
Expected: 构建成功,无 "page not found" / tabBar 配置错误。若报 tabBar 图标路径错,核对 `src/assets/tabbar/` 下文件名与 `iconPath` 一致。

- [ ] **Step 5: 提交**

Run:
```bash
cd e:/WZL/food && git add -A && git commit -m "feat: 配置 4 个页面路由与底部 tabBar"
```

---

## Task 3: 选菜首页(替换占位页)

**Files:**
- Modify: `src/pages/index/index.tsx`(全文替换)
- Modify: `src/pages/index/index.module.scss`(全文替换)
- Modify: `src/pages/index/index.config.ts`(改 title)

**Interfaces:**
- Consumes: `ingredientOptions`(from `@/data/ingredients`)、`recipes`(from `@/data/recipes`)、`filterRecipesByIngredients`(from `@/utils/recipeFilters`)、`RecipeCard`、`SectionHeader`、`IngredientOption`/`Recipe`(from `@/types/recipe`)。
- Produces:首页按食材多选 → 渲染 `RecipeCard` 列表。

- [ ] **Step 1: 改首页 config title**

Replace `src/pages/index/index.config.ts` 全文:
```ts
export default definePageConfig({
  navigationBarTitleText: '选菜 · 今天吃啥',
});
```

- [ ] **Step 2: 写首页 tsx**

Replace `src/pages/index/index.tsx` 全文:
```tsx
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { ingredientOptions } from '@/data/ingredients';
import { recipes } from '@/data/recipes';
import { filterRecipesByIngredients } from '@/utils/recipeFilters';
import type { IngredientOption } from '@/types/recipe';
import RecipeCard from '@/components/RecipeCard';
import SectionHeader from '@/components/SectionHeader';
import styles from './index.module.scss';

const GROUP_ORDER: Array<IngredientOption['type']> = ['vegetable', 'meat', 'other'];
const GROUP_LABEL: Record<IngredientOption['type'], string> = {
  vegetable: '蔬菜',
  meat: '肉类',
  other: '其他',
};

const Index: React.FC = () => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const grouped = useMemo(() => {
    return GROUP_ORDER.map((type) => ({
      type,
      label: GROUP_LABEL[type],
      items: ingredientOptions.filter((i) => i.type === type),
    }));
  }, []);

  const result = useMemo(
    () => filterRecipesByIngredients(recipes, selected),
    [selected]
  );

  return (
    <View className={styles.page}>
      <View className={styles.hero}>
        <Text className={styles.heroTitle}>今天吃点什么?</Text>
        <Text className={styles.heroSub}>选你手上的食材,看看能做什么菜</Text>
      </View>

      <View className={styles.ingredientSection}>
        {grouped.map((group) => (
          <View key={group.type} className={styles.group}>
            <Text className={styles.groupLabel}>{group.label}</Text>
            <ScrollView scrollX className={styles.tagScroll}>
              {group.items.map((item) => {
                const active = selected.includes(item.name);
                return (
                  <View
                    key={item.id}
                    className={`${styles.tag} ${active ? styles.tagActive : ''}`}
                    onClick={() => toggle(item.name)}
                  >
                    <Text className={styles.tagText}>{item.name}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ))}
      </View>

      <View className={styles.resultSection}>
        <SectionHeader
          title={selected.length === 0 ? '全部菜谱' : `为你找到 ${result.length} 道菜`}
          subtitle={selected.length === 0 ? '选个食材缩小范围' : undefined}
        />
        {result.length === 0 ? (
          <View className={styles.empty}>
            <Text className={styles.emptyText}>没有匹配的菜,试试少选一种或换个搭配</Text>
          </View>
        ) : (
          <View className={styles.list}>
            {result.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default Index;
```

- [ ] **Step 3: 写首页样式**

Replace `src/pages/index/index.module.scss` 全文:
```scss
@use '@/styles/variables.scss' as *;

.page {
  min-height: 100vh;
  padding: $spacing-lg $spacing-lg 160rpx;
  background: $color-bg-page;
  box-sizing: border-box;
}

.hero {
  padding: $spacing-lg 0 $spacing-md;
}

.heroTitle {
  display: block;
  font-size: $font-size-xxl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: $line-height-tight;
}

.heroSub {
  display: block;
  margin-top: $spacing-xs;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}

.ingredientSection {
  margin-top: $spacing-md;
}

.group {
  margin-bottom: $spacing-md;
}

.groupLabel {
  display: block;
  margin-bottom: $spacing-sm;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  font-weight: $font-weight-medium;
}

.tagScroll {
  @include scroll-x-container;
  width: 100%;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 28rpx;
  margin-right: $spacing-sm;
  background: $color-bg-card;
  border: 2rpx solid $color-border;
  border-radius: $radius-round;
  transition: all $transition-fast;
}

.tagActive {
  background: rgba(22, 93, 255, 0.1);
  border-color: $color-primary;
}

.tagText {
  font-size: $font-size-sm;
  color: $color-text-primary;
  white-space: nowrap;
}

.tagActive .tagText {
  color: $color-primary;
  font-weight: $font-weight-medium;
}

.resultSection {
  margin-top: $spacing-lg;
}

.list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.empty {
  padding: $spacing-xl $spacing-lg;
  text-align: center;
}

.emptyText {
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}
```

- [ ] **Step 4: 验证编译**

Run:
```bash
cd e:/WZL/food && npm run build:weapp 2>&1 | tail -20
```
Expected: 构建成功,无 TS 报错(注意 `noUnusedLocals`:确认无未用 import)。

- [ ] **Step 5: 人工验证(微信开发者工具)**

Run `npm run dev:weapp`,用微信开发者工具打开 `dist/`:
- 首页显示"今天吃点什么?"+ 三组食材标签。
- 点"鸡胸肉"高亮,结果列表只剩含鸡胸肉的菜。
- 再点"西兰花",结果按"任一匹配"扩展(包含鸡胸肉或西兰花的菜)。
- 选一个不存在的组合(用真食材但脑补无匹配时可点掉)看空态文案。
- 点菜谱卡片能跳到详情页(详情页 Task 5 之前是占位,能跳转即可)。

- [ ] **Step 6: 提交**

Run:
```bash
cd e:/WZL/food && git add -A && git commit -m "feat: 实现选菜首页(食材多选筛选)"
```

---

## Task 4: 人群推荐页

**Files:**
- Modify: `src/pages/recommend/index.tsx`(替换占位)
- Modify: `src/pages/recommend/index.module.scss`(替换占位)

**Interfaces:**
- Consumes: `healthProfiles`(from `@/data/healthProfiles`)、`recipes`、`filterRecipesByHealthGroup`、`RecipeCard`、`SectionHeader`、`HealthGroup`/`HealthProfile`(from `@/types/recipe`)、Taro `useLoad`(从 `@tarojs/taro`)。
- Produces:推荐页支持 `?group=<HealthGroup>` 入参自动选中人群。

- [ ] **Step 1: 写推荐页 tsx**

Replace `src/pages/recommend/index.tsx` 全文:
```tsx
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { useLoad } from '@tarojs/taro';
import { healthProfiles } from '@/data/healthProfiles';
import { recipes } from '@/data/recipes';
import { filterRecipesByHealthGroup } from '@/utils/recipeFilters';
import type { HealthGroup } from '@/types/recipe';
import RecipeCard from '@/components/RecipeCard';
import SectionHeader from '@/components/SectionHeader';
import styles from './index.module.scss';

const Recommend: React.FC = () => {
  const [group, setGroup] = useState<HealthGroup>(healthProfiles[0].id);

  // 支持从详情页 ?group=xxx 跳转自动选中
  useLoad((options) => {
    const incoming = options?.group as HealthGroup | undefined;
    if (incoming && healthProfiles.some((p) => p.id === incoming)) {
      setGroup(incoming);
    }
  });

  const profile = useMemo(
    () => healthProfiles.find((p) => p.id === group) ?? healthProfiles[0],
    [group]
  );

  const result = useMemo(
    () => filterRecipesByHealthGroup(recipes, group),
    [group]
  );

  return (
    <View className={styles.page}>
      <ScrollView scrollX className={styles.groupScroll}>
        {healthProfiles.map((p) => {
          const active = p.id === group;
          return (
            <View
              key={p.id}
              className={`${styles.groupTag} ${active ? styles.groupTagActive : ''}`}
              onClick={() => setGroup(p.id)}
            >
              <Text className={styles.groupTagText}>{p.title}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View className={styles.tipCard}>
        <Text className={styles.tipTitle}>{profile.title} · 饮食提醒</Text>
        <Text className={styles.tipDesc}>{profile.description}</Text>
        <View className={styles.tipList}>
          {profile.avoidTips.map((tip) => (
            <View key={tip} className={styles.tipItem}>
              <Text className={styles.tipDot}>·</Text>
              <Text className={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.resultSection}>
        <SectionHeader title={`推荐 ${result.length} 道`} />
        {result.length === 0 ? (
          <View className={styles.empty}>
            <Text className={styles.emptyText}>暂无该人群的推荐菜,先看看其他人群吧</Text>
          </View>
        ) : (
          <View className={styles.list}>
            {result.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default Recommend;
```

- [ ] **Step 2: 写推荐页样式**

Replace `src/pages/recommend/index.module.scss` 全文:
```scss
@use '@/styles/variables.scss' as *;

.page {
  min-height: 100vh;
  padding: $spacing-lg $spacing-lg 160rpx;
  background: $color-bg-page;
  box-sizing: border-box;
}

.groupScroll {
  @include scroll-x-container;
  width: 100%;
  padding: $spacing-sm 0;
}

.groupTag {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 28rpx;
  margin-right: $spacing-sm;
  background: $color-bg-card;
  border: 2rpx solid $color-border;
  border-radius: $radius-round;
}

.groupTagActive {
  background: $color-primary;
  border-color: $color-primary;
}

.groupTagText {
  font-size: $font-size-sm;
  color: $color-text-primary;
  white-space: nowrap;
}

.groupTagActive .groupTagText {
  color: $color-text-white;
  font-weight: $font-weight-medium;
}

.tipCard {
  margin-top: $spacing-md;
  padding: $spacing-md;
  background: rgba(255, 125, 0, 0.08);
  border: 2rpx solid rgba(255, 125, 0, 0.2);
  border-radius: $radius-lg;
}

.tipTitle {
  display: block;
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  color: $color-warning;
}

.tipDesc {
  display: block;
  margin-top: $spacing-xs;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: $line-height-normal;
}

.tipList {
  margin-top: $spacing-sm;
}

.tipItem {
  display: flex;
  align-items: flex-start;
  margin-top: $spacing-xs;
}

.tipDot {
  color: $color-warning;
  margin-right: $spacing-xs;
  line-height: $line-height-normal;
}

.tipText {
  flex: 1;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: $line-height-normal;
}

.resultSection {
  margin-top: $spacing-lg;
}

.list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}

.empty {
  padding: $spacing-xl $spacing-lg;
  text-align: center;
}

.emptyText {
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}
```

- [ ] **Step 3: 验证编译**

Run:
```bash
cd e:/WZL/food && npm run build:weapp 2>&1 | tail -20
```
Expected: 构建成功。

- [ ] **Step 4: 人工验证**

`npm run dev:weapp` → 微信开发者工具:
- 推荐 tab 显示 6 个人群标签,默认选第一个。
- 顶部饮食提醒卡片随选中人群变化。
- 列表为该人群专属推荐。
- 切换"健身人群""三高人群"等,列表与提醒都变。

- [ ] **Step 5: 提交**

Run:
```bash
cd e:/WZL/food && git add -A && git commit -m "feat: 实现人群推荐页(含饮食提醒与 group 入参)"
```

---

## Task 5: 菜谱详情页

**Files:**
- Modify: `src/pages/detail/index.tsx`(替换占位)
- Modify: `src/pages/detail/index.module.scss`(替换占位)

**Interfaces:**
- Consumes:`findRecipeById`、`recipes`、`isFavoriteRecipe`、`toggleFavoriteRecipe`、`healthProfiles`(展示人群标题)、Taro `useLoad`/`useReady`/`navigateTo`/`showToast`、`HealthGroup`。
- Produces:详情页;人群标签点击跳 `/pages/recommend/index?group=<group>`。

- [ ] **Step 1: 写详情页 tsx**

Replace `src/pages/detail/index.tsx` 全文:
```tsx
import React, { useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro, { useLoad } from '@tarojs/taro';
import { recipes } from '@/data/recipes';
import { healthProfiles } from '@/data/healthProfiles';
import { findRecipeById } from '@/utils/recipeFilters';
import { isFavoriteRecipe, toggleFavoriteRecipe } from '@/utils/favorites';
import type { HealthGroup } from '@/types/recipe';
import SectionHeader from '@/components/SectionHeader';
import styles from './index.module.scss';

// 营养参考值(每餐),用于进度条占比
const NUTRITION_REF = { calories: 800, protein: 50, carbs: 80, fat: 30 } as const;

const Detail: React.FC = () => {
  const [recipeId, setRecipeId] = useState<string>();
  const [favorite, setFavorite] = useState(false);

  useLoad((options) => {
    const id = options?.id;
    setRecipeId(id);
    if (id) {
      setFavorite(isFavoriteRecipe(id));
    }
  });

  const recipe = recipeId ? findRecipeById(recipes, recipeId) : undefined;

  if (!recipe) {
    return (
      <View className={styles.page}>
        <View className={styles.empty}>
          <Text className={styles.emptyText}>菜谱不存在或已下架</Text>
        </View>
      </View>
    );
  }

  const handleFavorite = () => {
    const next = toggleFavoriteRecipe(recipe.id);
    setFavorite(next);
    Taro.showToast({ title: next ? '已收藏' : '已取消收藏', icon: 'none' });
  };

  const goGroup = (g: HealthGroup) => {
    Taro.navigateTo({ url: `/pages/recommend/index?group=${g}` });
  };

  const groupTitle = (g: HealthGroup) =>
    healthProfiles.find((p) => p.id === g)?.title ?? g;

  const nutritionItems = [
    { label: '热量', value: recipe.nutrition.calories, unit: 'kcal', ref: NUTRITION_REF.calories },
    { label: '蛋白质', value: recipe.nutrition.protein, unit: 'g', ref: NUTRITION_REF.protein },
    { label: '碳水', value: recipe.nutrition.carbs, unit: 'g', ref: NUTRITION_REF.carbs },
    { label: '脂肪', value: recipe.nutrition.fat, unit: 'g', ref: NUTRITION_REF.fat },
  ];

  return (
    <View className={styles.page}>
      <Image className={styles.cover} src={recipe.image} mode="aspectFill" />

      <View className={styles.body}>
        <View className={styles.titleRow}>
          <Text className={styles.title}>{recipe.title}</Text>
          <View className={styles.favBtn} onClick={handleFavorite}>
            <Text className={styles.favIcon}>{favorite ? '♥' : '♡'}</Text>
          </View>
        </View>

        <View className={styles.metaRow}>
          <Text className={styles.metaItem}>{recipe.cookingTime} 分钟</Text>
          <Text className={styles.metaDot}>·</Text>
          <Text className={styles.metaItem}>{recipe.difficulty}</Text>
          <Text className={styles.metaDot}>·</Text>
          <Text className={styles.metaItem}>{recipe.nutrition.calories} kcal</Text>
        </View>

        <Text className={styles.desc}>{recipe.description}</Text>

        <View className={styles.section}>
          <SectionHeader title="用料" />
          <View className={styles.tagWrap}>
            {recipe.ingredients.map((i) => (
              <Text key={i} className={styles.ingredientTag}>{i}</Text>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <SectionHeader title="营养成分" />
          <View className={styles.nutrition}>
            {nutritionItems.map((n) => {
              const pct = Math.min(100, Math.round((n.value / n.ref) * 100));
              return (
                <View key={n.label} className={styles.nutritionRow}>
                  <Text className={styles.nutritionLabel}>{n.label}</Text>
                  <View className={styles.bar}>
                    <View className={styles.barFill} style={{ width: `${pct}%` }} />
                  </View>
                  <Text className={styles.nutritionValue}>{n.value}{n.unit}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {recipe.suitableGroups.length > 0 && (
          <View className={styles.section}>
            <SectionHeader title="适宜人群" />
            <View className={styles.tagWrap}>
              {recipe.suitableGroups.map((g) => (
                <Text key={g} className={styles.suitTag} onClick={() => goGroup(g)}>
                  {groupTitle(g)}
                </Text>
              ))}
            </View>
          </View>
        )}

        {recipe.avoidGroups.length > 0 && (
          <View className={styles.section}>
            <SectionHeader title="需注意人群" />
            <View className={styles.tagWrap}>
              {recipe.avoidGroups.map((g) => (
                <Text key={g} className={styles.avoidTag} onClick={() => goGroup(g)}>
                  {groupTitle(g)}
                </Text>
              ))}
            </View>
          </View>
        )}

        <View className={styles.section}>
          <SectionHeader title="烹饪步骤" />
          <View className={styles.steps}>
            {recipe.steps.map((step, idx) => (
              <View key={step.title} className={styles.step}>
                <View className={styles.stepIndex}>
                  <Text className={styles.stepIndexText}>{idx + 1}</Text>
                </View>
                <View className={styles.stepContent}>
                  <Text className={styles.stepTitle}>{step.title}</Text>
                  <Text className={styles.stepDesc}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.tipCard}>
          <Text className={styles.tipLabel}>小贴士</Text>
          <Text className={styles.tipText}>{recipe.tips}</Text>
        </View>
      </View>
    </View>
  );
};

export default Detail;
```

- [ ] **Step 2: 写详情页样式**

Replace `src/pages/detail/index.module.scss` 全文:
```scss
@use '@/styles/variables.scss' as *;

.page {
  min-height: 100vh;
  background: $color-bg-page;
  padding-bottom: $spacing-xl;
}

.cover {
  width: 100%;
  height: 420rpx;
  display: block;
  background: $color-bg-hover;
}

.body {
  margin-top: -40rpx;
  padding: $spacing-lg $spacing-lg 0;
  background: $color-bg-page;
  border-radius: $radius-xl $radius-xl 0 0;
  position: relative;
}

.titleRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $spacing-sm;
}

.title {
  flex: 1;
  font-size: $font-size-xl;
  font-weight: $font-weight-bold;
  color: $color-text-primary;
  line-height: $line-height-tight;
}

.favBtn {
  width: 64rpx;
  height: 64rpx;
  @include flex-center;
}

.favIcon {
  font-size: 44rpx;
  color: $color-error;
}

.metaRow {
  display: flex;
  align-items: center;
  gap: $spacing-xs;
  margin-top: $spacing-sm;
}

.metaItem {
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

.metaDot {
  color: $color-text-tertiary;
}

.desc {
  display: block;
  margin-top: $spacing-md;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: $line-height-loose;
}

.section {
  margin-top: $spacing-lg;
}

.tagWrap {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  margin-top: $spacing-sm;
}

.ingredientTag {
  padding: 8rpx 20rpx;
  background: $color-bg-hover;
  border-radius: $radius-sm;
  font-size: $font-size-sm;
  color: $color-text-primary;
}

.nutrition {
  margin-top: $spacing-sm;
}

.nutritionRow {
  display: flex;
  align-items: center;
  margin-bottom: $spacing-sm;
}

.nutritionLabel {
  width: 120rpx;
  font-size: $font-size-sm;
  color: $color-text-secondary;
}

.bar {
  flex: 1;
  height: 16rpx;
  margin: 0 $spacing-sm;
  background: $color-divider;
  border-radius: $radius-round;
  overflow: hidden;
}

.barFill {
  height: 100%;
  background: linear-gradient(90deg, $color-primary, $color-primary-light);
  border-radius: $radius-round;
}

.nutritionValue {
  width: 120rpx;
  text-align: right;
  font-size: $font-size-sm;
  color: $color-text-primary;
  font-weight: $font-weight-medium;
}

.suitTag {
  padding: 8rpx 20rpx;
  background: rgba(0, 180, 42, 0.1);
  color: $color-success;
  border-radius: $radius-round;
  font-size: $font-size-sm;
}

.avoidTag {
  padding: 8rpx 20rpx;
  background: rgba(245, 63, 63, 0.1);
  color: $color-error;
  border-radius: $radius-round;
  font-size: $font-size-sm;
}

.steps {
  margin-top: $spacing-sm;
}

.step {
  display: flex;
  align-items: flex-start;
  margin-bottom: $spacing-md;
}

.stepIndex {
  width: 48rpx;
  height: 48rpx;
  margin-right: $spacing-sm;
  border-radius: $radius-round;
  background: $color-primary;
  @include flex-center;
  flex-shrink: 0;
}

.stepIndexText {
  color: $color-text-white;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
}

.stepContent {
  flex: 1;
}

.stepTitle {
  display: block;
  font-size: $font-size-md;
  font-weight: $font-weight-semibold;
  color: $color-text-primary;
}

.stepDesc {
  display: block;
  margin-top: $spacing-xs;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: $line-height-loose;
}

.tipCard {
  margin-top: $spacing-lg;
  padding: $spacing-md;
  background: rgba(255, 197, 61, 0.12);
  border-radius: $radius-lg;
}

.tipLabel {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-warning;
  margin-bottom: $spacing-xs;
}

.tipText {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  line-height: $line-height-loose;
}

.empty {
  padding: $spacing-xl $spacing-lg;
  text-align: center;
}

.emptyText {
  font-size: $font-size-sm;
  color: $color-text-tertiary;
}
```

- [ ] **Step 3: 验证编译**

Run:
```bash
cd e:/WZL/food && npm run build:weapp 2>&1 | tail -20
```
Expected: 构建成功。

- [ ] **Step 4: 人工验证(端到端核心链路)**

`npm run dev:weapp` → 微信开发者工具:
- 从首页点菜谱卡片进详情页:大图、标题、收藏按钮、用料、营养进度条、人群、步骤、小贴士齐全。
- 点收藏按钮:心形 ♡↔♥ 切换,toast 提示。
- 点"适宜人群"里某个标签:跳到推荐页且对应人群被选中(`?group=` 生效)。
- 退回再进,收藏状态保留(本地缓存)。
- 手动改 URL `id=not-exist` 进详情页:显示"菜谱不存在"。

- [ ] **Step 5: 提交**

Run:
```bash
cd e:/WZL/food && git add -A && git commit -m "feat: 实现菜谱详情页(教程/营养/人群/收藏)"
```

---

## Task 6: 我的收藏页

**Files:**
- Modify: `src/pages/favorites/index.tsx`(替换占位)
- Modify: `src/pages/favorites/index.module.scss`(替换占位)

**Interfaces:**
- Consumes:`getFavoriteRecipeIds`、`recipes`、`RecipeCard`、`SectionHeader`、Taro `useDidShow`、`switchTab`。
- Produces:收藏页,`onShow` 刷新。

- [ ] **Step 1: 写收藏页 tsx**

Replace `src/pages/favorites/index.tsx` 全文:
```tsx
import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';
import { recipes } from '@/data/recipes';
import { getFavoriteRecipeIds } from '@/utils/favorites';
import RecipeCard from '@/components/RecipeCard';
import SectionHeader from '@/components/SectionHeader';
import styles from './index.module.scss';

const Favorites: React.FC = () => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // 每次进入页面刷新收藏(用户可能在详情页改了收藏)
  useDidShow(() => {
    setFavoriteIds(getFavoriteRecipeIds());
  });

  const list = recipes.filter((r) => favoriteIds.includes(r.id));

  const goHome = () => {
    Taro.switchTab({ url: '/pages/index/index' });
  };

  return (
    <View className={styles.page}>
      <SectionHeader title="我的收藏" subtitle={list.length > 0 ? `共 ${list.length} 道` : undefined} />
      {list.length === 0 ? (
        <View className={styles.empty}>
          <Text className={styles.emptyText}>还没有收藏的菜谱</Text>
          <View className={styles.emptyBtn} onClick={goHome}>
            <Text className={styles.emptyBtnText}>去选菜</Text>
          </View>
        </View>
      ) : (
        <View className={styles.list}>
          {list.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </View>
      )}
    </View>
  );
};

export default Favorites;
```

> 注:上面 `goHome` 用了 `Taro.switchTab`,需在文件顶部 import:`import Taro from '@tarojs/taro';`(放在第 3 行 `@tarojs/components` 之后)。实现时务必加上,否则 `noImplicitAny`/未定义报错。

- [ ] **Step 2: 修正 import(确保 Taro 已导入)**

详情页 tsx 顶部 import 区需包含(最终顺序):
```tsx
import React, { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { recipes } from '@/data/recipes';
...
```
(`useDidShow` 已从 `@tarojs/taro` 具名导入,`Taro` 默认导入用于 `switchTab`。)

- [ ] **Step 3: 写收藏页样式**

Replace `src/pages/favorites/index.module.scss` 全文:
```scss
@use '@/styles/variables.scss' as *;

.page {
  min-height: 100vh;
  padding: $spacing-lg $spacing-lg 160rpx;
  background: $color-bg-page;
  box-sizing: border-box;
}

.list {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
  margin-top: $spacing-md;
}

.empty {
  margin-top: $spacing-xl;
  padding: $spacing-xl $spacing-lg;
  text-align: center;
}

.emptyText {
  display: block;
  font-size: $font-size-sm;
  color: $color-text-tertiary;
  margin-bottom: $spacing-lg;
}

.emptyBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: $button-height-md;
  padding: 0 $spacing-xl;
  background: $color-primary;
  border-radius: $radius-button;
}

.emptyBtnText {
  color: $color-text-white;
  font-size: $font-size-md;
}
```

- [ ] **Step 4: 验证编译**

Run:
```bash
cd e:/WZL/food && npm run build:weapp 2>&1 | tail -20
```
Expected: 构建成功。

- [ ] **Step 5: 人工验证**

- 先在详情页收藏 2 道菜 → 切到"我的"tab:列表显示这 2 道,副标题"共 2 道"。
- 进某道详情取消收藏 → 返回"我的"tab:列表自动刷新(少一道)。
- 清空所有收藏 → 显示空态 + "去选菜"按钮,点击跳到选菜 tab。

- [ ] **Step 6: 提交**

Run:
```bash
cd e:/WZL/food && git add -A && git commit -m "feat: 实现我的收藏页(onShow 刷新 + 空态)"
```

---

## Task 7: 扩充菜谱数据到 ~20 道

**Files:**
- Modify: `src/data/recipes.ts`
- Modify: `src/data/ingredients.ts`(视需补食材)

**Interfaces:**
- Consumes:`Recipe` 类型。
- Produces:菜谱 ~20 道;Task 1 的单测仍通过(`r001` 标题与人群标签不变)。

> 约束:每个人群至少 3-4 道可选;每个常见食材至少挂 2 道菜。现有 6 道(`r001`-`r006`)**保持不变**(单测与详情页人工验证依赖其数据),只新增 `r007`-`r020`。

- [ ] **Step 1: 补充食材(若新菜用到)**

在 `src/data/ingredients.ts` 的 `ingredientOptions` 数组里按需追加(示例,实际按所写新菜补):
```ts
  { id: 'corn', name: '玉米', type: 'vegetable' },
  { id: 'potato', name: '土豆', type: 'vegetable' },
  { id: 'cabbage', name: '白菜', type: 'vegetable' },
```
仅追加新菜真正用到的食材,避免 `noUnusedLocals` 无关(数据文件不受影响,但保持精简)。

- [ ] **Step 2: 追加新菜谱(r007-r020)**

在 `src/data/recipes.ts` 的 `recipes` 数组末尾(`r006` 之后)追加。每道菜严格遵循 `Recipe` 结构。以下给出 **2 道完整示例** 作为格式模板,其余 12 道按相同结构编写,确保覆盖各人群与食材:

```ts
  {
    id: 'r007',
    title: '清蒸鲈鱼',
    image: 'https://picsum.photos/id/432/750/500',
    description: '原汁原味、高蛋白低脂,适合三高、老年人与控糖人群。',
    category: '家常菜',
    ingredients: ['鲈鱼', '姜', '葱'],
    meatTypes: ['鱼肉'],
    vegetableTypes: [],
    suitableGroups: ['三高人群', '老年人', '控糖人群', '白领轻食'],
    avoidGroups: ['婴儿辅食'],
    healthTags: ['高蛋白', '低脂', '低糖'],
    cookingTime: 20,
    difficulty: '中等',
    nutrition: { calories: 220, protein: 30, carbs: 2, fat: 9 },
    tips: '三高人群少放蒸鱼豉油,用葱姜提味即可。',
    steps: [
      { title: '处理鱼', description: '鲈鱼去鳞去内脏洗净,两面划几刀。' },
      { title: '铺底料', description: '盘底铺姜片,放上鲈鱼。' },
      { title: '大火蒸', description: '水开后大火蒸 8-10 分钟至熟。' },
      { title: '淋热油', description: '撒葱丝,淋一勺热油激发香气。' },
    ],
  },
  {
    id: 'r008',
    title: '土豆胡萝卜牛肉粒',
    image: 'https://picsum.photos/id/439/750/500',
    description: '补铁补蛋白,搭配根茎蔬菜,适合健身与白领。',
    category: '家常菜',
    ingredients: ['牛肉', '土豆', '胡萝卜'],
    meatTypes: ['牛肉'],
    vegetableTypes: ['胡萝卜'],
    suitableGroups: ['健身人群', '白领轻食'],
    avoidGroups: ['婴儿辅食', '控糖人群'],
    healthTags: ['高蛋白', '补铁'],
    cookingTime: 25,
    difficulty: '中等',
    nutrition: { calories: 340, protein: 28, carbs: 22, fat: 14 },
    tips: '控糖人群注意土豆属淀粉,需减少其他主食。',
    steps: [
      { title: '切丁腌制', description: '牛肉、土豆、胡萝卜切丁,牛肉用生抽淀粉抓匀。' },
      { title: '滑炒牛肉', description: '热锅少油滑炒牛肉粒至变色盛出。' },
      { title: '煸炒蔬菜', description: '余油炒土豆胡萝卜丁至边缘微焦。' },
      { title: '合炒收汁', description: '回锅牛肉,少量水焖 3 分钟,调味出锅。' },
    ],
  },
```

> 其余 12 道(`r009`-`r020`)由实现者编写,覆盖清单:
> - 三高人群:再补 1-2 道(如凉拌木耳、冬瓜虾仁汤)。
> - 健身人群:再补 1-2 道(如鸡胸肉沙拉、蛋白炒虾仁)。
> - 婴儿辅食:再补 2 道(如胡萝卜米糊、苹果红薯泥)。
> - 白领轻食:再补 1-2 道(如藜麦时蔬碗、鸡蛋三明治)。
> - 老年人:再补 1-2 道(如蒸蛋羹已有,补山药排骨汤、清炒时蔬)。
> - 控糖人群:再补 1-2 道(如杂菜豆腐锅、清炒西兰花)。
> 每道 `suitableGroups` 与 `avoidGroups` 据营养常识填写;婴儿辅食统一 `avoidGroups: ['三高人群']` 或空;含大量淀粉/糖的菜 `avoidGroups` 含 `'控糖人群'`。

- [ ] **Step 3: 运行单测确认未破坏既有逻辑**

Run:
```bash
cd e:/WZL/food && npm run test
```
Expected: 全部 PASS(`r001` 标题与"健身人群"筛选断言仍成立)。

- [ ] **Step 4: 验证编译**

Run:
```bash
cd e:/WZL/food && npm run build:weapp 2>&1 | tail -20
```
Expected: 构建成功。

- [ ] **Step 5: 人工验证(全量走查)**

`npm run dev:weapp` → 微信开发者工具:
- 选菜页:选"牛肉"应至少出现 3 道(`r004` 芹菜牛肉丝 + 新增含牛肉的)。
- 推荐页:每个人群切换,列表都 ≥ 3 道。
- 详情页:抽查新增菜,数据齐全、营养条有值。
- 收藏页:收藏新增菜后能看到。

- [ ] **Step 6: 提交**

Run:
```bash
cd e:/WZL/food && git add -A && git commit -m "feat: 扩充菜谱至 20 道,覆盖各人群与食材"
```

---

## 完成标准(Definition of Done)

- [ ] `npm run test` 全绿。
- [ ] `npm run build:weapp` 构建成功,无 TS 报错。
- [ ] 微信开发者工具中 4 个页面 + 3 个 tab 全部可用,核心链路通(选食材→看菜→看教程→收藏→按人群推荐→详情跳推荐)。
- [ ] 菜谱 ≥ 18 道,每个 6 人群至少 3 道可选。
- [ ] 每个 Task 都有独立提交。
