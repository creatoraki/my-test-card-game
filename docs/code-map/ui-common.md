# UI：公共组件

路径：`src/ui/common/`。在多个领域复用的组件和工具。新增功能前先在这里找现成的实现。

## 工具

| 文件 | 作用 |
| --- | --- |
| [cx.ts](../../src/ui/common/cx.ts) | 拼接类名，全项目只有这一处实现，被 177 个文件引用。 |
| [cardText.ts](../../src/ui/common/cardText.ts) | 卡牌说明文字的 hooks：按持有者的属性渲染数值（`useCardText`），去掉模组附加的文字。 |
| [statGroups.ts](../../src/ui/common/statGroups.ts) | 属性面板的分组与文案，角色详情和角色档案共用。 |

## 悬浮详情（代替原生 title）

⚠ 项目禁止使用原生 `title` 属性。悬浮提示一律用下面的组件实现，外观统一由 `TooltipCard` 绘制。

| 目录 | 作用 |
| --- | --- |
| [TooltipCard/](../../src/ui/common/TooltipCard/TooltipCard.tsx) | 统一的悬浮详情卡：头部、正文斜切面板（数字高亮）、可选底栏。 |
| [HoverTooltip/](../../src/ui/common/HoverTooltip/HoverTooltip.tsx) | 手动触发的定位层，配合 `useHoverTooltip` 使用：portal 到设计画布，并限制在边界内。 |
| [RailPopover/](../../src/ui/common/RailPopover/RailPopover.tsx) | 按最近的 `[data-rail-item]` 宿主自动定位的悬停详情，适合遗物栏、羁绊栏这类横排栏位。 |
| [BondTooltip/](../../src/ui/common/BondTooltip/BondTooltip.tsx) / [CardKeywordNotes/](../../src/ui/common/CardKeywordNotes/CardKeywordNotes.tsx) | 羁绊的等级表详情；卡牌词条的注释。 |

## 弹层与演出

| 目录 | 作用 |
| --- | --- |
| [ConfirmDialog/](../../src/ui/common/ConfirmDialog/ConfirmDialog.tsx) + `confirmStore.ts` | 全局确认框，调用 `confirm({ title, text, onConfirm, danger })`。由 `App.tsx` 常驻挂载。 |
| [GuideSpotlight/](../../src/ui/common/GuideSpotlight/GuideSpotlight.tsx) + `guideStore.ts` / `useGuideOnce.ts` | 新手引导的聚光层，同一条引导只显示一次（已读记录写进 `townStore.markGuideSeen`）。 |
| [PanelShell/](../../src/ui/common/PanelShell/PanelShell.tsx) / [panelMorph/](../../src/ui/common/panelMorph/usePanelMorph.ts) / [ModalReveal/](../../src/ui/common/ModalReveal/ModalReveal.tsx) | 设施面板外壳（1600×920）；面板的折叠与展开演出；弹窗揭幕演出。 |
| [EventPanel/](../../src/ui/common/EventPanel/EventPanel.tsx) | 事件面板的框架、原语和场景插图，共享样式在 `styles/`。 |
| [SettingsPanel/](../../src/ui/common/SettingsPanel/SettingsPanelShell.tsx) / [VolumeSlider/](../../src/ui/common/VolumeSlider/VolumeSlider.tsx) | 系统菜单外壳、音频设置行、操作按钮；音量滑条。 |
| [CharacterModal/](../../src/ui/common/CharacterModal/CharacterModal.tsx) | 探索中的角色档案浮层。不读 store，所有数据由调用方传入。 |
| [ChatBot/](../../src/ui/common/ChatBot/ChatBot.tsx) | 带台词气泡的机器人（据点、出击补给机、探索独白都在用）。 |
| [PixelSwap/](../../src/ui/common/PixelSwap/PixelSwap.tsx) | 像素化的内容切换转场（据点使用）。476 行，接近上限。 |

## 物品 `item/`

| 目录或文件 | 作用 |
| --- | --- |
| [ItemSlot/](../../src/ui/common/item/ItemSlot/ItemSlot.tsx) | 小物品格，背包、仓库、战斗等 20 多处共用。稀有度边框、角标、图标、数量都只在这里画。 |
| [ItemTile/](../../src/ui/common/item/ItemTile/ItemTile.tsx) | 竖版的大物品卡，用于商店回收台和仓库。 |
| [ItemIconFrame/](../../src/ui/common/item/ItemIconFrame/ItemIconFrame.tsx) | 1:1 的图标框。⚠ 框里只放图标，名称、数量、价格一律由调用方排在框外。 |
| [ItemDetail/](../../src/ui/common/item/ItemDetail/ItemDetail.tsx) / [ItemTooltip/](../../src/ui/common/item/ItemTooltip/index.ts) | 物品详情（不含操作按钮，按钮由各界面自己提供）；物品悬浮详情。 |
| [ItemTabs/](../../src/ui/common/item/ItemTabs/ItemTabs.tsx) + [itemFilters.ts](../../src/ui/common/item/itemFilters.ts) | 分类页签与过滤规则，背包和仓库共用同一套顺序和规则。 |
| [ItemInventoryPanel/](../../src/ui/common/item/ItemInventoryPanel/ItemInventoryPanel.tsx) / [ItemContextMenu/](../../src/ui/common/item/ItemContextMenu/ItemContextMenu.tsx) | 通用的库存面板；物品右键菜单。 |
| [ModuleInstall/](../../src/ui/common/item/ModuleInstall/ModuleInstallDialog.tsx) | 远征途中把模组直接装到卡上的弹窗，校验逻辑与据点共用 `townStore.installModuleStack`。 |
| [inventoryTheme.ts](../../src/ui/common/item/inventoryTheme.ts) | 库存面板的配色主题。 |

## 科技树 `techTree/`

设施升级和科技研究共用的公共视觉组件。`TechnologyBoard` 提供图表、详情和底栏的主体；`TechnologyTree` 在外层加背景、页头和完整面板布局；`TechnologyGraph` 负责节点和连线；`TechnologyMedallion` 是节点徽章（四种状态共用同一套六边形几何）。其余组件：`TechnologyDetail`、`TechnologyMaterials`、`TechnologyTabs`、`TechnologyFooter`、`TechnologyArtwork`。使用方有商店的设施科技、医疗室的疗养科技和研究中心的全局科技树。

## 战斗数值与图标

| 目录 | 作用 |
| --- | --- |
| [HpBar/](../../src/ui/common/HpBar/HpBar.tsx) / [ShieldBar/](../../src/ui/common/ShieldBar/ShieldBar.tsx) | 敌我共用的血条（材质、三段配色、流光时序只写一份）；护盾条。 |
| [StatusPips/](../../src/ui/common/StatusPips/StatusPips.tsx) / [QuirkPips/](../../src/ui/common/QuirkPips/QuirkPips.tsx) / [PollutionMeter/](../../src/ui/common/PollutionMeter/PollutionMeter.tsx) | 状态图标、怪癖图标、污染值。 |
| [ManaCrystal/](../../src/ui/common/ManaCrystal/ManaCrystal.tsx) / [StatIcon/](../../src/ui/common/StatIcon/StatIcon.tsx) | 法力水晶；属性图标。 |
| [BuffIcon/](../../src/ui/common/BuffIcon/CultivationEmblem.tsx) / [AssembleIcon/](../../src/ui/common/AssembleIcon/AssembleIcon.tsx) | 培育植物的状态徽记（纯 SVG）；炼金组装部件图标。⚠ `emblemGeometry.ts` 引用了 `ui/test` 里的几何常量。 |
| [CardTextRich/](../../src/ui/common/CardTextRich/CardTextRich.tsx) / [CardBack/](../../src/ui/common/CardBack/CardBack.tsx) | 带高亮的卡牌说明；卡背。 |
| [PartyMemberCard/](../../src/ui/common/PartyMemberCard/PartyMemberCard.tsx) / [CharacterPortrait/](../../src/ui/common/CharacterPortrait/CharacterPortrait.tsx) | 队员卡；角色立绘（统一为 1152×2048、9:16、透明底）。 |

## 羁绊

`BondIcon`、`BondSlot`、`BondShowcase`、`SquadBondBar`、`ArcanaIcon`（秘仪图标，`arcanaArt.tsx` 是图形表）。

## 装饰与交互外观

| 目录 | 作用 |
| --- | --- |
| [HudFrame/](../../src/ui/common/HudFrame/HudFrame.tsx) | 整屏级的赛博 HUD 外框，轮廓按容器的实际像素生成。 |
| [BorderGlow/](../../src/ui/common/BorderGlow/BorderGlow.tsx) / [NeonPlate/](../../src/ui/common/NeonPlate/NeonPlate.tsx) / [DetailFrame/](../../src/ui/common/DetailFrame/DetailFrame.tsx) | 边缘扫光、霓虹切角牌面、纯装饰边框。 |
| [InteractiveHint/](../../src/ui/common/InteractiveHint/InteractiveHint.tsx) / [HoldButton/](../../src/ui/common/HoldButton/HoldButton.tsx) | 卡牌悬停和选中时四角的呼吸边框；长按确认按钮。 |

## 遗留或无人引用

- `HudPanelShell/`、`tech/TechCostMaterials/`、`techTree/techTreeEdges.ts`：没有任何引用。
- `SciFiPanel/`：只被一个没有接入的演示页引用。
- `RouteBoard/RouteEventIcon.tsx`：旧节点事件图标，目前只有结算页的 `EventDropBand` 在用。
