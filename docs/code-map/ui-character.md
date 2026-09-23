# UI：编队与角色

路径：`src/ui/character/`。编队页是一级全屏页（`screen === "formation"`），入口是据点右下角的“编队”按钮或全景上的“队员宿舍”。⚠ 它不是设施场景，不走 TownScreen 的进设施演出。角色详情是编队页内部的第二种状态，不是独立页面。

## 编队页 `FormationScreen/`

| 文件或目录 | 作用 |
| --- | --- |
| [FormationScreen.tsx](../../src/ui/character/FormationScreen/FormationScreen.tsx) | 页面根组件：组装卡阵、HUD、徽章盘，以及编队态和详情态的切换。 |
| [formationMorph/](../../src/ui/character/FormationScreen/formationMorph/useFormationMorph.ts) | 编队态 ↔ 详情态的状态机。过场期间两种状态同时挂载，被点击的角色由 `MorphFlyer` 的副本从一端飞到另一端；时序在 `morphChoreo.ts`。 |
| [detailPrewarm/](../../src/ui/character/FormationScreen/detailPrewarm/useDetailPrewarm.ts) | 空闲时预先渲染一次详情树，解决第一次点开角色时过场掉帧的问题。 |
| [CrewGrid/](../../src/ui/character/FormationScreen/CrewGrid/CrewGrid.tsx) / [CrewCard/](../../src/ui/character/FormationScreen/CrewCard/CrewCard.tsx) | 队员卡阵；单张队员卡（外框、铭牌、职业图标、上阵开关）。 |
| [SquadHud/](../../src/ui/character/FormationScreen/SquadHud/SquadHud.tsx) / [HudPanel/](../../src/ui/character/FormationScreen/HudPanel/HudPanel.tsx) | 队伍读数和返回按钮（也可以按 Esc）；通用的 HUD 面板壳。 |
| [SquadBadgeDial/](../../src/ui/character/FormationScreen/SquadBadgeDial/SquadBadgeDial.tsx) | 左上角的小队徽章和训练点读数，点击打开天赋弹窗（组件在 `ui/town/training`）。它也是本页的待办提醒位。 |
| [FormationDecor/](../../src/ui/character/FormationScreen/FormationDecor/FormationDecor.tsx) | 页面装饰层。 |

## 角色详情 `CharacterDetailView/`

| 文件或目录 | 作用 |
| --- | --- |
| [CharacterDetailView.tsx](../../src/ui/character/CharacterDetailView/CharacterDetailView.tsx) + [detailLayout.ts](../../src/ui/character/CharacterDetailView/detailLayout.ts) | 两栏布局：左边是 594×772 的立绘取景窗，右边是工作区。 |
| [CharacterNavigator.tsx](../../src/ui/character/CharacterDetailView/CharacterNavigator.tsx) | 在队员之间切换。 |
| [FigureStage/](../../src/ui/character/CharacterDetailView/FigureStage/FigureStage.tsx) | 立绘取景窗和外框；`FigureProgress` 显示卡组等级的经验进度，并提供升级按钮。 |
| [Workbench/](../../src/ui/character/CharacterDetailView/Workbench/Workbench.tsx) | 右侧工作区，有两个页签：`ProfilePanel` + `StatsPanel`（属性和装备）、`DeckPanel`（卡组）。 |
| [EquipPicker/](../../src/ui/character/CharacterDetailView/EquipPicker/EquipPicker.tsx) + [useEquipPreview.ts](../../src/ui/character/CharacterDetailView/useEquipPreview.ts) / [equipPreview.ts](../../src/ui/character/CharacterDetailView/equipPreview.ts) | 换装候选列表（占用立绘位置展开），以及换装前后的属性差值预览。 |

## 卡组与装备部件

| 目录或文件 | 作用 |
| --- | --- |
| [DeckGrowthPanel/](../../src/ui/character/DeckGrowthPanel/DeckGrowthPanel.tsx) | 卡组成长面板：卡组升级、抽卡三选一（可放弃）、删卡。操作在 `useGrowthActions.ts`，展示文案在 `growthPresentation.ts`。 |
| [DeckForge/forgeViewModel.ts](../../src/ui/character/DeckForge/forgeViewModel.ts) | 由角色状态和当天日期算出的锻造视图数据：等级上限、各项费用。 |
| [DeckCard/](../../src/ui/character/DeckCard/DeckCard.tsx) / [DeckCardHoverPreview/](../../src/ui/character/DeckCardHoverPreview/DeckCardHoverPreview.tsx) | 卡组中的卡牌；悬停时的大图预览。 |
| [EquipmentSlots/](../../src/ui/character/EquipmentSlots/EquipmentSlots.tsx) | 武器、防具、饰品三个装备槽，支持选中和卸下。 |
| [characterGlow.ts](../../src/ui/character/characterGlow.ts) / [glyphs/deckGlyphs.tsx](../../src/ui/character/glyphs/deckGlyphs.tsx) | 按角色主题色生成的发光参数；卡组相关图标。 |
| `styles/` | `detailTokens`、`glowCard`、`sceneVeil`、`typeScale` 四份共享样式。 |

## 相关

- 属性分组和文案：[ui/common/statGroups.ts](../../src/ui/common/statGroups.ts)（详情页和探索页的角色档案共用）。
- 规则来源：`store/townStore`（锻造、装备）、`store/characterStats.ts`（面板推导）、`engine/rules.ts`（费用）。
