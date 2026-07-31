# React 视图层

路径：`src/ui/`。组件负责展示和派发 action，不承载战斗或探索规则。

| 区域 | 主要入口 |
| --- | --- |
| 路由与过场 | [ScreenTransition.tsx](../../src/ui/ScreenTransition.tsx)、[transitions.ts](../../src/ui/transitions.ts) |
| 主菜单与据点 | [MenuScreen.tsx](../../src/ui/MenuScreen.tsx)、[TownScreen.tsx](../../src/ui/TownScreen.tsx) |
| 设施 | [ControlTerminalScene.tsx](../../src/ui/ControlTerminalScene.tsx)、[CryoScene.tsx](../../src/ui/CryoScene.tsx)、[StorageScene.tsx](../../src/ui/StorageScene.tsx) |
| 编队与角色 | [FormationScreen.tsx](../../src/ui/FormationScreen.tsx)、[CharacterDetailScreen.tsx](../../src/ui/CharacterDetailScreen.tsx) |
| 探索 | [ExploreScreen.tsx](../../src/ui/ExploreScreen.tsx)、[RouteBoard.tsx](../../src/ui/RouteBoard.tsx)、[BackpackPanel.tsx](../../src/ui/BackpackPanel.tsx) |
| 战斗 | [BattleScreen.tsx](../../src/ui/BattleScreen.tsx)、[CombatantView.tsx](../../src/ui/CombatantView.tsx)、[AllyBar.tsx](../../src/ui/AllyBar.tsx)、[HandCard.tsx](../../src/ui/HandCard.tsx) |
| 资源查表 | [battleBg.ts](../../src/ui/battleBg.ts)、[mapArt.ts](../../src/ui/mapArt.ts)、[enemyArt.ts](../../src/ui/enemyArt.ts)、[cardArt.ts](../../src/ui/cardArt.ts)、[eventArt.ts](../../src/ui/eventArt.ts) |
| 共用物品 UI | [ItemSlot.tsx](../../src/ui/ItemSlot.tsx)、[ItemTabs.tsx](../../src/ui/ItemTabs.tsx)、[ItemDetail.tsx](../../src/ui/ItemDetail.tsx) |
| 舞台与表现 | [stage.ts](../../src/ui/stage.ts)、[animations.ts](../../src/ui/animations.ts)、[ambience.ts](../../src/ui/ambience.ts) |

组件旁的同名 CSS 属于该组件；跨组件的公共规则放在 `src/styles/`。图片素材只通过 UI 查表引用，数据文件不直接引用素材路径。
