# UI：据点与出击准备

路径：`src/ui/town/`、`src/ui/sortie/`。据点是远征之间的常驻中枢：一张 1920×1080 的空间站全景，上面有可以点击的建筑。点击建筑后播放“进入设施”的演出，再切到对应的设施场景。

## 据点全景 `TownScreen/`

| 文件 | 作用 |
| --- | --- |
| [TownScreen.tsx](../../src/ui/town/TownScreen/TownScreen.tsx) | 全景页和设施场景的路由。新增设施只需写一个 `XxxScene` 组件，再在这里的映射表加一行。根节点通过 `data-town-stage` 向子组件传递状态。 |
| [stationBuildings.ts](../../src/ui/town/TownScreen/stationBuildings.ts) | 建筑登记表：位置、名称，以及对应的设施和背景图。 |
| [StationLayer/](../../src/ui/town/TownScreen/parts/StationLayer/StationLayer.tsx) | 全景上的建筑热区与悬停效果。 |
| [StationHud/](../../src/ui/town/TownScreen/parts/StationHud/StationHud.tsx) | 左上角的据点终端：生存日刻度盘、居民积分和三色水晶、队伍状态（上阵 / 在编 / 疗养 / 净化 / 阵亡）。 |
| [StationDock/](../../src/ui/town/TownScreen/parts/StationDock/StationDock.tsx) | 右下角的编队和出击按钮。它们不算设施，点击后直接切到顶层全屏页。 |
| [StationBot/](../../src/ui/town/TownScreen/parts/StationBot/StationBot.tsx) / [StationSettings/](../../src/ui/town/TownScreen/parts/StationSettings/StationSettingsPanel.tsx) + [SettingsGearButton/](../../src/ui/town/TownScreen/parts/SettingsGearButton/SettingsGearButton.tsx) | 据点机器人的台词气泡；系统菜单（音频设置、重置存档）。 |
| [FacilityBack/](../../src/ui/town/TownScreen/parts/FacilityBack/FacilityBack.tsx) | 设施内通用的返回按钮。 |
| [facilityScenes.ts](../../src/ui/town/TownScreen/facilityScenes.ts) / [facilityExit.tsx](../../src/ui/town/TownScreen/facilityExit.tsx) / [townReturn.ts](../../src/ui/town/shared/townReturn.ts) | 进入设施的演出预设（时长的唯一来源）；关闭设施时等待面板收起；从顶层页返回据点时补播反向换场的一次性标记。 |
| [FormationTodo/](../../src/ui/town/FormationTodo/useFormationTodo.ts) | 编队待办：队伍未满员、未选小队徽章、训练点未分配。出击前由 `guardSortie` 列出这些待办并弹出确认。 |

## 建筑与设施

| 建筑 | 设施 id | 目录 | 内容 |
| --- | --- | --- | --- |
| 商店 | `shop` | [shop/](../../src/ui/town/shop/ShopScene/ShopScene.tsx) | `MarketPanel` 是统一商店：左边混合货架，右边商品详情，底部是刷新和设施升级。`WarehousePanel` 是仓库，`StockPanels` 是库存和回收台共用的物品网格，`ShopUpgradePanel` 是设施科技。外壳部件包括 `ShopNavigation`、`ShopSidebar`、`ShopWindow`、`ShopHeader`、`ShopBack`、`ShopDetailAside`、`ShopDetailCard` 等。 |
| 医疗室 | `cryo` | [cryo/](../../src/ui/town/cryo/CryoScene/CryoScene.tsx) | `CryoPanel` 负责左侧导航和换页。页面有：`RevivePanel`（复苏舱，消耗积分复苏阵亡队员）、`NutritionPanel`（疗养舱席位）、`NutritionTechTree`（疗养科技，接入公共科技板）、`SanctuaryPanel`（圣水池，净化诅咒遗物）。 |
| 研究中心 | `worklog` | [terminal/](../../src/ui/town/terminal/ResearchScene/ResearchScene.tsx) | `ResearchPanel` 负责换页。页面有：`ModuleAssemblyView`（模组装配：角色舞台、卡组网格、工作台和模组仓架）、`CraftView`（模组制造：配方、制造台、材料仓库）、`ResearchTechView`（全局科技树）。 |
| 工房 | `assembly` | [assembly/](../../src/ui/town/assembly/AssemblyScene/AssemblyScene.tsx) | `EquipUpgradePanel`（装备升阶）和 `EquipReforgePanel`（羁绊重铸），装备列表在 `EquipTargetList`，外壳在 `AssemblyChrome`，操作按钮在 `EquipParts`。 |
| 档案机 | `museum` | [museum/](../../src/ui/town/museum/MuseumScene/MuseumScene.tsx) | 图鉴：卡牌馆、敌人馆、物品馆，未解锁的条目显示为锁定格。`codexCatalog.ts` 提供排好序的图鉴清单。 |
| 队员宿舍 | `formation` | — | 直接切到编队页，见 [ui-character.md](ui-character.md)。 |

医疗室、研究中心和商店共用同一套外壳语言：左侧信息条（底板 + 铭牌 + 导航 + 返回），右侧是常驻的切角窗口。

## 训练室组件 `training/`

没有独立的设施场景，只在编队页里使用（小队徽章转盘、天赋弹窗）。

| 文件 | 作用 |
| --- | --- |
| [useSquadTalent.ts](../../src/ui/town/training/SquadTalentModal/useSquadTalent.ts) | 小队徽章和天赋树的交互层。所有判定都来自 `data/roster/squadTalents.ts` 的纯函数。 |
| [SquadTalentModal/](../../src/ui/town/training/SquadTalentModal/SquadTalentModal.tsx) / [BadgeSelectModal/](../../src/ui/town/training/BadgeSelectModal/BadgeSelectModal.tsx) | 训练点分配弹窗；徽章选择弹窗。 |
| [TalentTreeRadial/](../../src/ui/town/training/TalentTreeRadial/TalentTreeRadial.tsx) / [TalentArtwork/](../../src/ui/town/training/TalentArtwork/TalentNode.tsx) | 星盘式的天赋树；节点、外框、徽记、悬浮详情等美术部件。 |
| [styles/badgeTheme.ts](../../src/ui/town/training/styles/badgeTheme.ts) | 徽章的三档配色主题（模组徽记也沿用它）。 |

## 出击准备 `ui/sortie/`

一级全屏页（`screen === "sortie"`），分两步：选地图，再准备物资。状态在 `store/sortie/sortieStore`，不会持久化。

| 目录 | 作用 |
| --- | --- |
| [SortieScreen/](../../src/ui/sortie/SortieScreen/SortieScreen.tsx) + [SortieStepViewport/](../../src/ui/sortie/SortieStepViewport/SortieStepViewport.tsx) + [sortieStepTransition.ts](../../src/ui/sortie/SortieScreen/sortieStepTransition.ts) | 页面根组件和两个步骤之间的切换演出。 |
| [MapSelectStep/](../../src/ui/sortie/MapSelectStep/MapSelectStep.tsx) / [MapMissionInfo/](../../src/ui/sortie/MapMissionInfo/MapMissionInfo.tsx) | 选择地图和难度，显示任务信息与奖励。 |
| [PrepStep/](../../src/ui/sortie/PrepStep/PrepStep.tsx) | 物资准备。所有反馈（买到了、买不起、装不下、退款）都由补给机器人说出来。 |
| [StockShelf/](../../src/ui/sortie/StockShelf/StockShelf.tsx) / [StorageInventory/](../../src/ui/sortie/StorageInventory/StorageInventory.tsx) | 常驻补给货架；仓库和出击背包。 |
| [SortieRelicBar/](../../src/ui/sortie/SortieRelicBar/SortieRelicBar.tsx) / [SortieRelicPanel/](../../src/ui/sortie/SortieRelicPanel/SortieRelicPanel.tsx) | 携带遗物栏和选择面板。 |
| `SortieFrame` / `SortieBackdrop` / `SortieNav` / `SortieGlyph` | 冷蓝黑钢的切角外框、背景、步骤导航、图标。 |
| [hooks/useInfiniteBand.ts](../../src/ui/sortie/hooks/useInfiniteBand.ts) | 无限循环滚动列表的内核。 |
| `styles/` | `sortieGlass.module.css` 是白玻璃材质，`inventoryPalettes.ts` 区分仓库、背包和遗物三套配色。 |
