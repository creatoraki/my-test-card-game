# 样式层

路径：`src/styles/`（全局层）与 `src/ui/**/*.module.css`（组件层）。

## 全局层

| 文件 | 作用 |
| --- | --- |
| [index.css](../../src/styles/index.css) | 公共样式的唯一入口，依次引入 `tokens` 和 `base`。由 `main.tsx` 在所有 import 之前引入。 |
| [tokens.css](../../src/styles/tokens.css) | 全站唯一的设计令牌：字体族、终端文字色与辉光、背景和面板底色、边框、物品稀有度色。⚠ 组件 CSS 里不要重新声明这些变量名。 |
| [base.css](../../src/styles/base.css) | 字体注册（BebasNeue 用于装饰，思源黑体用于正文）、reset、自定义光标、按钮与表单的基础外观。 |

⚠ `--font-family` 以 BebasNeue 打头，中文会回落到思源黑体；按项目规则，英文字体只能用作装饰。

## 组件层约定

- 每个组件在同名目录下放 `Xxx.module.css`，由组件自己引入，类名在编译期加哈希，天然隔离。
- 动态类名保留 kebab 写法，用 `s["k-" + kind]` 方括号访问（Vite 刻意没有开启 camelCase 转换）。
- 拼接类名统一用 [ui/common/shared/cx.ts](../../src/ui/common/shared/cx.ts)（全项目唯一一处）。
- 跨组件的状态通过根节点的 `data-*` 属性传递（例如 `data-explore-stage`、`data-town-stage`），不要写远程后代选择器去改子组件样式。
- 同一领域里共享的材质和骨架放在该领域的 `styles/` 目录，由组件通过 `composes` 复用：

| 共享样式 | 用途 |
| --- | --- |
| [app/styles/stageCanvas.module.css](../../src/ui/app/styles/stageCanvas.module.css) | 1920×1080 设计画布的 letterbox 容器与缩放骨架。 |
| [explore/styles/](../../src/ui/explore/styles/exploreKit.module.css) | `exploreKit`（按钮、标签、事件类型色）、`explorePanel`（暗玻璃面板）、`rewardKit`（奖励浮层版式）。 |
| [common/EventPanel/styles/](../../src/ui/common/widget/EventPanel/styles/eventPanelFrame.module.css) | 事件面板的外框、简报、选项和结果、遮罩。 |
| [battle/styles/](../../src/ui/battle/styles/unitBadges.module.css) | 敌我单位徽章、胜利面板格子。 |
| [character/styles/](../../src/ui/character/styles/detailTokens.module.css) | 角色详情的令牌、发光卡、场景遮罩、字号阶梯。 |
| [sortie/styles/sortieGlass.module.css](../../src/ui/sortie/styles/sortieGlass.module.css) | 出击准备的白玻璃面板材质。 |
| `town/cryo/styles/`、`town/museum/styles/`、`town/terminal/styles/` | 医疗室、博物馆、研究中心各自的场景套件。 |

- 颜色主题由 TS 以 props 或 CSS 变量下发，材质写在 CSS 里，两者不要混在一处。例如出击和探索的背包配色写在各自的 `styles/inventoryPalettes.ts`。
- 演出时长常量的唯一来源在 TS 中（`ui/app/shared/transitions.ts`、`ui/battle/choreo/animations.ts`、`ui/town/TownScreen/facilityScenes.ts`），CSS 通过变量读取。

## 设计画布

所有页面都在 1920×1080 的设计画布上排版，由 `--stage-scale` 等比缩放适配窗口（见 [ui/app/shared/stage.ts](../../src/ui/app/shared/stage.ts)）。组件中的 px 都是设计 px，与实际分辨率无关。悬浮层要 portal 到画布内部，跟着画布一起缩放。

## 已知问题

- 生产代码中仍有 85 处小于 18px 的字号（包括 `base.css` 的 14px / 15px），详见 [代码健康度审查](../代码健康度审查.md)。
