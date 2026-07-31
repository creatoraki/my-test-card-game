# 工程入口

| 文件或目录 | 作用 |
| --- | --- |
| [index.html](../../index.html) | Vite HTML 入口，提供 `#root`。 |
| [src/main.tsx](../../src/main.tsx) | React 根渲染；公共样式导入应保持在 import 列表最前。 |
| [src/App.tsx](../../src/App.tsx) | 按 `runStore.screen` 选择页面并挂载过场。 |
| [package.json](../../package.json) | 依赖和 dev/test/build/preview 脚本。 |
| [vite.config.ts](../../vite.config.ts) | Vite、React 插件和 `@` 路径别名。 |
| [tsconfig.json](../../tsconfig.json) | TypeScript 严格模式与路径配置。 |
| `scripts/` | 开发辅助脚本，不参与业务规则。 |

设计与决策文档仍在仓库根目录：`游戏设定.md`、`角色养成设计.md`、`物品设计.md`、`探索模式设计.md`、`事件设计.md` 和 `探索机制评审.md`。修改对应系统前按需阅读，不要把所有设计文档当成代码地图一起加载。
