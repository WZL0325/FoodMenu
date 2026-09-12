# Theme — 今天吃啥 · 设计令牌(杂志编辑风 / Kinfolk 纸感)

## Part 1 — 紧凑令牌摘要

**设计语言**: 杂志编辑风(纸感)。米白纸底、白卡片 + 2rpx 细边框、衬线中文标题(Georgia/宋体栈)+ 无衬线正文、期刊编号章节(01/02/03)、陶红(terracotta)作 eyebrow/编号强调色、墨绿主色按钮、极轻纸感投影。单位 rpx(750rpx = 屏宽)。

### 颜色
| 令牌 | 值 | 用途 |
|---|---|---|
| `primary` | `#2f6b4f` | 品牌墨绿: 主按钮/选中态/强调 |
| `primary-light` | `#4f8a69` | 浅绿: 选中边框/渐变端点 |
| `primary-dark` | `#214c39` | 深绿: 按压态/深色头部 |
| `success` | `#3f7d55` | 成功/已有食材 |
| `warning` | `#b95f3d` | **陶红 terracotta**: eyebrow 眉题/章节编号/小贴士/推荐依据 |
| `error` | `#c44747` | 忌口/需注意/清除 |
| `info` | `#4f6d7a` | 蓝灰: 在线扩展(ShowAPI)/信息条 |
| `bg-page` | `#f7f5f0` | 纸感米白页底 |
| `bg-card` | `#ffffff` | 卡片白 |
| `bg-hover` | `#efece4` | 按压/图片占位 |
| `text-primary` | `#1f2b24` | 墨绿黑正文 |
| `text-secondary` | `#55625a` | 次要 |
| `text-tertiary` | `#8a948c` | 辅助/meta |
| `text-disabled` | `#b8c2bb` | 禁用 |
| `border` | `#ddd8cc` | 卡片边框(2rpx) |
| `divider` | `#e8e4d9` | 行分割线 |
| `rule` | `#c9c3b4` | 章节规则线(比 divider 深) |
| `scrim` | `rgba(20,29,24,0.5)` | 弹层遮罩 |

常用 alpha: `primary-a08/10/12`, `primary-light-a10/12`, `warning-a07/10`, `error-a07/10`, `info-a07/16`。

### 字体
- 衬线(标题): `Georgia, 'Times New Roman', 'Songti SC', 'STSong', 'SimSun', serif` — hero 56rpx、页引言 44rpx、详情标题 48rpx、章节头 36rpx、营养数值/日期/编号
- 无衬线(正文): `-apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif`
- 字号: xs 22 / sm 24 / md 28 / lg 32 / xl 36 / xxl 40 / hero 56 (rpx); 行高 1.3/1.5/1.8; 字重 400/500/600/700
- eyebrow 眉题: 22rpx semibold + `letter-spacing 0.32em` 陶红; 分类标签 0.14-0.28em

### 间距 / 圆角 / 按钮 / 阴影
- 间距: xs 8 / sm 16 / md 24 / lg 32 / xl 48 / 2xl 64 (rpx); 页面左右 padding 32rpx; tab 页底 padding 160rpx
- 圆角: 卡片 xl 24 / 内容卡 lg 16 / 输入 md 12 / 小 sm 8 / 胶囊 button 48 / round 999 (rpx); 边框 2rpx
- 按钮高: sm 64 / md 80 / lg 96 (rpx)
- 阴影(极轻纸感): card `0 8 24 rgba(33,76,57,0.07)` / hover `0 10 28 .1` / float `.12` / popup `0 12 36 .16`

### 动效
- press 按压: `scale(0.97)` + spring `cubic-bezier(0.34,1.56,0.64,1) 0.3s`
- rise 渐入上移: `translateY(24rpx)→0` 0.5s `cubic-bezier(0.16,1,0.3,1)`,按 `--rise-index × 60ms` stagger
- slideUp 弹层 0.32s expo-out; heartPop 收藏心跳; barGrow 营养条 scaleX 生长
- 全站禁 emoji/Unicode 伪图标,图标一律 Lucide 线性描边(stroke-width 2)

## Part 2 — 原始源码

### src/styles/variables.scss(全文,195 行)

```scss
// 设计令牌 · 杂志编辑风（Kinfolk 纸感）
// 颜色
$color-primary: #2f6b4f;
$color-primary-light: #4f8a69;
$color-primary-dark: #214c39;
$color-success: #3f7d55;
$color-warning: #b95f3d;
$color-error: #c44747;
$color-info: #4f6d7a;

// 纸感底色
$color-bg-page: #f7f5f0;
$color-bg-card: #ffffff;
$color-bg-hover: #efece4;

// 文字
$color-text-primary: #1f2b24;
$color-text-secondary: #55625a;
$color-text-tertiary: #8a948c;
$color-text-disabled: #b8c2bb;
$color-text-white: #ffffff;

// 边框与分割线
$color-border: #ddd8cc;
$color-divider: #e8e4d9;
$color-rule: #c9c3b4; // 章节细规则线（比 divider 深一档）

// 透明色阶（替代散落的 rgba 硬编码）
$color-primary-alpha-06: rgba(47, 107, 79, 0.06);
$color-primary-alpha-08: rgba(47, 107, 79, 0.08);
$color-primary-alpha-10: rgba(47, 107, 79, 0.1);
$color-primary-alpha-12: rgba(47, 107, 79, 0.12);
$color-primary-light-alpha-10: rgba(79, 138, 105, 0.1);
$color-primary-light-alpha-12: rgba(79, 138, 105, 0.12);
$color-warning-alpha-07: rgba(185, 95, 61, 0.07);
$color-warning-alpha-10: rgba(185, 95, 61, 0.1);
$color-error-alpha-07: rgba(196, 71, 71, 0.07);
$color-error-alpha-10: rgba(196, 71, 71, 0.1);
$color-info-alpha-05: rgba(79, 109, 122, 0.05);
$color-info-alpha-07: rgba(79, 109, 122, 0.07);
$color-info-alpha-08: rgba(79, 109, 122, 0.08);
$color-info-alpha-16: rgba(79, 109, 122, 0.16);
$color-scrim: rgba(20, 29, 24, 0.5); // 弹窗遮罩

// 间距
$spacing-xs: 8rpx;
$spacing-sm: 16rpx;
$spacing-md: 24rpx;
$spacing-lg: 32rpx;
$spacing-xl: 48rpx;
$spacing-2xl: 64rpx;

// 圆角
$radius-xs: 4rpx;
$radius-sm: 8rpx;
$radius-md: 12rpx;
$radius-lg: 16rpx;
$radius-xl: 24rpx;
$radius-button: 48rpx;
$radius-round: 999rpx;

// 按钮高度
$button-height-sm: 64rpx;
$button-height-md: 80rpx;
$button-height-lg: 96rpx;

// 阴影（纸感 · 极轻）
$shadow-card: 0 8rpx 24rpx rgba(33, 76, 57, 0.07);
$shadow-card-hover: 0 10rpx 28rpx rgba(33, 76, 57, 0.1);
$shadow-float: 0 8rpx 24rpx rgba(33, 76, 57, 0.12);
$shadow-popup: 0 12rpx 36rpx rgba(33, 76, 57, 0.16);

// 字号
$font-size-xs: 22rpx;
$font-size-sm: 24rpx;
$font-size-md: 28rpx;
$font-size-lg: 32rpx;
$font-size-xl: 36rpx;
$font-size-xxl: 40rpx;
$font-size-hero: 56rpx;

// 行高
$line-height-tight: 1.3;
$line-height-normal: 1.5;
$line-height-loose: 1.8;

// 字重
$font-weight-normal: 400;
$font-weight-medium: 500;
$font-weight-semibold: 600;
$font-weight-bold: 700;

// 字体栈
$font-family-serif: Georgia, 'Times New Roman', 'Songti SC', 'STSong', 'SimSun', serif;
$font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;

// 动效
$transition-fast: 0.15s ease;
$transition-base: 0.25s ease;
$transition-slow: 0.35s ease;
$ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
$ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
$transition-spring: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
$transition-slide: 0.32s cubic-bezier(0.16, 1, 0.3, 1);

// Mixins
@mixin text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@mixin text-ellipsis-multi($lines: 2) {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: $lines;
  overflow: hidden;
  text-overflow: ellipsis;
}

@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin scroll-x-container {
  white-space: nowrap;
}

@mixin scroll-x-item($width) {
  display: inline-block;
  width: $width;
  vertical-align: top;
  white-space: normal;
}

@mixin button-reset {
  padding: 0;
  margin: 0;
  line-height: normal;
  text-align: inherit;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  &::after {
    border: none;
  }
}

// 弹性按压（全站可点元素统一手感）
@mixin press {
  transition: transform $transition-spring, opacity $transition-fast;

  &:active {
    transform: scale(0.97);
  }
}

// 渐入上移（配合 --rise-index 变量做 stagger）
@mixin rise($name: rise) {
  animation: $name 0.5s $ease-out-expo both;
  animation-delay: calc(var(--rise-index, 0) * 60ms);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(24rpx);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes heartPop {
  0% { transform: scale(1); }
  40% { transform: scale(1.35); }
  100% { transform: scale(1); }
}
```

### src/app.scss(全文)

见 `layouts.md` 全局样式节(page 基础字体/背景/盒模型)。
