# 工程入口

路径：仓库根目录、`src/main.tsx`、`src/App.tsx` 与 `scripts/`。

| 文件或目录 | 作用 |
| --- | --- |
| [index.html](../../index.html) | Vite HTML 入口，提供 `#root`，通过 module 脚本加载 `src/main.tsx`。 |
| [package.json](../../package.json) | 声明 React、Zustand 等依赖以及 dev / build / preview / test 脚本。 |
| [tsconfig.json](../../tsconfig.json) | TypeScript 严格模式、`@/*` → `src/*` 路径别名和 bundler 模块解析。 |
| [vite.config.ts](../../vite.config.ts) | Vite、React 插件和 `@` 路径别名配置。 |
| [src/main.tsx](../../src/main.tsx) | React 根渲染，`StrictMode` 包裹 `<App />`。`import "./styles/index.css"` 必须保持在 import 列表最前，确保公共 CSS 先注入。 |
| [src/App.tsx](../../src/App.tsx) | 顶层路由：读取 `runStore.screen`，将界面映射为组件，并交给 `ScreenTransition` 渲染；同时驱动 BGM（`ui/audio`）。抽出 `renderScreen` 是为了过场期间继续渲染旧界面。 |
| `scripts/` | 开发辅助脚本，不承载游戏规则；`alpha-bbox.mjs` 用于测量透明 PNG 的内容框，供敌人立绘登记使用。 |

素材优化插件默认将图片质量设为 88、effort 设为 6，视频限制到 1920px 宽并使用 CRF 23；可通过 `OPTIMIZE=0` 跳过优化以对比原素材。

启动时的美术资源预加载由 `App.tsx` 触发，资源 URL 必须登记在 `ui/art` 的对应查表或 `sceneArt.ts` 中。
图片任务等待下载和解码完成；视频任务只等待首帧可用，浏览器是否继续下载完整文件由 `preload="auto"` 和网络策略决定。

依赖入口：`main.tsx` → `App.tsx` → `runStore` / UI 页面；`main.tsx` 同时是全局样式入口。业务规则不应写入入口文件。

## 相关设计文档

世界观与机制见 `design/游戏设定.md`；角色养成、物品、探索和事件方案也在 `design/` 下按主题维护。修改对应系统前按需阅读设计文档，不要把全部设计文档当成代码地图一起加载。
