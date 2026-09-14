# 今天吃啥

基于 **uni-app + Vue 3 + TypeScript** 的健康菜谱微信小程序。

## 功能

- 按手头食材筛选菜谱（多选为任意食材命中）
- 按健康人群查看饮食提醒和推荐菜谱
- 健康推荐卡片展示基于健康标签的推荐依据
- 保存本地饮食档案，明确忌口自动过滤，健康目标用于推荐排序与详情提醒
- 查看食材匹配度、已有食材和仍需准备的食材
- 一键随机选择高匹配菜谱
- 查看菜谱用料、营养、步骤和小贴士
- 本地收藏菜谱
- 对菜谱标记“不喜欢”“食材不齐”“做过了”，在本机调整后续推荐
- 原生微信分享菜谱详情
- 将菜谱安排到本周日期和餐次，自动生成可勾选的购物清单
- 通过微信云函数调用 ShowAPI，按已选食材联网查询更多菜谱
- 查看隐私与数据说明，分项或一键清除本地数据
- 启动测试时自动校验本地菜谱的食材、人群、营养和步骤关系

## 参赛开发

项目按微信小程序开发竞赛作品持续完善，当前优先保证推荐结果可解释、健康信息有边界、核心流程可离线演示。详细规划、演示脚本和验收清单见 [竞赛路线图](docs/competition-roadmap.md)。

## 开发环境

- Node.js 20+
- npm 10+
- 微信开发者工具

安装依赖：

```bash
npm ci
```

Windows PowerShell 如果提示 `npm.ps1` 无法执行，可改用：

```powershell
npm.cmd ci
```

开发微信小程序：

```bash
npm run dev:mp-weixin
```

PowerShell 可直接执行：

```powershell
npm.cmd run dev:mp-weixin
```

命令会持续监听源码变化并输出到 `dist/dev/mp-weixin`。开发调试时在微信开发者工具中选择以下任一方式导入：

- 导入项目根目录，根目录的 `project.config.json` 已指向开发产物
- 直接导入 `dist/dev/mp-weixin`

生产构建：

```bash
npm run lint
npm run typecheck
npm run test
npm run build:mp-weixin
```

生产构建产物位于 `dist/build/mp-weixin`。预览、真机验收和上传比赛版本时，请直接导入该目录；根目录的 `project.config.json` 固定指向开发产物，不能代表生产构建结果。

### H5 浏览器预览

H5 使用与微信小程序相同的 Vue 页面、组件和业务逻辑，由根目录 `index.html` 加载 `src/main.ts`，不是独立的模拟预览页。`@dcloudio/uni-h5` 与现有 uni-app 运行时保持相同的固定版本。

启动本地预览：

```bash
npm run dev:h5 -- --host 127.0.0.1 --port 5173
```

在浏览器中打开终端输出的地址（通常为 `http://127.0.0.1:5173/`）；端口被占用时以实际输出为准。可使用浏览器的移动设备模式检查手机布局。Windows PowerShell 如有执行策略限制，将 `npm` 替换为 `npm.cmd`。

构建 H5：

```bash
npm run build:h5
```

产物位于 `dist/build/h5`，需通过 HTTP 静态服务器提供，不能直接双击 `index.html`。H5 用于开发预览和核心流程验收，不替代微信开发者工具或微信真机验证。

平台限制：

- 本地菜谱、筛选、健康推荐、收藏、饮食档案、本周计划和购物清单使用真实应用逻辑；H5 数据保存在当前浏览器站点的本地存储中，与微信小程序数据不互通，切换域名或端口也会使用不同的存储。
- 浏览器没有微信小程序的 `wx.cloud`。在线“查更多”及相关云端能力不可用，应用会提示“在线菜谱仅在已启用云开发的微信小程序中可用”；不会使用模拟数据或将 ShowAPI 密钥暴露给浏览器。
- 微信原生分享能力不适用于普通浏览器，须在微信小程序中验收。

## 配置说明

微信 AppID 位于 `src/manifest.json` 的 `mp-weixin.appid`。当前首发目标为微信小程序，其他平台暂未作为发布目标验证。

### ShowAPI 在线菜谱

ShowAPI 仅作为扩展搜索源，本地精选菜谱继续负责离线演示、营养展示和健康人群推荐。小程序冷启动和食材选择均不调用 ShowAPI，只有用户主动点击“查更多”时才会请求云函数。在线结果不会显示推测的营养值，也不会混入健康推荐。

1. 在微信开发者工具中开通云开发环境。
2. 复制 `.env.example` 为 `.env.local`，填写 `VITE_WEIXIN_CLOUD_ENV`；不填写时使用当前默认云环境。
3. 在云开发控制台为 `showapiRecipes` 云函数添加环境变量 `SHOWAPI_APP_KEY`，值来自 ShowAPI 控制台。
4. 在微信开发者工具中右键 `cloudfunctions/showapiRecipes`，选择“上传并部署：云端安装依赖”。

`SHOWAPI_APP_KEY` 只保存在云函数环境变量中，不要写入 `src`、`.env` 或其他会被编译到小程序端的文件。未部署云函数或未配置密钥时，本地菜谱功能仍可正常使用。

ShowAPI 当前图片字段已标注“已无”，因此在线菜谱使用无图信息卡片。正式菜谱配图由项目自有素材提供，避免使用与菜名不符的占位图。

### 菜谱配图与图标

- `src/static/recipes/r001.jpg` ~ `r030.jpg` 为 3:2 统一的年轻食物插画封面（800×533）。图片由 `node scripts/generate-recipe-illustrations.mjs` 确定性生成（SVG 插画经 Sharp 输出 progressive JPEG），与菜名一一对应、内容哈希唯一；每次改动生成脚本后重新执行即可整体重生成，并通过 `node scripts/verify-recipe-images.mjs` 校验完整性（覆盖 r001–r030、尺寸、唯一性）。如需换成自拍或商用素材，保持文件名与尺寸不变即可，无需改代码。
- 图标体系统一使用 [Lucide](https://lucide.dev)（ISC 许可）：页面内图标由 `src/components/AppIcon` 以 data-URI SVG 渲染，tabBar 图标由 `node scripts/gen-tabbar.mjs` 从 lucide-static 渲染为 PNG（修改后需重新执行脚本）。
- 图标源如需扩充，编辑 `scripts/gen-appicon.mjs` 的图标名列表后执行 `node scripts/gen-appicon.mjs` 重新生成。
- 设计规范：杂志编辑风（纸感米白底、衬线标题、编号章节），全站禁止 emoji 与 Unicode 伪图标字符。

### 隐私与本地数据

- 饮食档案、忌口、收藏、本周计划、购物清单、菜谱反馈和在线菜谱缓存均保存在微信小程序本地存储中。
- 只有用户主动点击“查更多”时，最多 3 个已选食材名称才会经微信云函数发送给 ShowAPI。
- 项目未启用 uni 统计，微信云初始化也关闭了 `traceUser`。
- 用户可在“我的 → 隐私与数据”查看说明，并分项或一键清除本项目管理的本地数据。
- 正式发布时仍需在微信公众平台按实际能力填写《小程序用户隐私保护指引》，应用内说明不能替代平台侧声明。

## 目录结构

- `src/pages`：本地推荐、个人档案和在线菜谱详情页面
- `src/components`：菜谱卡片和区块标题
- `src/data`：静态菜谱、食材、人群数据
- `src/services`：ShowAPI 云函数调用和本地缓存
- `src/utils`：筛选、收藏、本地数据管理和页面参数交接
- `src/static`：TabBar 和页面静态资源
- `cloudfunctions`：微信云函数代理，负责保护第三方 API 密钥
