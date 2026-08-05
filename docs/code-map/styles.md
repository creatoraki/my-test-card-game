# 样式层

路径：`src/styles/`（全局层）与 `src/ui/**/*.module.css`（组件层）。公共层集中维护，组件表现随组件维护。

## 公共样式

| 文件 | 作用 |
| --- | --- |
| [index.css](../../src/styles/index.css) | 公共 CSS 唯一入口，只按 `tokens → base` 两条导入。 |
| [tokens.css](../../src/styles/tokens.css) | 设计令牌：配色、边框、圆角，以及五档物品稀有度和对应辉光。卡牌稀有度是另一套类型，不在这里混用。 |
| [base.css](../../src/styles/base.css) | reset、页面底纹、扫描线、按钮全家桶、表单元素和基础文字元素。 |

**全局层只剩这两个文件**（第三个全局文件是 `ui/app/viewTransition.global.css`，那里没有类名）。
原先的 `layout.css` 与 `widgets.css` 已在模块化改造中拆解完毕：

- 被多页复用的骨架类（`.screen` / `.terminal-screen` / `.center` / `.screen-kicker` …）由各页在自己的
  `module.css` 里持有——它们本就只有寥寥几行，复制远比共享一个全局类名安全；
- 只有一个使用方的（`.row` / `.overlay` / `.overlay-card`）直接收归那个组件，见
  [BattleScreen.module.css](../../src/ui/battle/BattleScreen/BattleScreen.module.css) 末尾；
- 结算页的卡组摘要、战利品标签和终端骨架在
  [EndScreen.module.css](../../src/ui/result/EndScreen/EndScreen.module.css)，战后小结在
  [ExpRewardScreen.module.css](../../src/ui/result/ExpRewardScreen/ExpRewardScreen.module.css)；
- 确认无人使用的（`.title` / `.subtitle` / `.menu-main` / `.chip` / `.reward-cards` …）已删除。

探索域的共享按钮、标签和事件类型色位于
[exploreKit.module.css](../../src/ui/explore/styles/exploreKit.module.css)，探索组件各自通过 `composes` 使用；
探索画布根通过 `data-explore-stage` 传递跨组件状态，不再依赖 `.explore-stage` 的远程后代选择器。

出击域的白玻璃面板材质（零圆角 + `blur(18px) saturate(118%) brightness(1.06)` + 白色内描边 hairline）
住在 [sortieGlass.module.css](../../src/ui/sortie/styles/sortieGlass.module.css)，
`StockPanel` / `StoragePicker` / `SortieBackpack` 与 `PrepStep` 的积分片各自 `composes` 使用。
它同时下发 `--sm-ease` / `--sm-dur` 两个手感令牌和错峰入场用的 `--enter-delay`（由 `PrepStep` 的
布局类赋值）——真相点是 `MapSelectStep` 的选层带，改材质要两边一起看，否则两个步骤之间滑动会脱节。
⚠ 与选层带唯一刻意的偏差是面板多压了一层 `#05121466` 深底：`SortieBackdrop` 的地图信息在物资准备
步骤仍渲染在面板背后，纯白玻璃会让物品图标读不清。

据点设施的 hover/active 样式通过大厅根的 `data-town-stage` 传递状态；商店的
`ShopItemTile.module.css` 与 `ShopItemCard.module.css` 各自独占商品格和详情栏样式，
不再由 `ShopScene.module.css` 远程改写子组件。

战斗域的两种「单位外壳」（敌人 `CombatantView` 的 `.combatant`、我方 `AllyBar` 的 `.ally-slot`）
共享同一套演出规则，靠 [unitShell.ts](../../src/ui/battle/unitShell.ts) 定义的 `data-*` 契约跨模块命中：
`data-side` / `data-dead` / `data-attacking` / `data-targetable` / `data-react`。
规则本体住在 [HitFxLayer.module.css](../../src/ui/battle/fx/HitFxLayer/HitFxLayer.module.css)。
两枚共用徽章在 [unitBadges.module.css](../../src/ui/battle/styles/unitBadges.module.css)。
另有三处结构性 `data-*` 钩子：`data-hitstop`（顿帧，BattleScreen 挂在画布根）、
`data-hand-tray` / `data-hand-slot`（手牌托盘版式）、`data-cmb-stage`（相机取景的 `querySelector` 锚点
——类名会被哈希，JS 只能认属性）。

## 组件样式约定 —— CSS Modules

组件样式一律是与组件同目录的 `Xxx.module.css`，类名在编译期被哈希（`vite.config.ts` 的 `css.modules.generateScopedName` 保留 `[name]__[local]`，devtools 里仍可读）。**类名本身不改名**：既有的 `expl-` / `cryo-` / `sx-` 前缀保留下来当作可读性标记，隔离由构建保证，不再靠命名纪律。

TSX 侧统一用 `src/ui/common/cx.ts`：

```tsx
import { cx } from "@/ui/common/cx";
import s from "./CombatantView.module.css";

<div className={cx(s["combatant"], dead && s["dead"], s[`intent-${kind}`])} />
```

方括号访问是刻意的（未开 `localsConvention: camelCase`）：项目里大量动态类名（`k-${kind}`、`pip-${kind}`、`r-${rarity}`、`screen-fx-${fx}`、`shake-lv${n}`）只有 kebab 原名拼得出来。

### 五条铁律

| # | 规则 |
| --- | --- |
| 1 | 一个 `*.module.css` **只被同名 `.tsx` 导入**。两个组件要共用的样式，抽成 `<域>/styles/xxx.module.css`，由双方各自 `composes`。 |
| 2 | **祖先状态用 `data-*` 属性传递，不用类名。** 「祖先处于某状态时改我」的规则写在**拥有该元素的组件**的 CSS 里：`:global([data-hitstop]) .combatant-figure { … }`。祖先只负责挂属性。 |
| 3 | **父组件要改子组件外观，只能通过 `className` prop。** 公共组件一律接受 `className`。禁止 `.ally-figure .portrait-image` 这类远程后代选择器——哈希之后它根本不会命中。 |
| 4 | **跨组件的尺寸/配色契约用 CSS 自定义属性**（`--hand-card-w`、`--rr`、`--notch`）。CSS 变量不受哈希影响，是模块边界上唯一合法的通道；契约必须在双方文件头写清楚。 |
| 5 | **`:global()` 只允许三种场景**：`::view-transition-*` 文档根伪元素、铁律 2 的 `data-*` 祖先状态、`src/styles/` 全局层的类（能用 `composes` 就不用 `:global`）。其余一律视为违规。 |

### 保持全局的三处

`src/styles/tokens.css`（设计令牌）、`src/styles/base.css`（reset / `body` / `button` 皮肤）、`src/ui/app/viewTransition.global.css`（只含 `:root` 变量与 `::view-transition-*`，无类名）。除此之外 `src/ui` 下不应再出现普通 `.css`——`_legacy/` 是归档区，不算在内。

`view-transition-name` 是属性**值**不是类名，不受 Modules 影响。

### @keyframes 的两条相反陷阱

`@keyframes` 名字**会**被哈希，同文件内的 `animation-name` 引用由构建自动改写。由此分出两种情形，写反了都是「动画静默不播」：

- **关键帧写在 `module.css` 里** ⇒ `animation-name` 必须也写在 CSS 里，**不能**由 TSX 行内下发（JS 字符串构建管不着）。见
  [IaiSlashFx.module.css](../../src/ui/battle/fx/IaiSlashFx/IaiSlashFx.module.css) 的 `.iai-dot`——行内只留 `delay` / `duration`。
- **关键帧由组件运行时注入 `<style>`**（按敌人生成、支持跳帧）⇒ 不经 Modules，名字不哈希，行内 `animationName` 正常工作。见
  [EnemySprite.tsx](../../src/ui/battle/EnemySprite/EnemySprite.tsx)。

`prefers-reduced-motion` 降级块放在所属组件 CSS 的末尾，与被压制的规则保持同文件。不要把所有降级规则重新集中到一个全局文件。

## 设计画布

[hooks/stage.ts](../../src/ui/hooks/stage.ts) 提供 `STAGE`（1920×1080 基准尺寸、最大缩放）和 `useStageScale`（基于 `ResizeObserver` 计算 letterbox 等比缩放）。战斗、主菜单和据点使用固定设计画布，画布内部坐标都是设计 px，不能使用 `vw` / `vh`，也不能按窗口宽度重新排版。

战斗画布的主要旋钮在 [BattleScreen.module.css](../../src/ui/battle/BattleScreen/BattleScreen.module.css)：`--canvas-pad`、`--stage-gap`、`--hud-h`、`--hud-party-w`、`--hud-info-w`。`--hud-h` 会直接决定战场可见下沿，调整它前要检查敌人脚下的背景地面线。手牌宽度使用 `--hand-card-w`，卡高由配图区、顶栏和说明区推导，不要另写固定高度——这几个变量是下发给 [HandCard.module.css](../../src/ui/battle/HandCard/HandCard.module.css) 的跨组件契约（铁律 4），卡在托盘里的版式与厚度规则住在那边。

场景相机使用 `.battle-world` 的 `transform` / `translate` / `scale` 分工，世界、背景、氛围和单位必须作为刚体一起变换；不要让背景和单位分别套相机。画布内 `getBoundingClientRect()` 得到的是屏幕 px，定位前要换算回设计 px；相机反投影则以 `.battle-world` 的矩形抵消缩放和漂移。

公共样式不应重新引入已移除的主题覆盖层、战斗窗口断点或第二个裁切边界。

## 加规则时往哪放

1. 只服务一个组件 → 它自己的 `Xxx.module.css`（**默认答案**）。
2. 一个域内两个以上组件共用 → `<域>/styles/xxx.module.css`，双方 `composes` 或直接 import
   （现有三例：`battle/styles/unitBadges.module.css`、`explore/styles/exploreKit.module.css`、
   `sortie/styles/sortieGlass.module.css`）。
3. 跨域复用的**组件** → `ui/common/` 下建组件，别建共享类名。
4. 真的全站通用且无法组件化（新设计令牌、`button` 皮肤）→ `src/styles/tokens.css` 或 `base.css`。

只有第 4 条会进全局层，而它至今只有两个文件——先确认前三条都不成立再考虑它。
