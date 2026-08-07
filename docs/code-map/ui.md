| [TechCard](../../src/ui/common/TechCard/TechCard.tsx) | 白色科技风静态卡牌展示框，卡面比例为 320:496、插画区为 1:1、卡名位于插画下方的装饰名条中、费用球贴左上角，支持普通 / 速攻两套配色，尺寸随容器等比自适应，可省略底部统计栏。 |
# React 视图层

路径：`src/ui/`。组件只负责展示、交互和派发 action，不承载战斗、探索、物品或养成规则。图片素材只通过 `art/` 的查表引用，`data/` 不直接引用素材路径。

样式约定（CSS Modules、五条铁律、`data-*` 跨模块契约）见 [styles.md](styles.md)，本文件不重复。

## 目录结构

```text
src/ui/
├─ app/          过场编排（App.tsx 的直接依赖）
├─ common/       跨域复用的组件与 cx.ts
├─ menu/         主菜单
├─ town/         据点大厅与设施场景
├─ character/    编队 / 角色详情 / 单卡视图
├─ sortie/       出击地图选择与物资准备
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
| [menu/MenuScreen](../../src/ui/menu/MenuScreen/MenuScreen.tsx) | 主菜单开屏。与战斗共用 1920×1080 设计画布，视频铺底，标题和开始按钮用设计 px 定位。 |
| [town/TownScreen](../../src/ui/town/TownScreen/TownScreen.tsx) | 据点大厅和设施入口。用 bento 砖块表达设施面积；设施内容通过 `FACILITY_CONTENT` 登记表挂载，内容和返回按钮延迟到离场阶段再卸载。状态条的生存天数订阅 `townStore.day`。画布根挂 `data-town-stage`，四个设施的 hover/active 规则靠它提特异性。 |
| [town/terminal/ControlTerminalScene](../../src/ui/town/terminal/ControlTerminalScene/ControlTerminalScene.tsx) | 控制终端：城市维护工单委托占位。抽屉入口和浮层均在据点画布内完成，不新增路由；出击已迁移到大厅一级入口。 |
| [town/cryo/CryoScene](../../src/ui/town/cryo/CryoScene/CryoScene.tsx) | 冬眠仓：编队、队员档案和唤醒浮层；属性面板、卡组、舱位状态和角色切换演出都在这里。 |
| [town/storage/StorageScene](../../src/ui/town/storage/StorageScene/StorageScene.tsx) | 物资中转仓：库存、三槽装备和回收台；穿戴后通过 `deriveStats` 现算面板，出售后清理失效勾选。 |
| [town/shop/ShopScene](../../src/ui/town/shop/ShopScene/ShopScene.tsx) | 商店：常驻货架面板 + 装备/材料 tab，支持采购与花积分刷新；右上入口受控打开可复用的 `WarehousePanel`。货架状态与隔日重置都在 `townStore`，本组件只读状态派发 action。私有子组件 `ShopItemTile`（货架格）与 `ShopItemCard`（详情栏）各自持有样式，不再由 ShopScene 远程改写。 |
| [town/shop/WarehousePanel](../../src/ui/town/shop/WarehousePanel/WarehousePanel.tsx) | 商店视觉语言下的可复用仓库面板：直接读取 `townStore.storage`，默认 4×6 格、分类 tab、滚动网格和鼠标右侧物品详情；通过受控 `open/onClose` 与 `rows` / `columns` / `position` 配置复用。 |
| [sortie/SortieScreen](../../src/ui/sortie/SortieScreen/SortieScreen.tsx) | 出击全屏页：固定 1920×1080 舞台，共享当前地图背景与地图 HUD，固定底部导航，并在地图选择和物资准备之间切换；取消时回滚本次购买与仓库取物。 |
| [sortie/SortieBackdrop](../../src/ui/sortie/SortieBackdrop/SortieBackdrop.tsx) | 出击流程共享背景：按地图选择播放上下推移背景动画；目标层信息只在地图步骤挂载，并随步骤切换自然卸载。 |
| [sortie/SortieStepViewport](../../src/ui/sortie/SortieStepViewport/SortieStepViewport.tsx) | 出击步骤视口：挂载当前步骤，并在离场动画完成前暂留物资准备侧栏面板；步骤时序由 `sortieStepTransition.ts` 编排。 |
| [sortie/sortieStepTransition.ts](../../src/ui/sortie/sortieStepTransition.ts) | 出击地图选择 ↔ 物资准备的真实 DOM 步骤动画 hook；同步切换唯一可见步骤，提供 460ms 入场状态和过场交互锁。 |
| [sortie/SortieNav](../../src/ui/sortie/SortieNav/SortieNav.tsx) | 出击流程共享底部导航：根据当前步骤派发返回、确认目标层或开始远征，并在过场期间禁用操作。 |
| [sortie/MapSelectStep](../../src/ui/sortie/MapSelectStep/MapSelectStep.tsx) | 地图选择步骤：在斜跨玻璃选择带中切换目标层；地图信息由共享背景 HUD 展示，无队伍时由固定导航禁止确认目标层。 |
| [sortie/PrepStep](../../src/ui/sortie/PrepStep/PrepStep.tsx) | 物资准备步骤：左侧斜切货柜带，右侧一上一下紧贴格网的仓库与背包；只向子组件下发位置类和交互状态。 |
| [sortie/StockBand](../../src/ui/sortie/StockBand/StockBand.tsx) | 出击货柜斜切滚动带：固定清单、不限量购买消耗品，支持滚轮/方向键滚动与高亮片二次点击购买；步骤切换时由真实 DOM 动画滑入，避免玻璃快照参与过场。 |
| [sortie/StorageInventory](../../src/ui/sortie/StorageInventory/StorageInventory.tsx) | 出击准备中的仓库消耗品取物壳，复用公共物品面板的悬停详情与容量读数；1×4 格，配色经 [sortie/styles/inventoryPalettes.ts](../../src/ui/sortie/styles/inventoryPalettes.ts) 的 `colorMap` 与背包区分。 |
| [sortie/styles/inventoryPalettes.ts](../../src/ui/sortie/styles/inventoryPalettes.ts) | 出击域两块物品面板的调色板真相点：仓库冷银白透玻璃 / 背包黑玻璃熔橙。 |
| [sortie/styles/sortieGlass.module.css](../../src/ui/sortie/styles/sortieGlass.module.css) | 出击域共享的白玻璃面板材质与共享排版，四方 `composes`；材质真相点见 [styles.md](styles.md)。 |
| [character/FormationScreen](../../src/ui/character/FormationScreen/FormationScreen.tsx) | 编队视图，复用角色立绘和卡组显示。 |
| [character/CharacterDetailScreen](../../src/ui/character/CharacterDetailScreen/CharacterDetailScreen.tsx) | 角色详情视图：展示立绘、污染值、生病和永久怪癖；中央属性区顶部放置三类装备槽，点击部位后右侧切换对应仓库并即时穿戴/卸下；属性仍为只读，个人卡组提供扩充、精简、升级锻造和卡面选中详情，升级改为面板确认并播放等级演出。与编队页之间是共享元素过场。 |
| [character/DeckForgeBar](../../src/ui/character/DeckForgeBar/DeckForgeBar.tsx) | 角色详情页卡组锻造操作条：展示扩充、精简、升级三项操作及父组件传入的经验价格和禁用态；升级入口只在满级时禁用，经验校验下沉到升级面板。 |
| [character/DeckForgeOverlay](../../src/ui/character/DeckForgeOverlay/DeckForgeOverlay.tsx) | 角色详情页卡组锻造浮层：承载持久化候选的三选一扩充、卡组指定删除、遮罩/关闭和删除二次确认。 |
| [character/DeckUpgradeOverlay](../../src/ui/character/DeckUpgradeOverlay/DeckUpgradeOverlay.tsx) | 角色详情页卡组升级浮层：展示等级、经验和卡池概率对比；确认后冻结读数并播放充满经验条、等级升级与结算演出。 |
| [character/EquipmentSlots](../../src/ui/character/EquipmentSlots/EquipmentSlots.tsx) | 角色详情页的三类装备槽，显示当前装备或空槽并派发部位选择、卸下操作；不承载装备规则。 |
| [character/EquipmentDrawer](../../src/ui/character/EquipmentDrawer/EquipmentDrawer.tsx) | 角色详情页右侧部位仓库，只展示匹配槽位的装备，点击物品立即穿戴，并展示当前装备详情。 |
| [character/DeckCard](../../src/ui/character/DeckCard/DeckCard.tsx) | 角色详情页列表卡的交互外壳，负责按钮语义、选中态、焦点态、入场动画和鼠标/键盘事件；卡面视觉由公共 `TechCard` 提供。 |
| [character/DeckCardHoverPreview](../../src/ui/character/DeckCardHoverPreview/DeckCardHoverPreview.tsx) | 角色详情页场景级卡牌悬浮层，固定在卡组左侧空档并放大渲染 `common/TechCard`；只负责定位和展示时机，不承载卡牌业务规则。 |
| [character/CardView](../../src/ui/character/CardView/CardView.tsx) | 编队/抽卡界面的单卡视图，展示费用、标签、归属、描述和选择状态。 |
| [explore/ExploreScreen](../../src/ui/explore/ExploreScreen/ExploreScreen.tsx) | 探索主界面：固定设计画布、路由图、节点悬浮浮卡、粒子/光环/负重读数、右下角常驻推进决策按钮、带食品门槛的节点分支、成长与生存事件故事、隐藏休息/NPC、战斗签入口、背包和撤离。左下队伍区为静态半身立绘卡（复用 `common/CharacterPortrait`），显示三段血量，经验坠入动效挂在角色卡 figure 兄弟节点。状态机判断留在 `explore/session`。画布根挂 `data-explore-stage`。 |
| [battle/BattleScreen](../../src/ui/battle/BattleScreen/BattleScreen.tsx) | 战斗画布、顶端信息条、战场、底部 HUD、目标交互、分镜队列和相机。手牌上限读取 `partyHandLimit`，敌人目标不做仇恨高亮。 |
| [result/ExpRewardScreen](../../src/ui/result/ExpRewardScreen/ExpRewardScreen.tsx) | 战后小结：实物掉落、角色经验入账、净化粒子档位和返回牌桌/结算操作。战斗胜利不直接产生居民积分。 |
| [result/EndScreen](../../src/ui/result/EndScreen/EndScreen.tsx) | 远征结算：通关、撤退和团灭共用；展示积分、带回据点的 `shipped`/`backpack` 实物和角色卡组。 |

## 探索域

| 文件 | 作用 |
| --- | --- |
| [RouteBoard](../../src/ui/explore/RouteBoard/RouteBoard.tsx) | SVG 等距路由图。统一由 `sx()` / `sy()` 投影，阶段依次展示生成、封存、桥接揭示、入口选择、走线、落点和路径披露；隐藏桥接时不能读取引擎求解结果。 |
| [NodeTip](../../src/ui/explore/NodeTip/NodeTip.tsx) | 节点悬浮详情浮卡：贴在被悬停的瓦片旁展示事件标题与描述，落位由 RouteBoard 导出的 `nodeCenter` / `NODE_ICON_TOP` 算，越界时自动左右贴边或翻到瓦片下方；只讲「这是什么」，不含粒子、风险与选项预览。 |
| [SlotReels](../../src/ui/explore/SlotReels/SlotReels.tsx) | 战斗签老虎机：全屏三列卡带和停止摇杆，使用独立舞台，不复用普通探索浮层。 |
| [BackpackPanel](../../src/ui/explore/BackpackPanel/BackpackPanel.tsx) | 探索背包浮层：常规、满包替换、投递口寄件三种模式共用一块面板；容量与开放时机只读取会话结论。 |
| [LootPickup](../../src/ui/explore/LootPickup/LootPickup.tsx) | 事件奖励拾取框：展示 `pendingLoot`，支持逐件飞入背包、全部拾取和放弃剩余物品；飞入副本通过 portal 挂到 `document.body`。 |
| [RewardOverlay](../../src/ui/explore/RewardOverlay/RewardOverlay.tsx) | 成长与生存奖励队列面板：处理定向经验、免费角色三选一卡牌、免费删卡、装备候选、羁绊重铸、单体治疗/体力极限/怪癖/污染/污染卡和全队确认；切换净化目标时清空已选卡，`ItemSlot` 保持按钮语义，不包在按钮内。 |
| [ExpDropFx](../../src/ui/explore/ExpDropFx/ExpDropFx.tsx) | 约 2 秒经验坠入飘字。由探索主屏按 `pendingExp` 增量和序号挂载，避免把动画放进带 `overflow: hidden` 的角色立绘容器。 |
| [EnergyMeter](../../src/ui/explore/EnergyMeter/EnergyMeter.tsx) | 能量档位读数。 |
| [styles/exploreKit.module.css](../../src/ui/explore/styles/exploreKit.module.css) | 探索域共享的按钮、标签和事件类型色，四个组件各自 `composes`。 |
| [styles/explorePanel.module.css](../../src/ui/explore/styles/explorePanel.module.css) | 探索事件、拾取和奖励面板共享的暗玻璃材质、边框装饰与扫描线；三方各自 `composes`，`ExploreScreen` 通过 `data-explore-dock="stacked"` 与 CSS 变量传递上下错位契约。 |

## 战斗域

| 文件 | 作用 |
| --- | --- |
| [unitShell.ts](../../src/ui/battle/unitShell.ts) | **单位外壳的跨组件契约**：敌人（CombatantView）与我方（AllyBar）两种外壳几何不同但演出必须一致，靠 `unitShellAttrs()` 摊出的 `data-side` / `data-dead` / `data-attacking` / `data-targetable` / `data-react` 共享同一份规则。改这里要全库搜同名字符串——CSS 那侧没有类型保护。 |
| [CombatantView](../../src/ui/battle/CombatantView/CombatantView.tsx) | 敌方单位：倒计时、意图、立绘、血条、护盾/状态和命中特效；站位通过独立 `translate` / `scale` 属性传入，避免覆盖演出 `transform`。内层挂 `data-cmb-stage` 供相机取景。 |
| [EnemySprite](../../src/ui/battle/EnemySprite/EnemySprite.tsx) | 横向拼条待机立绘播放器。`@keyframes` 按敌人在运行时注入 `<style>`（不经 Modules，故行内 `animationName` 有效）。 |
| [AllyBar](../../src/ui/battle/AllyBar/AllyBar.tsx) | 底部队伍卡，最多 3 个槽位；归属手牌聚焦时改变槽位宽度，并通过公共污染条/状态徽章展示污染值、生病和怪癖。位于战场之外，因此不参与相机推近。 |
| [HandCard](../../src/ui/battle/HandCard/HandCard.tsx) | 手牌竖卡：费用/名称、1:1 配图、定高说明区和污染卡固定角标。**卡在托盘里的版式与厚度也归本文件**，尺寸变量由 BattleScreen 下发。离场清理依赖 `transform` 过渡事件，不要换成其他属性。 |
| [CardInfoPanel](../../src/ui/battle/CardInfoPanel/CardInfoPanel.tsx) | 战斗 HUD 右上固定卡牌说明面板，宽高比锁死 1:2，无配图也保留稳定尺寸的占位；污染卡会额外说明抽牌污染效果。 |
| [TickRuler](../../src/ui/battle/TickRuler/TickRuler.tsx) | 顶端信息条的全局时刻标尺；敌人行动标记默认关闭。 |
| [SkillCutInCard](../../src/ui/battle/SkillCutInCard/SkillCutInCard.tsx) | 出牌亮相卡面，挂在场景外，不受相机变换。 |
| [AmbienceLayer](../../src/ui/battle/AmbienceLayer/AmbienceLayer.tsx) | 双 Canvas 粒子和氛围层；两层同时是 3D 纵深层（`translateZ` 写在自己的 module.css，纵深值由 BattleScreen 下发）。隐藏页面暂停 rAF，减少动态效果时不挂载，调色层在场景外。 |
| [fx/HitFxLayer](../../src/ui/battle/fx/HitFxLayer/HitFxLayer.tsx) | 敌我共用命中特效和飘字；以 `hit.seq` 重挂载重播。`hitFxVars()` 返回的是 `UnitReact` 词元而非类名。 |
| [fx/SpriteFx](../../src/ui/battle/fx/SpriteFx/SpriteFx.tsx) | 一次性序列帧播放器。 |
| [fx/IaiSlashFx](../../src/ui/battle/fx/IaiSlashFx/IaiSlashFx.tsx) | `iai-slash` 居合斩程序化特效；`impactMs` 需与 CSS 关键帧同步，`animation-name` 必须留在 CSS 里（理由见 styles.md）。 |
| [styles/unitBadges.module.css](../../src/ui/battle/styles/unitBadges.module.css) | 敌我共用的护盾数值与阵亡叠层两枚徽章。 |
| [animations.ts](../../src/ui/battle/animations.ts) | 战斗分镜、相机、顿帧/震屏、卡牌与招式动画预设。调演出节奏优先改这里。 |
| [ambience.ts](../../src/ui/battle/ambience.ts) | 按地图登记粒子发射器、灯光闪烁和屏幕调色。 |
| [handFocusStore.ts](../../src/ui/battle/handFocusStore.ts) | 手牌悬停/聚焦状态，独立于 BattleScreen，避免鼠标状态和战斗状态互相污染。 |

## 公共组件（`common/`）

| 文件 | 作用 |
| --- | --- |
| [cx.ts](../../src/ui/common/cx.ts) | 全项目唯一的 className 拼接工具。 |
| [TechCard](../../src/ui/common/TechCard/TechCard.tsx) | 白色科技风静态卡牌展示框，卡面比例为 320:496、插画区为 1:1、卡名位于插画下方的装饰名条中、费用球贴左上角，支持普通 / 速攻两套配色，尺寸随容器等比自适应，可省略底部统计栏。 |
| [CharacterPortrait](../../src/ui/common/CharacterPortrait/CharacterPortrait.tsx) | 角色立绘查表，缺素材时回退 emoji。**取景一律由调用方通过 `className` 传入**，组件不认识任何调用者；`--portrait-dx/dy`、`--bust-scale` 等由登记表行内下发。 |
| [HpBar](../../src/ui/common/HpBar/HpBar.tsx) | 敌人和我方共用血条；按剩余血量分三档，流光、端头辉光和掉血火花保持固定池。`flush` 变体（队伍卡贴底）的样式也在本组件内。 |
| [PollutionMeter](../../src/ui/common/PollutionMeter/PollutionMeter.tsx) | 跨战斗队伍槽与角色详情复用的污染值进度条；只负责展示，不修改状态。 |
| [QuirkPips](../../src/ui/common/QuirkPips/QuirkPips.tsx) | 展示生病与永久怪癖徽章及说明；不复用临时战斗 `StatusPips`。 |
| [StatusPips](../../src/ui/common/StatusPips/StatusPips.tsx) | 状态图标和层数展示。 |
| [ManaCrystalIcon](../../src/ui/common/ManaCrystalIcon/ManaCrystalIcon.tsx) | 光资源 3D SVG 图标，`useId()` 隔离多个渐变实例；基础外观由自己挂，调用方只传尺寸类。 |
| [BondIcon](../../src/ui/common/BondIcon/BondIcon.tsx) | 羁绊词条线框图标，无样式文件。 |
| [item/ItemSlot](../../src/ui/common/item/ItemSlot/ItemSlot.tsx) | 背包、仓库、战后小结和远征结算共用的物品格；五档稀有度只由局部变量 `--rr`/`--rg` 驱动，并导出排布所需的 `EmptySlot`。 |
| [item/ItemDetail](../../src/ui/common/item/ItemDetail/ItemDetail.tsx) | 物品名称、稀有度、类别、占格、描述、属性和售价；操作按钮由调用方通过 children 注入。导出 `STAT_LABEL` 供商店复用文案口径。 |
| [item/ItemTabs](../../src/ui/common/item/ItemTabs/ItemTabs.tsx) | 物品一级/二级分类 tab；稀有度颜色留给格子，不给 tab 叠色。 |
| [item/itemFilters.ts](../../src/ui/common/item/itemFilters.ts) | 物品分类定义、匹配和计数纯函数。 |
| [item/ItemInventoryPanel](../../src/ui/common/item/ItemInventoryPanel/ItemInventoryPanel.tsx) | 背包、仓库等物品容器共用的面板壳，提供格网、容量读数、受控选中态和 portal 物品详情。 |

公共组件一律接受 `className`（铁律 3）——那是父组件唯一能改子组件外观的通道。

## 素材查表（`art/`）与 hooks

| 文件 | 作用 |
| --- | --- |
| [art/cardArt.ts](../../src/ui/art/cardArt.ts) | 战斗卡 id → 卡面配图。 |
| [art/enemyArt.ts](../../src/ui/art/enemyArt.ts) | 敌人 id → 待机拼条、尺寸和 idle 参数，含预热。 |
| [art/battleBg.ts](../../src/ui/art/battleBg.ts) | 地图 id → 战斗背景素材与静态图预热。 |
| [art/mapArt.ts](../../src/ui/art/mapArt.ts) | 地图 id → 选层预览素材；与战斗背景表分离。 |
| [art/eventArt.ts](../../src/ui/art/eventArt.ts) | 探索事件素材查表。 |
| [art/slotArt.ts](../../src/ui/art/slotArt.ts) | 战斗签符号卡面查表。 |
| [art/vfxSprites.ts](../../src/ui/art/vfxSprites.ts) | 命中特效序列帧 URL 列表和预热。 |
| [art/sceneArt.ts](../../src/ui/art/sceneArt.ts) | 菜单、大厅、设施和商店直接使用的场景/界面素材登记。 |
| [art/assetLoader.ts](../../src/ui/art/assetLoader.ts) | 可复用的低优先级图片下载/解码与视频首帧预加载器；按 URL 去重，并限制图片并发以避免抢占交互资源。 |
| [art/assetPreloader.ts](../../src/ui/art/assetPreloader.ts) | 游戏启动时的实际美术资源清单、去重、进度和失败收口；不扫描未引用的 `assets` 文件。 |
| [art/itemArt.tsx](../../src/ui/art/itemArt.tsx) | 物品图标（内联 SVG 或 `<img>`）；SVG 全用 `stroke="currentColor"`，颜色吃父级 `--rr`。 |
| [hooks/useGameAssetPreload.ts](../../src/ui/hooks/useGameAssetPreload.ts) | 将启动预加载状态接入 React 外部 store；主菜单等待所有资源任务 settle 后开放入口。 |
| [hooks/stage.ts](../../src/ui/hooks/stage.ts) | 1920×1080 设计画布和等比 letterbox 缩放。画布内不使用 `vw` / `vh` 或窗口断点。 |
| [hooks/useCountUp.ts](../../src/ui/hooks/useCountUp.ts) | rAF 数值滚动；起点走 ref，减少动态效果下直接使用终值。 |
| [hooks/useChangePulse.ts](../../src/ui/hooks/useChangePulse.ts) | 认出「同一个 key 的数值变了」并短暂高亮。物品**新进来**由格子重挂载的 CSS 动画负责，这个 hook 只管 uid 不变、`count` 改数的那种；新出现的 key 刻意不算变化，否则两边都闪会重影。 |
| [hooks/useIdleTwitch.ts](../../src/ui/hooks/useIdleTwitch.ts) | 低频随机敌人待机小动作，只存在于 UI 局部状态。 |
| [hooks/useTypewriter.ts](../../src/ui/hooks/useTypewriter.ts) | 探索事件文本逐字演出。 |

## 过场与共享元素

| 文件 | 作用 |
| --- | --- |
| [app/transitions.ts](../../src/ui/app/transitions.ts) | 过场预设、默认时长、按界面/路线解析；探索到战斗的裂纹涟漪时长只在这里配置。 |
| [app/transitionOrigin.ts](../../src/ui/app/transitionOrigin.ts) | 一次性缓存点击坐标，仅用于视觉过场，不进入 Zustand。 |
| [app/viewTransition.global.css](../../src/ui/app/viewTransition.global.css) | 编队 ↔ 角色详情、出击选层 ↔ 物资准备的共享元素过场。全局普通 CSS（无类名，只有文档根伪元素）。 |
| [character/sharedPortrait.ts](../../src/ui/character/sharedPortrait.ts) | 编队与角色详情之间共享立绘元素的 View Transition 标识。 |
| [town/facilityScenes.ts](../../src/ui/town/facilityScenes.ts) | 据点进设施的推镜时序、飞出参数与设施背景图。 |

## 战斗设计画布与相机边界

战斗、主菜单和据点画布恒为 1920×1080，由 `useStageScale` 以 `k = min(容器宽/1920, 容器高/1080)` 等比缩放，超出部分留黑边。战斗舞台和底部 HUD 是兄弟矩形；`--hud-h` 直接决定敌人可见地面线，调整前必须复核站位。

战斗世界使用一个相机：背景、氛围和单位都在 `.battle-world` 内一起变换。`transform` 负责空闲漂移，独立 `translate` 负责震屏，独立 `scale` 负责冲击缩放；不要让背景和单位分别套变换。相机全程使用设计 px，`getBoundingClientRect()` 得到屏幕 px 时先经换算；相机反投影则通过世界层矩形抵消画布缩放、当前相机和漂移。

⚠ 相机取景要量的是含体型 `scale` 的那一层，`querySelector` 认的是 `[data-cmb-stage]` 而**不是**类名——类名已被 CSS Modules 哈希，写死字符串会静默退回外层布局盒，取景悄悄出错。

我方队伍卡在战场世界之外，因此不参与推镜；攻击自身或友军时保持全景，只播放特效和震屏。调色层、HUD 和过场幕布是镜头/界面层，不应跟着场景相机移动。
