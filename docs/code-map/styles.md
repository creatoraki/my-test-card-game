# 样式层

路径：`src/styles/` 与 `src/ui/*.css`。公共层集中维护，组件表现随组件维护。

## 公共样式

| 文件 | 作用 |
| --- | --- |
| [index.css](../../src/styles/index.css) | 公共 CSS 唯一入口，固定按 `tokens → base → layout → widgets` 导入。 |
| [tokens.css](../../src/styles/tokens.css) | 设计令牌：配色、边框、圆角，以及五档物品稀有度和对应辉光。卡牌稀有度是另一套类型，不在这里混用。 |
| [base.css](../../src/styles/base.css) | reset、页面底纹、扫描线、按钮全家桶、表单元素和基础文字元素。 |
| [layout.css](../../src/styles/layout.css) | `.screen`、终端屏幕、标题、行布局、公共 HUD 标签、overlay，以及仍使用流式布局的页面主体。宽度断点只允许作用于流式页面。 |
| [widgets.css](../../src/styles/widgets.css) | 跨界面奖励三选一、卡组摘要、战利品标签和经验条。 |

## 组件样式约定

`src/ui/*.css` 通常与同名 `.tsx` 放在一起，由组件自己导入。类名保持全局，不使用 CSS Modules：动态类名、跨组件后代选择器和共享表现依赖现有命名。`unit-badges.css` 是例外，它由 `CombatantView` 与 `AllyBar` 共用。

`prefers-reduced-motion` 降级块放在所属组件 CSS 的末尾，与被压制的规则保持同文件；跨文件规则依靠更高特异性。不要把所有降级规则重新集中到一个全局文件。

## 设计画布

[stage.ts](../../src/ui/stage.ts) 提供 `STAGE`（1920×1080 基准尺寸、最大缩放）和 `useStageScale`（基于 `ResizeObserver` 计算 letterbox 等比缩放）。战斗、主菜单和据点使用固定设计画布，画布内部坐标都是设计 px，不能使用 `vw` / `vh`，也不能按窗口宽度重新排版。

战斗画布的主要旋钮在 [BattleScreen.css](../../src/ui/BattleScreen.css)：`--canvas-pad`、`--stage-gap`、`--hud-h`、`--hud-party-w`、`--hud-info-w`。`--hud-h` 会直接决定战场可见下沿，调整它前要检查敌人脚下的背景地面线。手牌宽度使用 `--hand-card-w`，卡高由配图区、顶栏和说明区推导，不要另写固定高度。

场景相机使用 `.battle-world` 的 `transform` / `translate` / `scale` 分工，世界、背景、氛围和单位必须作为刚体一起变换；不要让背景和单位分别套相机。画布内 `getBoundingClientRect()` 得到的是屏幕 px，定位前要换算回设计 px；相机反投影则以 `.battle-world` 的矩形抵消缩放和漂移。

公共样式不应重新引入已移除的主题覆盖层、战斗窗口断点或第二个裁切边界。新增组件表现优先放进同名 CSS，只有真正跨组件的规则才进入 `src/styles/`。
