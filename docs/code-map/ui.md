# React 视图层

路径：`src/ui/`。组件只负责展示、交互和派发 action，不承载战斗、探索、物品或养成规则。图片素材只通过 `art/` 的查表引用，`data/` 不直接引用素材路径。

样式约定（CSS Modules、五条铁律、`data-*` 跨模块契约）见 [styles.md](styles.md)，本文件不重复。

## 目录结构

```text
src/ui/
├─ app/          过场编排与全站 StageCanvas 画布
├─ audio/        BGM 播放器与程序化音效合成
├─ common/       跨域复用的组件与 cx.ts
├─ menu/         主菜单
├─ town/         据点大厅与设施场景
├─ character/    编队 / 角色详情 / 单卡视图
├─ sortie/       出击地图选择与物资准备
├─ elevator/     电梯下降过场
├─ explore/      探索主界面与其私有子组件
├─ battle/       战斗画布与其私有子组件、演出预设
├─ result/       战后小结与远征结算
├─ art/          素材查表（id → 图片 URL + 预热）
├─ hooks/        设计画布与四个通用 hook
└─ _legacy/      无人引用的归档件，见该目录的 README
```

每个组件占一个目录，三件套：`Xxx.tsx` + `Xxx.module.css` + `index.ts`（只做 re-export）。
跨目录 import 一律走 `@/` 别名，同目录用 `./`。

## 页面与流程

| 文件 | 作用 |
| --- | --- |
| [app/ScreenTransition](../../src/ui/app/ScreenTransition/ScreenTransition.tsx) | 串行执行旧界面出场 → 黑场停顿 → 新界面入场；避免两套 BattleScreen 同时挂载和视频双解码。快速切换由批次号使旧定时器失效。特效档位靠 `.is-fx` 标记类 + `s[\`screen-fx-${name}\`]` 查表。 |
| [app/BattleTransitionCurtain](../../src/ui/app/BattleTransitionCurtain/BattleTransitionCurtain.tsx) | 探索到战斗的裂纹 Canvas、主环和 View Transition 显现；幕布层固定且不向祖先施加 transform/filter。 |
| [app/StageCanvas](../../src/ui/app/StageCanvas/StageCanvas.tsx) | 全站 1920×1080 设计画布容器：统一管理 viewport 测量、DPR 量化的 `--stage-scale` 与布局期 `zoom`，页面通过 className 复用局部样式。 |
| [menu/MenuScreen](../../src/ui/menu/MenuScreen/MenuScreen.tsx) | 主菜单开屏。与战斗共用 1920×1080 设计画布，视频铺底，标题和开始按钮用设计 px 定位。 |
| [town/TownScreen](../../src/ui/town/TownScreen/TownScreen.tsx) | 据点大厅和设施入口。用 bento 砖块表达设施面积；设施内容通过 `FACILITY_CONTENT` 登记表挂载，内容和返回按钮延迟到离场阶段再卸载。状态条的生存天数订阅 `townStore.day`。画布根挂 `data-town-stage`，四个设施的 hover/active 规则靠它提特异性。 |
| [town/terminal/ControlTerminalScene](../../src/ui/town/terminal/ControlTerminalScene/ControlTerminalScene.tsx) | 控制终端：城市维护工单委托占位。抽屉入口和浮层均在据点画布内完成，不新增路由；出击已迁移到大厅一级入口。 |
| [town/cryo/CryoScene](../../src/ui/town/cryo/CryoScene/CryoScene.tsx) | 冬眠仓场景骨架：标题、积分/唤醒读数、两行右侧抽屉入口与面板挂载；入口通过 `data-cryo-entry` 把按钮矩形交给 `cryoMorph`，不承载具体功能内容。 |
| [town/cryo/cryoMorph](../../src/ui/town/cryo/cryoMorph/useCryoMorph.ts) | 冬眠仓入口按钮到面板的同页形变态机；按 `cryoChoreo` 的设计 px 矩形执行滑动、横向撑开、纵向撑开与倒放关闭，并处理 Esc、完成兜底和过渡期间内容隐藏。 |
| [town/cryo/CryoPanelShell](../../src/ui/town/cryo/CryoPanelShell/CryoPanelShell.tsx) | 冬眠仓浮层公共壳：透明点击层、冷凝氛围、标题头、关闭按钮和可变矩形面板；不再使用吊绳或从天而降动画，几何由 `cryoMorph` 的 ref 驱动。 |
| [town/cryo/CryoFigureStrip](../../src/ui/town/cryo/CryoFigureStrip/CryoFigureStrip.tsx) | 冬眠仓横向立绘条：隐藏原生滚动条，支持滚轮横滚、指针拖拽、拖拽吞点击，以及内容溢出时的两端箭头和渐隐。 |
| [town/cryo/AwakenPanel](../../src/ui/town/cryo/AwakenPanel/AwakenPanel.tsx) | 冬眠唤醒面板：六个瘦高立绘舱位、密封舱信息带、生命指标 count-up、唤醒费用和解封操作；规则与解封 action 由场景传入。 |
| [town/cryo/NutritionPanel](../../src/ui/town/cryo/NutritionPanel/NutritionPanel.tsx) | 营养舱面板编排：订阅城镇状态，组合固定瘦高席位、可入舱立绘条与科技升级叠层；容量、治疗、费用和研究判定复用 `data/nutritionPod`。 |
| [town/cryo/NutritionPanel/NutritionPodRack](../../src/ui/town/cryo/NutritionPanel/NutritionPodRack.tsx) | 营养舱席位阵列：四个固定瘦高席位，处理空置、占用、锁定、未选人、费用不足和角色限制的悬浮提示，并把点击席位转为入舱 action。 |
| [town/cryo/NutritionPanel/NutritionCandidateCard](../../src/ui/town/cryo/NutritionPanel/NutritionCandidateCard.tsx) | 营养舱候选队员立绘卡：半身取景、三段血量、体力极限损伤、选中态与受限原因提示。 |
| [town/cryo/NutritionPanel/NutritionUpgradePanel](../../src/ui/town/cryo/NutritionPanel/NutritionUpgradePanel.tsx) | 营养舱科技升级叠层：展示等级、舱位读数、当前 tier 的容量/治疗科技、材料与积分检查，并用局部 clip-path 展开/收回。 |
| [town/storage/StorageScene](../../src/ui/town/storage/StorageScene/StorageScene.tsx) | 物资中转仓：库存、三槽装备和回收台；穿戴后通过 `deriveStats` 现算面板，出售后清理失效勾选。 |
| [town/assembly/AssemblyScene](../../src/ui/town/assembly/AssemblyScene/AssemblyScene.tsx) | 模块装配舱场景编排：右侧两个抽屉入口（模组装配 / 模组制造），维护当前打开的弹窗与关闭动画；装配弹窗在此订阅据点状态、派发装配/拆卸 action 并统一管理模组 tooltip；制造弹窗整体交给 CraftPanel。 |
| 旧 `town/assembly/AssemblyPanelShell` | 舱内弹窗的通用外壳已提升为公共件 [`common/PanelShell`](../../src/ui/common/PanelShell/PanelShell.tsx)（见「公共组件」一节），装配舱与制造弹窗改为从 `@/ui/common/PanelShell` 引用，样式规则一行未改。 |
| [town/assembly/CraftPanel](../../src/ui/town/assembly/CraftPanel/CraftPanel.tsx) | 模组制造弹窗：注入熔炉琥珀配色，订阅据点状态，维护角色与配方选择，按 `craftCheck` 派发 `craftModule`；三栏节奏与装配弹窗一致。 |
| [town/assembly/CraftRecipeGrid](../../src/ui/town/assembly/CraftRecipeGrid/CraftRecipeGrid.tsx) | 中央制造清单：列出当前角色可造的模组与「材料齐备 / 材料不足 / 经验不足」状态；判定结果由面板算好传入，组件不读 store。 |
| [town/assembly/CraftBench](../../src/ui/town/assembly/CraftBench/CraftBench.tsx) | 右栏制造台：产出预览、经验与材料消耗清单、缺料提示与制造按钮；按钮禁用条件直接来自 `craftCheck`。 |
| [town/assembly/CraftMaterialRack](../../src/ui/town/assembly/CraftMaterialRack/CraftMaterialRack.tsx) | 右栏材料仓库：展示当前角色配方涉及的材料库存与本次需求量，未被选中配方使用的材料压暗。 |
| [town/assembly/AssemblyCharacterStage](../../src/ui/town/assembly/AssemblyCharacterStage/AssemblyCharacterStage.tsx) | 左侧角色舞台：展示当前角色立绘、角色切换缩略按钮和空状态；只接收角色列表与选择回调，不读取 store。 |
| [town/assembly/AssemblyBench](../../src/ui/town/assembly/AssemblyBench/AssemblyBench.tsx) | 右栏紧凑装配工作台：展示单一模组插槽、当前已装配模组和装配状态，派发装配/拆卸按钮与物品 tooltip 回调；候选模组由模组仓架展示；不直接操作 store。 |
| [town/assembly/AssemblyModuleRack](../../src/ui/town/assembly/AssemblyModuleRack/AssemblyModuleRack.tsx) | 右栏滚动模组仓架：以稳定网格展示库存模组，表达选中与兼容性状态，保留键盘聚焦和 tooltip 路径；不承载装配规则。 |
| [town/assembly/AssemblyDeckGrid](../../src/ui/town/assembly/AssemblyDeckGrid/AssemblyDeckStrip.tsx) | 中央卡组主浏览网格：以 3 列完整卡面纵向展示当前角色卡组、选中卡牌和已装配标记，通过回调切换右栏工作台卡牌；使用显式 `data-assembly-deck-grid` 契约。 |
| [town/shop/ShopScene](../../src/ui/town/shop/ShopScene/ShopScene.tsx) | 商店：EventPanel 同源的常驻六格混合货架，支持采购与花积分刷新；右上入口受控打开可复用的 `WarehousePanel`。货架状态与隔日重置都在 `townStore`，本组件只读状态派发 action。私有子组件 `ShelfGrid`、`ShopItemTile`（货架格）与 `ShopItemCard`（详情栏）各自持有样式，不再由 ShopScene 远程改写。 |
| [town/training/TrainingScene](../../src/ui/town/training/TrainingScene/TrainingScene.tsx) | 训练室页面骨架（暗底金色 · 极简版）：背景浮升光粒 + 居中半透明径向天赋树；原页头/剩余点读数/左栏徽章条/底部预览/锁定横幅/重置与确认弹窗已移除。徽章切换改为点击天赋树中央核心节点，弹出居中的 `BadgeSelectModal`，选中后经底栏按钮确认切换；剩余训练点与投入进度显示在树面板头部。徽章与天赋的全部交互住在 `useSquadTalent`（与编队页的 `SquadTalentModal` 共用）。解锁/退还/花费规则一律来自 `data/squadTalents` 纯函数。 |
| [town/training/BadgeRail](../../src/ui/town/training/BadgeRail/BadgeRail.tsx) | 训练室徽章列表条（现挂在左侧抽屉浮层内）：可滚动条目（kicker、名称、基础加成摘要、已启用/待开放状态），点击派发切换；只接收 props 与回调，不读 store，锁定徽章与远征中不派发。 |
| [town/training/TalentTreeRadial](../../src/ui/town/training/TalentTreeRadial/TalentTreeRadial.tsx) | 径向天赋树面板（`html-templates/天赋树.html` 的组件化）：半透明暗玻璃面板、中央金色徽章核心线框（**可点击**，`onCoreClick` 开关徽章浮层）、六分支绕中心等角放射；SVG 渐变连线带 dim/open/active 三态与 SMIL 流动光点，节点为圆盘+方向图标（未激活灰色无光、激活点亮分支本色、可退还虚线金环），悬浮节点出暗金详情浮卡。交互：左键激活、Shift+点击快捷点亮整条路径、右键/Alt+点击/Delete 退还、点数不足抖动；布局与节点半径由 `talentGeometry.ts` 纯函数按分支链自动径向排布（忽略手写坐标），方向图标在 `icons.tsx`，解锁/退还/花费判定一律来自 `data/squadTalents`。 |
| [town/training/SquadResourceBar](../../src/ui/town/training/SquadResourceBar/SquadResourceBar.tsx) | 训练室左下角小队属性读数：按上阵角色 `deriveStats` 求和，叠加徽章/天赋修正并通过引擎 `squad*` helper 得到六项实战最终值；接收径向树悬浮资源键并高亮对应行，不承载规则或交互。 |
| [town/museum](../../src/ui/town/museum/index.ts) | 博物馆设施：使用 `codexCatalog` 生成物品、非临时卡牌和三档敌人目录，展示永久收录进度；`MuseumScene` 编排三个入口与共享 `PanelShell`，三个展厅各自持有筛选、选中态和详情栏。物品展厅使用 1:1 方格，卡牌展厅使用原尺寸大卡与未收录卡背，三个展厅的全部条目统一挂 `InteractiveHint`。 |
| 旧 `town/training/TrainingConfirm` | 训练室旧通用确认弹窗（重置分配/切换徽章共用），极简版改造移除后归档到 `ui/_legacy/training/`，零引用。 |
| 旧 `town/training/TalentTree` / `TalentNode` | 已归档到 `ui/_legacy/training/`（白玻璃青绿扇形半环版），零引用，见该目录 README。 |
| [town/training/TrainingConfirm](../../src/ui/town/training/TrainingConfirm/TrainingConfirm.tsx) | 训练室通用确认弹窗，重置分配与切换徽章共用；抽自旧 `TrainingScene` 的 `.tr-confirm` 结构。 |
| [town/training/styles/trainingKit.module.css](../../src/ui/town/training/styles/trainingKit.module.css) | 训练室域共享的设计令牌（`--tr-*`，暗底金色）、暗玻璃材质与 kicker 排版，各组件各自 `composes`。 |
| [town/shop/WarehousePanel](../../src/ui/town/shop/WarehousePanel/WarehousePanel.tsx) | 商店视觉语言下的可复用仓库面板：直接读取 `townStore.storage`，默认 4×6 格、分类 tab、滚动网格和鼠标右侧物品详情；通过受控 `open/onClose` 与 `rows` / `columns` / `position` 配置复用。 |
| [sortie/SortieScreen](../../src/ui/sortie/SortieScreen/SortieScreen.tsx) | 出击全屏页：固定 1920×1080 舞台，共享当前地图背景与地图 HUD，固定底部导航，并在地图选择和物资准备之间切换；取消时回滚本次购买与仓库取物。 |
| [sortie/SortieBackdrop](../../src/ui/sortie/SortieBackdrop/SortieBackdrop.tsx) | 出击流程共享背景：按可见地图列表播放上下推移背景动画；目标层信息只在地图步骤挂载，并随步骤切换自然卸载。 |
| [sortie/SortieStepViewport](../../src/ui/sortie/SortieStepViewport/SortieStepViewport.tsx) | 出击步骤视口：挂载当前步骤，并在离场动画完成前暂留物资准备侧栏面板；步骤时序由 `sortieStepTransition.ts` 编排。 |
| [sortie/sortieStepTransition.ts](../../src/ui/sortie/sortieStepTransition.ts) | 出击地图选择 ↔ 物资准备的真实 DOM 步骤动画 hook；同步切换唯一可见步骤，提供 460ms 入场状态和过场交互锁。 |
| [sortie/SortieNav](../../src/ui/sortie/SortieNav/SortieNav.tsx) | 出击流程共享底部导航：根据当前步骤派发返回、确认目标层或开始远征，并在过场期间禁用操作。 |
| [sortie/MapSelectStep](../../src/ui/sortie/MapSelectStep/MapSelectStep.tsx) | 地图选择步骤：在传入的可见地图列表中以斜跨玻璃选择带切换目标层；地图信息由共享背景 HUD 展示，无队伍时由固定导航禁止确认目标层。 |
| [sortie/PrepStep](../../src/ui/sortie/PrepStep/PrepStep.tsx) | 物资准备步骤：左侧斜切货柜带，右侧一上一下紧贴格网的仓库与背包；只向子组件下发位置类和交互状态。 |
| [elevator/ElevatorScene](../../src/ui/elevator/ElevatorScene/ElevatorScene.tsx) | 出击后的电梯下降纯演出页：视频静音播放，独立音轨由 BGM 播放器播放；视频结束或不可播放时进入探索；不可跳过且不承载探索规则。 |
| [sortie/StockBand](../../src/ui/sortie/StockBand/StockBand.tsx) | 出击货柜斜切滚动带：固定清单、不限量购买消耗品，支持滚轮/方向键滚动与高亮片二次点击购买；步骤切换时由真实 DOM 动画滑入，避免玻璃快照参与过场。 |
| [sortie/StorageInventory](../../src/ui/sortie/StorageInventory/StorageInventory.tsx) | 出击准备中的仓库消耗品取物壳，复用公共物品面板的悬停详情与容量读数；1×4 格，配色经 [sortie/styles/inventoryPalettes.ts](../../src/ui/sortie/styles/inventoryPalettes.ts) 的 `colorMap` 与背包区分。 |
| [sortie/styles/inventoryPalettes.ts](../../src/ui/sortie/styles/inventoryPalettes.ts) | 出击域两块物品面板的调色板真相点：仓库冷银白透玻璃 / 背包黑玻璃熔橙。 |
| [sortie/styles/sortieGlass.module.css](../../src/ui/sortie/styles/sortieGlass.module.css) | 出击域共享的白玻璃面板材质与共享排版，四方 `composes`；材质真相点见 [styles.md](styles.md)。 |
| [character/FormationScreen](../../src/ui/character/FormationScreen/FormationScreen.tsx) | 编队页壳：只装配画布与冬眠仓底图，页面上只有三样东西 + 一个返回按钮（队伍列表 / 小队徽章 / 小队羁绊）。**角色详情不是另一个 screen**，而是本页的第二种态，两态切换由 `formationMorph/` 做同页元素重组。卡片站位在挂载时定死（`baseOrder`），本页全程不卸载 ⇒ 从详情态回来不会重排。 |
| [character/FormationScreen/SquadHud](../../src/ui/character/FormationScreen/SquadHud/SquadHud.tsx) | 常驻 HUD：小队徽章盘与 `common/SquadBondBar` 收进通栏亮玻璃面板，返回按钮放在左下角并通过 `HoverTooltip` 提示。两态共用同一份 DOM，重组期间原地不动，给形变留参照系。 |
| [character/FormationScreen/HudPanel](../../src/ui/character/FormationScreen/HudPanel/HudPanel.tsx) | 通用亮玻璃面板容器：表面层单独承载斜切与材质，内容层保持可溢出，供羁绊 `RailPopover` 越过面板下边缘。 |
| [character/FormationScreen/SquadBadgeDial](../../src/ui/character/FormationScreen/SquadBadgeDial/SquadBadgeDial.tsx) | 小队徽章盘 + 训练点读数，兼本页的待办提醒位：有未分配训练点时金色呼吸环 + 数字角标脉冲 + 读数转金，未选徽章时红色急促闪烁；点击开 `town/training/SquadTalentModal`。徽章图形与配色复用训练室的 `badgeGlyphs` / `badgeTheme`。 |
| [character/FormationScreen/CrewGrid](../../src/ui/character/FormationScreen/CrewGrid/CrewGrid.tsx) | 队伍列表卡阵（276×772 一行 6 列）。按与被点卡的列距/行距给每张卡下发飞散方向量 `--dx/--dy/--dist`，整片阵列以被点那张为原点炸开或收拢。 |
| [character/FormationScreen/CrewCard](../../src/ui/character/FormationScreen/CrewCard/CrewCard.tsx) | 一张编队卡：整卡取景窗 + 窗内浮动角色名 + 上阵三角旗 + 上阵/下阵动作条（受限时出 `HoverTooltip`）。窗内材质来自 `character/styles/glowCard.module.css`；`data-crew-card` 是回程飞行认领落点的唯一通道。 |
| [character/FormationScreen/formationMorph](../../src/ui/character/FormationScreen/formationMorph/useFormationMorph.ts) | 两态态机 + FLIP 编排：`mode`(roster/detail) × `phase`(idle/toDetail/toRoster)，过场期间两态同时挂载。去程落点是常量 `FIGURE_RECT`，回程落点在卡阵挂载后于 `useLayoutEffect` 里量。时长与设计 px 换算在 `morphChoreo.ts`，飞行副本在 `MorphFlyer.tsx`（WAAPI 动 left/top/width/height，与立绘栏瞬时交接）。 |
| [character/CharacterDetailView](../../src/ui/character/CharacterDetailView/CharacterDetailView.tsx) | 角色详情态（编队页内的第二种态，不是 screen）：左侧 434×772 立绘取景窗，右侧切换「属性装备 / 卡组」两个工作区。属性与装备合并，换装窗借立绘位承载；装备穿戴/卸下与卡组扩充/精简/升级直接落 `townStore`；锻造浮层挂在本态根层。 |
| [character/CharacterDetailView/FigureStage](../../src/ui/character/CharacterDetailView/FigureStage/FigureStage.tsx) | 详情态左栏：76,196,434,772 的立绘取景窗，与 `CrewCard` 共用 `glowCard` 材质；角色名 44px + 三段血条 / 污染 / 怪癖。版面矩形由 `morphChoreo.FIGURE_RECT` 统一下发。 |
| [character/CharacterDetailView/Workbench](../../src/ui/character/CharacterDetailView/Workbench/Workbench.tsx) | 详情态右栏工作区外壳：「属性装备 / 卡组」两个 tab，内容由使用方作为 children 传入；入场是「从左边缘裂开生长」，与卡阵占同一条水平带（y 196..968）。面板为 `ProfilePanel` / `DeckPanel`。 |
| [character/CharacterDetailView/Workbench/ProfilePanel](../../src/ui/character/CharacterDetailView/Workbench/ProfilePanel.tsx) | 属性与装备合并面板：左侧竖排 `EquipmentSlots`，右侧 `StatsPanel`；候选仓库不内嵌，由 `EquipPicker` 覆盖立绘位。 |
| [character/CharacterDetailView/EquipPicker](../../src/ui/character/CharacterDetailView/EquipPicker/EquipPicker.tsx) | 覆盖详情态立绘位的装备候选窗：当前装备、匹配部位仓库、即时穿戴/卸下与悬浮属性对比；候选逐项使用 `HoverTooltip`。 |
| [character/DeckForge](../../src/ui/character/DeckForge/) | 卡组锻造共享外壳域：统一遮罩、`ModalReveal`、宽度与高度形变时序；四种视图共用一块持续挂载的面板盒子。 |
| [character/DeckForge/DeckForgeStack](../../src/ui/character/DeckForge/DeckForgeStack.tsx) | 锻造四视图编排：订阅 `townStore`、计算视图模型、派发锻造 action，统一 busy 闸门、Esc 逐层退出、pendingDraw 续演与子视图回中枢。 |
| [character/DeckForgeHub](../../src/ui/character/DeckForgeHub/DeckForgeHub.tsx) | 卡组锻造中枢内容件：展示扩充、精简、升级三个选项与禁用原因；外壳、遮罩和关闭动作由 `DeckForgeStack` 提供。 |
| 旧 `character/EquipmentDrawer` | 已归档到 `ui/_legacy/character/`，由 `CharacterDetailView/EquipPicker` 取代，零引用。 |
| 旧 `character/DeckForgeBar` | 已归档到 `ui/_legacy/character/`，由 `character/DeckForgeHub` 取代，零引用。 |
| [character/DeckForgeOverlay](../../src/ui/character/DeckForgeOverlay/DeckForgeOverlay.tsx) | 扩充/精简内容件：只负责模式页眉与阶段分发；候选与卡组状态分别保留到提交动画结束，外壳和关闭锁由 `DeckForgeStack` 提供。 |
| [character/DeckForgeOverlay/ForgeDrawStage](../../src/ui/character/DeckForgeOverlay/ForgeDrawStage.tsx) | 扩充三选一阶段机：水晶卡背错峰落位、按稀有度翻牌、光爆震动、二次确认和向 `data-deck-anchor` 落袋飞行。 |
| [character/DeckForgeOverlay/ForgeRemoveStage](../../src/ui/character/DeckForgeOverlay/ForgeRemoveStage.tsx) | 精简卡组阶段：网格选中、最低张数锁定 chip、确认和逆向扫描消解。 |
| [character/DeckForgeOverlay/ForgeRevealCard](../../src/ui/character/DeckForgeOverlay/ForgeRevealCard.tsx) | 扩充与精简共用的卡牌演出包装层：中性水晶卡背翻牌、稀有度光爆辉光、选择描边与消解。 |
| [character/DeckForgeOverlay/forgeChoreo](../../src/ui/character/DeckForgeOverlay/forgeChoreo.ts) | 锻造演出的时长与揭示顺序真相点，按卡牌稀有度安排翻牌节奏、命中冲击与减少动态效果降级。 |
| [character/DeckUpgradeOverlay](../../src/ui/character/DeckUpgradeOverlay/DeckUpgradeOverlay.tsx) | 卡组升级内容件：展示等级徽章、水晶稀有度概率与比例带；长按蓄力和光爆演出由 `useDeckUpgrade` 管理，外壳由 `DeckForgeStack` 提供。 |
| [character/DeckUpgradeOverlay/useDeckUpgrade](../../src/ui/character/DeckUpgradeOverlay/useDeckUpgrade.ts) | 卡组升级 phase、快照、经验 count-up、长按蓄力与演出 CSS 状态的编排 hook；向共享外壳返回状态类和 CSS 变量。 |
| [character/EquipmentSlots](../../src/ui/character/EquipmentSlots/EquipmentSlots.tsx) | 角色详情态属性装备面板的三类装备槽，显示当前装备或空槽并派发部位选择、卸下操作；支持横向 `grid` 与竖向 `rail` 变体，不承载装备规则。 |
| [character/DeckCard](../../src/ui/character/DeckCard/DeckCard.tsx) | 角色详情态与集会卡组列表的交互外壳，负责按钮语义、选中态、焦点态、入场动画和鼠标/键盘事件；卡面统一由 `battle/HandCard` 提供，并通过 `data-deck-card` 固定尺寸缩放。 |
| [character/DeckCardHoverPreview](../../src/ui/character/DeckCardHoverPreview/DeckCardHoverPreview.tsx) | 角色详情态的场景级卡牌悬浮层，放大渲染 `HandCard`；默认落点是自带的坐标，使用方可通过 `className` 挪到本页版面的空档（两栏版面里由 `CharacterDetailView` 挪到立绘右侧）。只负责定位和展示时机，不承载卡牌业务规则。 |
| [explore/ExploreScreen](../../src/ui/explore/ExploreScreen/ExploreScreen.tsx) | 探索主界面：固定设计画布、路由图、节点悬浮浮卡、粒子/光环/负重读数、右下角常驻推进决策按钮、带食品门槛的节点分支、成长与生存事件故事、隐藏休息/NPC、轮次战斗事件面板、背包和撤离。左下队伍区为静态半身立绘卡（复用 `common/CharacterPortrait`），显示三段血量，经验坠入动效挂在角色卡 figure 兄弟节点。状态机判断留在 `explore/session`。画布根挂 `data-explore-stage`。点左下角队伍卡打开 `common/CharacterModal`（远征途中**唯一**可换装处：三个装备槽与背包互换，派发 `runStore.equipFromBackpack` / `unequipToBackpack`，失败复用消耗品的飘字提示）；消耗品选目标模式下点击仍是「用在他身上」。 |
| [battle/BattleScreen](../../src/ui/battle/BattleScreen/BattleScreen.tsx) | 战斗画布、顶端信息条、挑战词条与羁绊信息、战场、底部 HUD、组装部件栏、组装选择器、目标交互、分镜队列和相机；相机按 `focusIds` 取景，敌人攻击我方时聚焦施法者并驱动蓄力预告，`kind: "tempo"` 的拍点帧只在持有者自己身上演 DOT/HOT 特效与飘字、不播前冲；弃牌按触发步骤在命中结算后播放 `DISCARD.total` 对应的 `cardDiscardBurst` 弹出化光，再进入统一卡面亮相，`kind: "reveal"` 只播 `SkillCutInCard` 亮相，无前冲/推镜/受击/音效；挑战状态从逐帧 `BattleState` 读取，胜利后在画布内显示经验、掉落和背包结算面板。 |
| [battle/ChallengeRail](../../src/ui/battle/ChallengeRail/ChallengeRail.tsx) | 战斗左上角的两条随机挑战词条；从 `BattleState` 逐帧读取 `ok` / `breaking` / `broken` 状态，并展示规则、掉落加成与打破结果。 |
| [battle/VictoryPanel](../../src/ui/battle/VictoryPanel/VictoryPanel.tsx) | 黑钢斜切 + 霓虹都市剪影背板的紧凑两列战斗胜利结算壳：队伍经验、掉落来源分区、额外奖励、待拾取战利品、固定格距的 3×8 回收背包及继续/放弃操作；统一阻止未处理奖励离开。 |
| [battle/VictoryPanel/VictoryBackdrop](../../src/ui/battle/VictoryPanel/VictoryBackdrop.tsx) | 胜利结算面板的装饰性霓虹都市背板：分层天际线、地平线光带、窗口光点、塔灯、斜雨丝与浮尘；不参与内容交互，支持揭幕淡入、慢循环光效和减少动态效果降级。 |
| [battle/VictoryPlaque](../../src/ui/battle/VictoryPlaque/VictoryPlaque.tsx) | 胜利结算区域共享铭牌：96px 独立材质铭牌与逐字竖排标题，按额外奖励、战利品、回收背包区分外观。 |
| [battle/VictoryDropSection](../../src/ui/battle/VictoryDropSection/VictoryDropSection.tsx) | 战斗胜利结算的掉落系数通栏分区：展示能量档位与挑战来源 chip，复用 RailPopover 提供键盘可聚焦的详情浮层，并表现已打破挑战的灰显态。 |
| [battle/VictoryExpRow](../../src/ui/battle/VictoryExpRow/VictoryExpRow.tsx) | 单名队员经验结算行：头像、存活/阵亡态、总经验数字、经验条增长和主视觉 `+N EXP` 演出。 |
| [battle/VictoryLootTray](../../src/ui/battle/VictoryLootTray/VictoryLootTray.tsx) | 战斗 pendingLoot 展示与拾取交互：固定八格、固定边长与间距的托盘，逐件或全部拾取，并通过回调触发回收背包的脉冲反馈；模组不直接拾取，改由 `useLootModuleActions` 弹「装载 / 收入背包」菜单。 |
| [battle/VictoryBoonTray](../../src/ui/battle/VictoryBoonTray/VictoryBoonTray.tsx) | 战斗胜利额外奖励托盘：展示治疗露珠、卡牌奖励、随机装备箱和 1 阶模组箱，复用 RailPopover 提供详情，并派发拾取动作。 |
| [battle/VictoryCardOffer](../../src/ui/battle/VictoryCardOffer/VictoryCardOffer.tsx) | 卡牌奖励候选层：按存活角色展示候选卡牌，复用 `HandCard` 卡面，选择后将卡牌加入对应角色卡组。 |
| [battle/victoryChoreo](../../src/ui/battle/victoryChoreo.ts) | 胜利结算面板的统一入场、分区、经验增长与交互反馈时序；`victoryTiming()` 统一下发 reduced-motion 降级参数。 |
| [result/EndScreen](../../src/ui/result/EndScreen/EndScreen.tsx) | 远征结算：通过 `StageCanvas` 编排通关、撤退和团灭三种结果；组合队伍状态、战果统计、带回据点物资与事件回放，支持统计数字和事件逐条入场，团灭保留已投递物资。 |
| [result/EndScreen/endSummary](../../src/ui/result/EndScreen/endSummary.ts) | 远征结算纯视图模型：汇总 `ExpeditionStats`、真实带回物资、废料换金价值、队伍污染和团灭状态；不读 store、不承载结算副作用。 |
| [result/EndScreen/endChoreo](../../src/ui/result/EndScreen/endChoreo.ts) | 结算页统一入场、数字滚动和事件流时序；`endTiming()` 按 reduced-motion 将演出时序归零。 |
| [result/EndScreen/EndPartyRoster](../../src/ui/result/EndScreen/parts/EndPartyRoster.tsx) | 结算页左侧队伍状态：复用 `PartyMemberCard` 展示立绘、血量、污染和阵亡态，按成员错峰入场。 |
| [result/EndScreen/EndTrophyRail](../../src/ui/result/EndScreen/parts/EndTrophyRail.tsx) | 结算页中央战果统计：展示击杀、经验、换金物、积分、节点、轮数、拾取件数和能量消耗，数字使用统一 count-up。 |
| [result/EndScreen/EventDropBand](../../src/ui/result/EndScreen/parts/EventDropBand.tsx) | 结算页右侧斜切事件带：按节点历史正序逐条掉落，超过可见槽位后整体上移，点击或键盘确认可跳过演出。 |
| [result/EndScreen/EndHaulPanel](../../src/ui/result/EndScreen/parts/EndHaulPanel.tsx) | 结算页中央物资回收面板：复用只读 `ItemInventoryPanel` 展示 `shipped` 与 `backpack`，按废料 `sellValue` 汇总换金价值。 |

## 探索域

| 文件 | 作用 |
| --- | --- |
| [RouteBoard](../../src/ui/explore/RouteBoard/RouteBoard.tsx) | SVG 等距路由图。统一由 `sx()` / `sy()` 投影，阶段依次展示生成、封存、桥接揭示、入口选择、走线、落点和路径披露；按 `board.segments.length` 适配固定或随机棋盘，并由 `boardShift()` 将小棋盘在固定面板内居中；隐藏桥接时不能读取引擎求解结果。 |
| [NodeTip](../../src/ui/explore/NodeTip/NodeTip.tsx) | 节点悬浮详情浮卡：贴在被悬停的瓦片旁展示事件标题与描述，落位由 RouteBoard 导出的 `nodeCenter` / `NODE_ICON_TOP` 与棋盘位移算，越界时自动左右贴边或翻到瓦片下方；只讲「这是什么」，不含粒子、风险与选项预览。 |
| [MerchantPanel](../../src/ui/explore/MerchantPanel/MerchantPanel.tsx) | 交易终端内容面板：按服务槽位切 tab，图标化食品报价、持有量和确认操作；商品槽位展示图标货架与详情，随机服务展示 BUFF 概率，队伍/待办服务展示结算说明；只派发购买和关闭 action，不承载交易规则。 |
| [ShopOverlay](../../src/ui/explore/ShopOverlay/ShopOverlay.tsx) | 独立交易浮层：在经济节点选项触发后压在事件面板之上，承载 tab 化 `MerchantPanel` 与本节点摘要；只保留页眉服务摘要和节点记录条，关闭交易直接回到节点决策。 |
| [BackpackPanel](../../src/ui/explore/BackpackPanel/BackpackPanel.tsx) | 探索背包浮层：常规、满包替换、投递口寄件三种模式共用一块面板；容量与开放时机只读取会话结论。 |
| [LootPickup](../../src/ui/explore/LootPickup/LootPickup.tsx) | 事件奖励拾取框：展示 `pendingLoot`，支持逐件飞入背包、全部拾取和放弃剩余物品；飞入副本通过 portal 挂到 `document.body`；模组走 `useLootModuleActions` 的两按钮菜单，可选择直接装载。 |
| [RewardOverlay](../../src/ui/explore/RewardOverlay/RewardOverlay.tsx) | 成长与生存奖励队列面板：处理定向经验、免费角色三选一卡牌、免费删卡、装备候选、羁绊重铸、单体治疗/体力极限/怪癖/污染/污染卡和全队确认；切换净化目标时清空已选卡，`ItemSlot` 保持按钮语义，不包在按钮内。 |
| [ExpDropFx](../../src/ui/explore/ExpDropFx/ExpDropFx.tsx) | 约 2 秒经验坠入飘字。由探索主屏按 `pendingExp` 增量和序号挂载，避免把动画放进带 `overflow: hidden` 的角色立绘容器。 |
| [EnergyLamp](../../src/ui/explore/EnergyLamp/EnergyLamp.tsx) | 能量档位读数 + `common/GlassHourglass` 沙漏（档位色驱动）。 |
| [styles/exploreKit.module.css](../../src/ui/explore/styles/exploreKit.module.css) | 探索域共享的按钮、标签和事件类型色，四个组件各自 `composes`。 |
| [styles/explorePanel.module.css](../../src/ui/explore/styles/explorePanel.module.css) | 探索事件、拾取和奖励面板共享的暗玻璃材质、边框装饰与扫描线；三方各自 `composes`，`ExploreScreen` 通过 `data-explore-dock="stacked"` 与 CSS 变量传递上下错位契约。 |

## 战斗域

| 文件 | 作用 |
| --- | --- |
| [deathChoreo.ts](../../src/ui/battle/deathChoreo.ts) | 战斗死亡表现闸门的时序真相点：按战斗序列、播放倍速和 reduced-motion 管理 drain → vanish → dead，并提供结算等待状态与居合命中偏移。 |
| [unitShell.ts](../../src/ui/battle/unitShell.ts) | **单位外壳的跨组件契约**：敌人（CombatantView）与我方（AllyBar）两种外壳几何不同但演出必须一致，靠 `unitShellAttrs()` 摊出的 `data-side` / `data-death` / `data-dead` / `data-downed` / `data-attacking` / `data-targetable` / `data-telegraph` / `data-react` 共享同一份规则。`data-downed` 表示我方仍存活但 HP 为 0 的濒死态；`data-dead` 只表示闸门放行后的最终死亡态。改这里要全库搜同名字符串——CSS 那侧没有类型保护。 |
| [CombatantView](../../src/ui/battle/CombatantView/CombatantView.tsx) | 敌方单位：蓄力预告、血条周围的倒计时/意图/护盾/状态和命中特效；可选目标头顶显示本次攻击命中率徽章；死亡表现由 `deathChoreo` 闸门下发，先完成血条再过曝消散。站位通过独立 `translate` / `scale` 属性传入，避免覆盖演出 `transform`。内层挂 `data-cmb-stage` 供相机取景。 |
| [EnemySprite](../../src/ui/battle/EnemySprite/EnemySprite.tsx) | 横向拼条待机立绘播放器。`enemyArt.ts` 登记展示框与主体框，主体高度归一后由 CSS 变量推导尺寸、脚线和帧位；`@keyframes` 按敌人 id 运行时注入并复用 `<style>`（不经 Modules，故行内 `animationName` 有效）。 |
| [AllyBar](../../src/ui/battle/AllyBar/AllyBar.tsx) | 底部队伍卡，最多 3 个槽位；归属手牌聚焦时改变槽位宽度，濒死暗红态与死亡灰化、下沉消解、裂纹和 ☠ 由死亡闸门/外壳属性驱动，并通过公共污染条/状态图标展示污染值、临时状态和护盾。位于战场之外，因此不参与相机推近；生病与永久怪癖仅在角色详情态展示。仅在待选友军目标时响应点击，其余状态下为纯展示。 |
| [battle/ManaBar](../../src/ui/battle/ManaBar/ManaBar.tsx) | 战斗底部 HUD 的法力水晶排；按当前法力和每回合上限渲染放大的空/满水晶，悬浮手牌时按卡牌费用激发对应水晶，不显示数字读数。 |
| [battle/SquadBuffBar](../../src/ui/battle/SquadBuffBar/SquadBuffBar.tsx) | 战斗 HUD 的炼金术士组装部件栏：按获得顺序显示 A/B/C/D、当前部件数、组装成功进度和各部件说明；使用 `RailPopover` 展示详情，不承载组装规则。 |
| [battle/SquadBuffPicker](../../src/ui/battle/SquadBuffPicker/SquadBuffPicker.tsx) | 组装选择待选层：展示可选部件、确认与取消，调用 `battleStore` 的 `pickPendingChoice` / `cancelPendingChoice`，不直接修改引擎状态。 |
| [battle/HandTools](../../src/ui/battle/HandTools/HandTools.tsx) | 战斗底部 HUD 的换牌/丢弃/待机操作；待机独立于手牌数量，按回合与动画状态及 `waitsThisRound` 判定可用性。换牌·丢弃采用「模式 + 卡上徽章」交互，徽章挂在 `.hand-slot`（卡自身裁切），模式态经 `[data-hand-tray][data-hand-action]` 下发。 |
| [battle/CardPile](../../src/ui/battle/CardPile/CardPile.tsx) | 零色相蚀刻黑钢卡堆，菱形徽记卡背，抽牌/弃牌/消耗三堆靠凿刻标记与剪影区分。 |
| [battle/PileDrawer](../../src/ui/battle/PileDrawer/PileDrawer.tsx) | 牌堆内容弹窗，按卡名排序展示，复用原尺寸 `HandCard`；悬停时由 `.scrim` 下的独立放大层浮出 1.4 倍卡面；待选择回收时切换为弃牌堆选择模式，点击卡牌提交，关闭弹窗取消。 |
| [HandCard](../../src/ui/battle/HandCard/HandCard.tsx) | 手牌竖卡：生效费用/名称、1:1 配图、定高说明区、污染角标和卡牌标记角标；换牌·丢弃模式下在不裁切的 `.hand-slot` 上显示操作徽章，主动或连带弃牌使用 `discarding` 播放 `DISCARD.total` 对应的 `cardDiscardBurst` 弹出化光，所属角色阵亡后以 `purged` 播碎裂消散并卸载。现同时服务手牌托盘、牌堆弹窗和据点卡组，两套战斗版式锁在 `[data-hand-tray]` / `[data-pile-grid]` 下，据点版式锁在 `[data-deck-card]` 下；弹窗与据点模式（`variant="pile"`）不写 `handFocusStore`。 |
| [CardInfoPanel](../../src/ui/battle/CardInfoPanel/CardInfoPanel.tsx) | 战斗 HUD 右上固定卡牌说明面板，宽高比锁死 1:2，无配图也保留稳定尺寸的占位；显示生效费用、污染卡与卡牌标记说明。 |
| [TickRuler](../../src/ui/battle/TickRuler/TickRuler.tsx) | 顶端信息条的全局时刻标尺；敌人行动标记默认关闭。 |
| [SkillCutInCard](../../src/ui/battle/SkillCutInCard/SkillCutInCard.tsx) | 出牌亮相卡面，挂在场景外，不受相机变换。 |
| [AmbienceLayer](../../src/ui/battle/AmbienceLayer/AmbienceLayer.tsx) | 双 Canvas 粒子和氛围层；两层同时是 3D 纵深层（`translateZ` 写在自己的 module.css，纵深值由 BattleScreen 下发）。隐藏页面暂停 rAF，减少动态效果时不挂载，调色层在场景外。 |
| [fx/HitFxLayer](../../src/ui/battle/fx/HitFxLayer/HitFxLayer.tsx) | 敌我共用命中特效和飘字；以 `hit.seq` 重挂载重播。`hitFxVars()` 返回的是 `UnitReact` 词元而非类名。 |
| [fx/SpriteFx](../../src/ui/battle/fx/SpriteFx/SpriteFx.tsx) | 一次性序列帧播放器。 |
| [fx/IaiSlashFx](../../src/ui/battle/fx/IaiSlashFx/IaiSlashFx.tsx) | `iai-slash` 居合斩程序化特效；`proc.impactMs` 需与 CSS 关键帧同步，`animation-name` 必须留在 CSS 里（理由见 styles.md）。 |
| [fx/BladeSlashFx](../../src/ui/battle/fx/BladeSlashFx/BladeSlashFx.tsx) | `blade-slash` 三拍刀光程序化特效；时间轴以 `proc.impactMs` 为爆点锚，掉血由 `damageAtImpact` 推迟到爆点；固定几何表保证重播稳定，关键帧名留在 CSS Modules 内。 |
| [fx/TriSlashFx](../../src/ui/battle/fx/TriSlashFx/TriSlashFx.tsx) | `tri-slash` 三段斩击 Canvas 特效：几何表在 `triSlashGeometry.ts`（模块加载时算一次，种子固定），时间轴以 `proc.impactMs` 为爆点锚缩放；震屏归相机、白闪归 `screenFx`，不循环、靠 `key={hit.seq}` 重挂载重播。 |
| [fx/BloodSlashFx](../../src/ui/battle/fx/BloodSlashFx/BloodSlashFx.tsx) | `blood-slash` 血色刀光程序化 CSS 特效；固定几何表与 `proc.impactMs` 爆点锚复刻刀身下劈、刀痕张开和血花爆裂，震屏归相机、全屏压暗/双闪归 `screenFx`。 |
| [fx/TripleSlashFx](../../src/ui/battle/fx/TripleSlashFx/TripleSlashFx.tsx) | `triple-strike` 流光·三段斩程序化 CSS 特效；几何表在 `tripleSlashGeometry.ts`（固定种子、模块加载时烘一次），时间轴以 `proc.impactMs` 为爆点锚平移，震屏归相机 `SHOTS.triple`、白闪归 `screenFx: "flash"`；`test/ds` 下另有 demo 副本。 |
| [fx/KeenEdgeFx](../../src/ui/battle/fx/KeenEdgeFx/KeenEdgeFx.tsx) | `keen-edge` 锐利刀锋斩按 `锐利刀锋.wav` 包络编排，由 `KEEN_RATE` 固化 1.4x；几何表在 `keenEdgeGeometry.ts`，音效由 `animSfx` 的 keen-edge 覆盖独占 `keenEdge` 采样；`test/opus` 下另有 1x demo 副本。 |
| [fx/DeathVanishFx](../../src/ui/battle/fx/DeathVanishFx/DeathVanishFx.tsx) | 敌方死亡的附加白光：脚下扩散光环与确定性白色光粒；只在死亡闸门的 vanish 阶段挂载，不承载战斗状态。 |
| [styles/unitBadges.module.css](../../src/ui/battle/styles/unitBadges.module.css) | 敌我共用的阵亡叠层样式。 |
| [animations.ts](../../src/ui/battle/animations.ts) | 战斗分镜、相机、顿帧/震屏、卡牌与招式动画预设；`DISCARD.pop/total` 与 `HandCard.module.css` 的 `cardDiscardBurst` 共用弃牌弹出化光时序。调演出节奏优先改这里；死亡闸门时序另见 `deathChoreo.ts`。 |
| [ambience.ts](../../src/ui/battle/ambience.ts) | 按地图登记粒子发射器、灯光闪烁和屏幕调色。 |
| [handFocusStore.ts](../../src/ui/battle/handFocusStore.ts) | 手牌悬停/聚焦状态，独立于 BattleScreen，避免鼠标状态和战斗状态互相污染。 |

## 公共组件（`common/`）

| 文件 | 作用 |
| --- | --- |
| [cx.ts](../../src/ui/common/cx.ts) | 全项目唯一的 className 拼接工具。 |
| [BorderGlow](../../src/ui/common/BorderGlow/BorderGlow.tsx) | 可跟随指针的边缘光卡壳：`scaleMode` 控制设计像素缩放或屏幕像素恒定补偿，`fill` 让内容层铺满并裁切，`data-glow-layer` 提供 `edge` 与 `inner` 两个跨模块样式钩子；缩放由组件自行测量，不依赖调用方传递画布变量。 |
| [CardBack](../../src/ui/common/CardBack/CardBack.tsx) | 从扩充卡组抽出的水晶卡背公共组件，由 `ForgeRevealCard` 与博物馆卡牌展厅共用。 |
| [cardText.ts](../../src/ui/common/cardText.ts) | 从战斗实时属性或城镇派生面板属性读取卡牌施放者的攻击力/治愈力，并渲染卡牌说明数值。 |
| [CardTextRich](../../src/ui/common/CardTextRich/CardTextRich.tsx) | 将卡牌说明按引擎词条登记表分段，统一高亮汇星、应星、瀑布等特殊词条。 |
| [CardKeywordNotes](../../src/ui/common/CardKeywordNotes/CardKeywordNotes.tsx) | 按卡牌说明中实际出现的词条展示紧凑释义列表；无词条时不渲染。 |
| [PanelShell](../../src/ui/common/PanelShell/PanelShell.tsx) | 功能弹窗通用外壳：模态遮罩、切角面板、边框装饰层与 `EventPanelFrame` 收口，导出关闭动画时长与默认面板尺寸（1600×920，可用 `size` 覆盖）。原为装配舱私有件，现由装配舱、制造弹窗与角色档案 Modal 共用；可选形变模式支持入口砖 → 面板的三段形变、种子态与遮罩跟随淡入；配色只靠外层覆盖 `--asm-*` 变量，场景未下发时吃组件自带的青蓝默认值，层序由调用方经 `className` 压。 |
| [common/panelMorph](../../src/ui/common/panelMorph/usePanelMorph.ts) | 从冬眠仓提升的公共入口砖形变引擎：按设计 px 执行三段开窗与倒放关窗，统一处理种子态时机、入口隐藏、Esc、动画完成兜底；冬眠仓与物资中转仓共用。 |
| [CharacterModal](../../src/ui/common/CharacterModal/CharacterModal.tsx) | 角色档案 Modal：立绘/三段血量/污染/怪癖、只读属性表（分组来自 `common/statGroups.ts`）、中列装备三槽与右列只读卡组平铺（`HandCard`）。不读 store、不含规则，全部靠 props 与回调；传 `swap` 即可点击装备槽打开画布内候选浮层并与容器互换，默认装备区只读；可按调用方需要传入临时状态与护盾。装备槽不写部位文字（部位只留在 `aria-label` 与悬浮 Tooltip），槽位 176×176 并常驻挂 `InteractiveHint` 四角悬浮提示。 |
| [statGroups.ts](../../src/ui/common/statGroups.ts) | 面板属性的分组、文案与条长 `ref` 旋钮，角色详情态与角色档案 Modal 共用的唯一真相点；`ref` 是纯展示旋钮，不参与任何结算。 |
| [InteractiveHint](../../src/ui/common/InteractiveHint/InteractiveHint.tsx) | 全站统一的交互提示：悬浮时在宿主容器**外侧**四角浮出直角 L 型天蓝呼吸边框，也可由 `active` 直接点亮来表达「已选中」。纯装饰层（`aria-hidden` + `pointer-events: none`），零 JS；悬浮显隐由自己的 CSS 读取宿主 `:hover` / `:focus-visible` / `:focus-within`。宿主三条硬要求：`position: relative`、挂 `data-interactive-hint`、自身不能 `overflow: hidden`；几何与配色经 `--ihint-offset` / `--ihint-size` / `--ihint-thickness` / `--ihint-neon` 下发。 |
| [ModalReveal](../../src/ui/common/ModalReveal/ModalReveal.tsx) | 横线上下展开的弹窗裁切层与关闭延迟 hook；通过 CSS 变量统一入场、收回时长和减少动态效果降级。 |
| [EventPanel](../../src/ui/common/EventPanel/EventPanel.tsx) | Luna 风格的数据驱动事件面板公共壳与情报、行动、结算三段分镜；探索弹窗与 Luna 测试页共用，面板内容样式独立于探索外层材质。 |
| [GlassHourglass](../../src/ui/common/GlassHourglass/GlassHourglass.tsx) | `html-templates/沙漏.html` 的 2D Canvas 复刻，包含玻璃轮廓 LUT、沙堆/漏斗、沙流、悬浮粒子和黄铜端盖，支持颜色/强度/暂停与减弱动态效果降级；旧 `GlassLantern` 已移入 `_legacy`。 |
| [CharacterPortrait](../../src/ui/common/CharacterPortrait/CharacterPortrait.tsx) | 角色立绘查表，缺素材时回退 emoji。**取景一律由调用方通过 `className` 传入**，组件不认识任何调用者；立绘统一为 1152×2048 / 9:16 / 透明底 / 左右对称，逐人 `--portrait-dx/dy`、`--bust-scale` 默认归零，仅作异常构图的补偿位。编队页取景走独立的 `formation.dx/dy`（下发为 `--fm-portrait-dx/dy`），未填写时回退通用 `dx/dy`。 |
| [HpBar](../../src/ui/common/HpBar/HpBar.tsx) | 敌人和我方共用血条；按剩余血量分三档，流光、端头辉光和掉血火花保持固定池。`flush` 变体（队伍卡贴底）和 `hideLimit` 变体（战场敌人只显示蓝色当前血量，不画琥珀上限段）的样式也在本组件内。 |
| [PollutionMeter](../../src/ui/common/PollutionMeter/PollutionMeter.tsx) | 跨战斗队伍槽与角色详情复用的污染值进度条；只负责展示，不修改状态。 |
| [QuirkPips](../../src/ui/common/QuirkPips/QuirkPips.tsx) | 角色详情态展示生病与永久怪癖徽章及说明；不服务战斗队伍卡，也不复用临时战斗 `StatusPips`。 |
| [StatusPips](../../src/ui/common/StatusPips/StatusPips.tsx) | 战斗临时状态、层数与护盾的方形玻璃图标条；支持右起换行和 `RailPopover` 详情，尺寸通过 `--pip-box` 变量由父级下发。关闭详情时保留原生 `title`。 |
| [RailPopover](../../src/ui/common/RailPopover/RailPopover.tsx) | 跨战斗域复用的斜切角玻璃详情浮层；支持左右、下方和上方（居中 / 右对齐）定位，由 `data-rail-item` 的悬浮与键盘聚焦驱动。 |
| [ManaCrystal](../../src/ui/common/ManaCrystal/ManaCrystal.tsx) | 法力水晶菱形（Arcane Diamond）；`empty`/`normal`/`active` 三态受控，`still` 关闭呼吸循环；尺寸与配色经 `--mana-crystal-size` / `--crystal-*` 变量下发。 |
| [ArcanaIcon](../../src/ui/common/ArcanaIcon/ArcanaIcon.tsx) | 羁绊塔罗图标公共展示组件；支持完整档案壳、无壳图案和 bare 纯线稿模式，未知 id 回退中性环徽。 |
| [BuffIcon](../../src/ui/common/BuffIcon/CultivationEmblem.tsx) | 培育两态 BUFF 图标（厚涂拟物，viewBox 128×128、自带 1:1 圆角外框）；配色内建不吃外层 color，尺寸由调用方槽位决定。 |
| [BondSlot](../../src/ui/common/BondSlot/BondSlot.tsx) | 羁绊槽位公共展示组件：点数、名称、3/6/9 门槛条与 `RailPopover` 详情浮层；战斗页 `BondRail` 专用，编队/详情页走 `BondShowcase`；不读 store、不承载羁绊规则。 |
| [BondShowcase](../../src/ui/common/BondShowcase/BondShowcase.tsx) | 编队页(含角色详情态)的巨型羁绊图标展示：96px 图标、点数角标、档位微标与 `RailPopover` 详情浮层；不读 store、不承载羁绊规则。 |
| [BondTooltip](../../src/ui/common/BondTooltip/BondTooltip.tsx) | 羁绊详情浮层内部内容：名称、主题描述、各档位效果与未激活时的差距提示。 |
| [BondIcon](../../src/ui/common/BondIcon/BondIcon.tsx) | 兼容旧调用点的羁绊图标适配器，转发到 `ArcanaIcon` 的 bare 模式。 |
| [item/ItemSlot](../../src/ui/common/item/ItemSlot/ItemSlot.tsx) | 背包、仓库、战后小结和远征结算共用的物品格；五档稀有度只由局部变量 `--rr`/`--rg` 驱动，并导出排布所需的 `EmptySlot`。 |
| [art/moduleGlyphs](../../src/ui/art/moduleGlyphs.tsx) | 成品模组的专属徽记：`MODULE_THEMES` 三档配色（hue/deep/ink）+ 每件模组一套分层 SVG，由 `itemArt.itemIcon` 在模组类别上优先命中；未登记的模组回落到通用 ModuleIcon。设计逻辑与小队徽章 `badgeGlyphs` 一致。 |
| [item/ModuleInstall](../../src/ui/common/item/ModuleInstall/) | 待拾取模组的「装载 / 拾取」接线：`useLootModuleActions` 判定物品是不是模组并托管弹窗状态（拾取动作由调用方传入，战利品盘与拾取框各接一次）；`ModuleSlotActions` 是贴在格子上下边框的两个悬浮按钮（悬停淡入，父格需 `position: relative`）；`ModuleInstallDialog` 是原地装配弹窗，只列本趟远征的出战队员，装配走 `exploreStore.installLootModule`。 |
| [art/moduleGlyphsGenericT1](../../src/ui/art/moduleGlyphsGenericT1.tsx) | 1 阶通用模组的徽记与配色，按「改的是哪一项」分色；由 `moduleGlyphs` 合并进主表，清单加长时主表不膨胀。 |
| [item/ItemDetail](../../src/ui/common/item/ItemDetail/ItemDetail.tsx) | 物品名称、稀有度、类别、占格、描述、属性和售价；模组另有独立的「装配条件」字段，文案读 `data/cardModules` 的 `equipText`。操作按钮由调用方通过 children 注入。导出 `STAT_LABEL` 供商店复用文案口径。 |
| [item/ItemTooltip](../../src/ui/common/item/ItemTooltip/ItemTooltip.tsx) | 物品详情悬浮层：`tooltipPointFromElement` 把触发元素归一化成「所属画布 + 设计 px 锚点」，`useTooltipPlacement` 实测浮层真实尺寸后在画布边界内翻转夹取，浮层 portal 进画布内部。换皮版浮卡（商店仓库、出击背包）共用这两个导出，不要再抄一份定位算法。 |
| [item/ItemCostTag](../../src/ui/common/item/ItemCostTag/ItemCostTag.tsx) | 图标化食品报价标签：展示价格、背包持有量与缺货红框，复用 `ItemTooltip` 提供无原生 `title` 的物品详情悬浮。 |
| [item/ItemTabs](../../src/ui/common/item/ItemTabs/ItemTabs.tsx) | 物品一级/二级分类 tab；稀有度颜色留给格子，不给 tab 叠色。 |
| [item/itemFilters.ts](../../src/ui/common/item/itemFilters.ts) | 物品分类定义、匹配和计数纯函数。 |
| [item/ItemInventoryPanel](../../src/ui/common/item/ItemInventoryPanel/ItemInventoryPanel.tsx) | 背包、仓库等物品容器共用的面板壳，提供格网、容量读数、受控选中态和 portal 物品详情。传 `slotHint` 才给**有物品**的格子挂 `InteractiveHint` 四角提示（空格不给），默认关闭，现只有探索背包 `BackpackBar` 在可编辑阶段打开。 |

公共组件一律接受 `className`（铁律 3）——那是父组件唯一能改子组件外观的通道。

## 素材查表（`art/`）与 hooks

| 文件 | 作用 |
| --- | --- |
| [art/cardArt.ts](../../src/ui/art/cardArt.ts) | 战斗卡 id → 卡面配图。 |
| [art/enemyArt.ts](../../src/ui/art/enemyArt.ts) | 敌人 id → 待机拼条、`sheet/view/body` 源图几何和 idle 参数，含预热；展示框保留素材构图，主体框只用于高度归一与脚线定位，不再产出 `-cut` 中间图。 |
| [art/battleBg.ts](../../src/ui/art/battleBg.ts) | 地图 id → 战斗背景静态图与预热。 |
| [art/mapArt.ts](../../src/ui/art/mapArt.ts) | 地图 id → 选层预览素材；与战斗背景表分离。 |
| [art/eventArt.ts](../../src/ui/art/eventArt.ts) | 探索事件素材查表。 |
| [art/vfxSprites.ts](../../src/ui/art/vfxSprites.ts) | 命中特效序列帧 URL 列表和预热。 |
| [art/sceneArt.ts](../../src/ui/art/sceneArt.ts) | 菜单、大厅、设施和商店直接使用的场景/界面素材登记。 |
| [audio/bgmPlayer.ts](../../src/ui/audio/bgmPlayer.ts) | 模块级 BGM 单例播放器：据点/战斗双轨交叉淡变、据点续播与自动播放解锁。 |
| [audio/bgmTracks.ts](../../src/ui/audio/bgmTracks.ts) | BGM 曲目资源查表与界面到曲目的映射；只有战斗界面使用战斗曲，电梯场景返回 null 表示停播。 |
| [audio/sfx/sfxTypes.ts](../../src/ui/audio/sfx/sfxTypes.ts) | 音效 ID、配方层和播放参数类型。 |
| [audio/sfx/sfxSamples.ts](../../src/ui/audio/sfx/sfxSamples.ts) | 真实音效采样查表、变体选择、解码缓存和预热播放。 |
| [audio/sfx/sfxSynth.ts](../../src/ui/audio/sfx/sfxSynth.ts) | Web Audio 合成原语：音调、噪声、扫频与颗粒串；不包含具体音效语义。 |
| [audio/sfx/sfxRecipes.ts](../../src/ui/audio/sfx/sfxRecipes.ts) | 合成兜底音效配方与音色参数的唯一调音入口。 |
| [audio/sfx/sfxPlayer.ts](../../src/ui/audio/sfx/sfxPlayer.ts) | 采样优先、合成兜底的播放器；负责懒创建 AudioContext、总线压缩、音效开关持久化、自动解锁、节流和并发控制。 |
| [audio/sfx/sfxDelegate.ts](../../src/ui/audio/sfx/sfxDelegate.ts) | 全局交互元素事件委托：悬浮、点击、禁用态与 data-sfx 覆盖。 |
| [audio/sfx/index.ts](../../src/ui/audio/sfx/index.ts) | 程序化音效公共出口。 |
| [art/rarityArt.ts](../../src/ui/art/rarityArt.ts) | 普通、罕见、稀有水晶素材查表及预热源列表。 |
| [art/assetLoader.ts](../../src/ui/art/assetLoader.ts) | 可复用的低优先级图片下载/解码与视频首帧预加载器；按 URL 去重，并限制图片并发以避免抢占交互资源。 |
| [art/assetPreloader.ts](../../src/ui/art/assetPreloader.ts) | 游戏启动时的实际美术资源清单、去重、进度和失败收口；不扫描未引用的 `assets` 文件。 |
| [art/itemArt.tsx](../../src/ui/art/itemArt.tsx) | 物品图标（内联 SVG 或 `<img>`）；SVG 全用 `stroke="currentColor"`，颜色吃父级 `--rr`。 |
| [hooks/useGameAssetPreload.ts](../../src/ui/hooks/useGameAssetPreload.ts) | 将启动预加载状态接入 React 外部 store；主菜单等待所有资源任务 settle 后开放入口。 |
| [hooks/useBgm.ts](../../src/ui/hooks/useBgm.ts) | 订阅 `runStore.screen` 并驱动据点/战斗 BGM 切换；电梯场景返回 null 表示停播；测试页可关闭。 |
| [hooks/useSfx.ts](../../src/ui/hooks/useSfx.ts) | 安装全局音效委托并订阅独立音效开关；测试页可关闭。 |
| [hooks/stage.ts](../../src/ui/hooks/stage.ts) | 1920×1080 设计画布的等比 letterbox 缩放、设备像素量化与 DPR 监听；另提供 `stageHostOf`、`designScaleOf` 与 `designRectOf`（把画布内元素的 `getBoundingClientRect()` 归一化回设计 px）。画布内不使用 `vw` / `vh` 或窗口断点。 |
| [hooks/useCountUp.ts](../../src/ui/hooks/useCountUp.ts) | rAF 数值滚动；起点走 ref，减少动态效果下直接使用终值。 |
| [hooks/useChangePulse.ts](../../src/ui/hooks/useChangePulse.ts) | 认出「同一个 key 的数值变了」并短暂高亮。物品**新进来**由格子重挂载的 CSS 动画负责，这个 hook 只管 uid 不变、`count` 改数的那种；新出现的 key 刻意不算变化，否则两边都闪会重影。 |
| [hooks/useIdleTwitch.ts](../../src/ui/hooks/useIdleTwitch.ts) | 低频随机敌人待机小动作，只存在于 UI 局部状态。 |
| [hooks/useTypewriter.ts](../../src/ui/hooks/useTypewriter.ts) | 探索事件文本逐字演出。 |

## 过场与共享元素

| 文件 | 作用 |
| --- | --- |
| [app/transitions.ts](../../src/ui/app/transitions.ts) | 过场预设、默认时长、按界面/路线解析；探索到战斗的裂纹涟漪时长只在这里配置。 |
| [app/transitionOrigin.ts](../../src/ui/app/transitionOrigin.ts) | 一次性缓存点击坐标，仅用于视觉过场，不进入 Zustand。 |
| [character/FormationScreen/formationMorph/morphChoreo.ts](../../src/ui/character/FormationScreen/formationMorph/morphChoreo.ts) | 编队 ↔ 角色详情的重组时长与立绘出血矩形；`designRectOf` 从 `hooks/stage` 转发，避免编队域私有实现被其他域依赖。⚠ 这两态**不再是两个 screen**，故不走 `transitions.ts`；旧的 `app/viewTransition.global.css` 与 `character/sharedPortrait.ts` 已随那次改版删除。 |
| [town/facilityScenes.ts](../../src/ui/town/facilityScenes.ts) | 据点进设施的推镜时序、飞出参数与设施背景图。 |

## 战斗设计画布与相机边界

全站页面画布恒为 1920×1080，由 `StageCanvas` 以 `k = min(容器宽/1920, 容器高/1080)` 等比缩放并通过布局居中的 `zoom` 缩放，超出部分留黑边；可用尺寸会向下吸附到整数设备像素倍数，显示器 DPR 变化会触发重测。战斗舞台和底部 HUD 是兄弟矩形；`--hud-h` 直接决定敌人可见地面线，调整前必须复核站位。

战斗世界使用一个相机：背景、氛围和单位都在 `.battle-world` 内一起变换。`transform` 负责空闲漂移，独立 `translate` 负责震屏，独立 `scale` 负责冲击缩放；不要让背景和单位分别套变换。相机全程使用设计 px，`getBoundingClientRect()` 得到屏幕 px 时先经换算；相机反投影则通过世界层矩形抵消画布缩放、当前相机和漂移。分镜计划用 `focusIds` 表示取景对象，受击特效仍使用 `targetIds`；敌人攻击战场外的我方时回退聚焦施法敌人。

⚠ 相机取景要量的是含体型 `scale` 的那一层，`querySelector` 认的是 `[data-cmb-stage]` 而**不是**类名——类名已被 CSS Modules 哈希，写死字符串会静默退回外层布局盒，取景悄悄出错。

我方队伍卡在战场世界之外，因此不参与取景；玩家攻击自身或友军时保持全景，只播放特效和震屏，敌人攻击我方则聚焦施法敌人并播放蓄力预告。调色层、HUD 和过场幕布是镜头/界面层，不应跟着场景相机移动。
