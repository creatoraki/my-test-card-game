# 工程入口

路径：仓库根目录、`src/main.tsx`、`src/App.tsx` 与 `scripts/`。

| 文件或目录 | 作用 |
| --- | --- |
| [index.html](../../index.html) | Vite HTML 入口，提供 `#root`，通过 module 脚本加载 `src/main.tsx`。 |
| [package.json](../../package.json) | 声明 React、Zustand 等依赖以及 dev / build / preview / test 脚本。 |
| [tsconfig.json](../../tsconfig.json) | TypeScript 严格模式、`@/*` → `src/*` 路径别名和 bundler 模块解析。 |
| [vite.config.ts](../../vite.config.ts) | Vite、React 插件和 `@` 路径别名配置。 |
| [src/main.tsx](../../src/main.tsx) | React 根渲染，`StrictMode` 包裹 `<App />`。`import "./styles/index.css"` 必须保持在 import 列表最前，确保公共 CSS 先注入。 |
| [src/App.tsx](../../src/App.tsx) | 顶层路由：读取 `runStore.screen`，将界面映射为组件，并交给 `ScreenTransition` 渲染。抽出 `renderScreen` 是为了过场期间继续渲染旧界面。 |
| `scripts/` | 开发辅助脚本，不承载游戏规则。 |

依赖入口：`main.tsx` → `App.tsx` → `runStore` / UI 页面；`main.tsx` 同时是全局样式入口。业务规则不应写入入口文件。

## 相关设计文档

世界观与机制见 `design/游戏设定.md`；角色养成、物品、探索和事件方案也在 `design/` 下按主题维护。修改对应系统前按需阅读设计文档，不要把全部设计文档当成代码地图一起加载。
