# 工程入口

路径：仓库根目录、`src/main.tsx`、`src/App.tsx`、`scripts/`。

## 根配置

| 文件 | 作用 |
| --- | --- |
| [package.json](../../package.json) | 依赖 React 18、Zustand 4、three；脚本有 dev / build / preview / test / test:watch；包管理器是 pnpm。 |
| [tsconfig.json](../../tsconfig.json) | 严格模式，`@/*` 指向 `src/*`，模块解析方式为 bundler，只包含 `src`。 |
| [vite.config.ts](../../vite.config.ts) | React 插件 + 图片优化插件（质量 94）；开发端口 2333；环境变量前缀 `VITE_` / `isTest` / `BattleTest`；CSS Modules 类名格式 `[name]__[local]___[hash]`。 |
| `.env.development` / `.env.production` / `.env.test` | 两个开关：`isTest` 跳过电梯过场，`BattleTest` 让敌人只有 1 点生命。⚠ 开发环境当前两个都是 `true`。 |
| [index.html](../../index.html) | 提供 `#root`，以 module 脚本加载 `src/main.tsx`。 |

⚠ CSS Modules 刻意**没有**开启 `localsConvention: camelCase`：项目中有大量动态拼接的类名（如 `k-${kind}`），必须保留 kebab 原名，用 `s["..."]` 方括号访问。

## 运行入口

| 文件 | 作用 |
| --- | --- |
| [src/main.tsx](../../src/main.tsx) | 创建 React 根。⚠ `import "./styles/index.css"` 必须写在所有 import 的最前面，保证公共样式先于组件样式注入。同时安装全局光标（`installGameCursor`）和图鉴收集器（`installCodexCollector`）。 |
| [src/App.tsx](../../src/App.tsx) | 顶层路由：读取 `runStore.screen`，由 `renderScreen` 映射成页面组件，交给 `ScreenTransition` 渲染；常驻挂载 `GuideSpotlight` 与 `ConfirmDialog`；负责启动 BGM、音效和素材预加载。URL 带 `?page=test` 时改为渲染演示页（仅开发环境，演示页以 `React.lazy` 懒加载，生产包不含）。 |

界面枚举 `Screen`：`menu`、`town`、`formation`、`sortie`、`elevator`、`explore`、`battle`、`victory` / `defeat`（后两者都渲染 `EndScreen`）。角色详情不是独立界面，而是编队页内部的一种状态。

## 离线脚本 `scripts/`

这些脚本都不参与运行时，只用来加工素材或服务构建。

| 文件 | 作用 |
| --- | --- |
| [vite-plugin-image-optimize.mjs](../../scripts/vite-plugin-image-optimize.mjs) | Vite 插件：在模块加载时把 PNG/JPEG 转成 WebP，并给视频降码率；开发和构建行为一致。`OPTIMIZE=0` 可跳过优化，用原图对比。 |
| [alpha-bbox.mjs](../../scripts/alpha-bbox.mjs) | 测量透明 PNG 的内容框，结果用于敌人立绘登记（`ui/art/battle/enemyArt.ts`）。 |
| [chroma-cut.mjs](../../scripts/chroma-cut.mjs) | 把纯色底立绘抠成透明 PNG，并裁到角色边界。 |
| [white-cut.mjs](../../scripts/white-cut.mjs) | 把白底横向循环场景抠成透明 PNG，用作近景层。 |
| [crop-status-buffs.mjs](../../scripts/crop-status-buffs.mjs) | 把四宫格状态图标切成单张（中毒 / 烧伤 / 护盾 / 锋利）。 |
| [shelf-frame-cut.mjs](../../scripts/shelf-frame-cut.mjs) | 去掉商店货位边框的柔光，只保留实体线。 |
| [lib/png.mjs](../../scripts/lib/png.mjs) | 零依赖的 PNG 编解码，供上面的抠图脚本共用。 |

## 其他目录

- `design/`：各系统的设计文档（卡牌、物品、关卡事件、队伍属性等），以及美术提示词。
- `docs/`：代码地图、代码健康度审查、探索说明和评审记录。
- `html-templates/`：静态 HTML 原型，不参与构建。
