# UI：探索

路径：`src/ui/explore/`。房间制探索的界面，包括横向场景、小地图、底部 HUD 和各类浮层。会话数据来自 `store/explore/exploreStore`，场景内的操作通过 `runStore`（见 `store/explore/exploreCorridor.ts`、`store/explore/curioActions.ts`）派发。

## 页面编排 `ExploreScreen/`

| 文件 | 作用 |
| --- | --- |
| [ExploreScreen.tsx](../../src/ui/explore/ExploreScreen/ExploreScreen.tsx) | 页面根组件：只负责组装场景、小地图、底部 HUD 和浮层。画布根节点通过 `data-explore-stage` 向子组件传递状态。 |
| [ExploreDock.tsx](../../src/ui/explore/ExploreScreen/parts/ExploreDock.tsx) / [ExploreInventory.tsx](../../src/ui/explore/ExploreScreen/parts/ExploreInventory.tsx) + [useExploreInventory.ts](../../src/ui/explore/ExploreScreen/useExploreInventory.ts) | 底部 HUD；背包相关的状态与操作（使用、丢弃、寄回、为目标选择角色）。 |
| [CurioPanel.tsx](../../src/ui/explore/ExploreScreen/parts/CurioPanel.tsx) + [curioTheme.ts](../../src/ui/explore/ExploreScreen/parts/curioTheme.ts) + [useCurioLoot.ts](../../src/ui/explore/ExploreScreen/useCurioLoot.ts) | 物件交互面板：选择决策和执行者、查看结算结果、领取物品。配色按物件分类取。 |
| [BossGatePanel.tsx](../../src/ui/explore/ExploreScreen/parts/BossGatePanel.tsx) | BOSS 红门的确认面板：开启后无法返回副本。 |
| [RelicRail.tsx](../../src/ui/explore/ExploreScreen/parts/RelicRail.tsx) | 探索页的遗物栏。 |
| [usePortalTravelTransition.ts](../../src/ui/explore/ExploreScreen/usePortalTravelTransition.ts) / [useDialogFocus.ts](../../src/ui/explore/ExploreScreen/useDialogFocus.ts) | 传送时的淡出淡入；浮层的焦点管理。 |

## 横向场景 `CorridorScene/`

| 文件 | 作用 |
| --- | --- |
| [CorridorScene.tsx](../../src/ui/explore/CorridorScene/CorridorScene.tsx) | 房间场景的根组件：背景、物件、传送门、黑影、玩家。镜头跟随玩家，在房间两端停住。 |
| [useCorridorMovement.ts](../../src/ui/explore/CorridorScene/useCorridorMovement.ts) + [corridorPlayerMotion.ts](../../src/ui/explore/CorridorScene/corridorPlayerMotion.ts) + [corridorMovementView.ts](../../src/ui/explore/CorridorScene/corridorMovementView.ts) | 键盘移动与交互键：靠近物件就打开，站在传送门上就确认传送。⚠ 只有换了一扇门时才提交到 store，避免每帧都克隆整个会话。 |
| [corridorTriggers.ts](../../src/ui/explore/CorridorScene/corridorTriggers.ts) | 累计行走距离：每走满一段扣 1 点粒子，并在此时检定伏击。 |
| [corridorLayout.ts](../../src/ui/explore/CorridorScene/corridorLayout.ts) / [corridorFrame.ts](../../src/ui/explore/CorridorScene/corridorFrame.ts) | 地面高度、物件落位、镜头取景的几何计算。 |
| [CorridorBackdrop/](../../src/ui/explore/CorridorScene/parts/CorridorBackdrop/CorridorBackdrop.tsx) / [EcoArkArchitecture/](../../src/ui/explore/CorridorScene/parts/EcoArkArchitecture/EcoArkArchitecture.tsx) | 远景和近景图层；生态方舟专用的建筑层。 |
| [CorridorPlayer/](../../src/ui/explore/CorridorScene/parts/CorridorPlayer/CorridorPlayer.tsx) | 探索角色的逐帧动画和动作状态。 |
| [CorridorSprite.tsx](../../src/ui/explore/CorridorScene/parts/CorridorSprite/CorridorSprite.tsx) / [RoomPortal.tsx](../../src/ui/explore/CorridorScene/parts/RoomPortal/RoomPortal.tsx) / [BossGate.tsx](../../src/ui/explore/CorridorScene/parts/BossGate/BossGate.tsx) / [ShadowEncounter.tsx](../../src/ui/explore/CorridorScene/parts/ShadowEncounter/ShadowEncounter.tsx) | 场景中的物件、传送门（四座外观完全相同）、BOSS 红门、黑影。 |
| [PlayerSpeech/](../../src/ui/explore/CorridorScene/parts/PlayerSpeech/PlayerSpeech.tsx) + [useExplorerChatter.ts](../../src/ui/explore/CorridorScene/useExplorerChatter.ts) | 探索者头顶的独白气泡，文案来自 `data/lines/explorerLines.ts`。 |

## HUD 与浮层

| 目录 | 作用 |
| --- | --- |
| [Minimap/](../../src/ui/explore/Minimap/Minimap.tsx) | 房间小地图，也是唯一能看出传送门通往哪里的地方：站上传送门时点亮目标房间，并标出已探索的房间。`minimapModel` 负责数据，`minimapLayout` 负责几何，`MinimapAtlas` 是展开后的全图，带图例和指南针。 |
| [EnergyReadout/](../../src/ui/explore/EnergyReadout/EnergyReadout.tsx) | 右上角的净化粒子读数卡和档位详情，坐标按设计图 1:1 还原。 |
| [BackpackBar/](../../src/ui/explore/BackpackBar/BackpackBar.tsx) / [BackpackPanel/](../../src/ui/explore/BackpackPanel/BackpackPanel.tsx) / [BurdenGauge/](../../src/ui/explore/BurdenGauge/BurdenGauge.tsx) | 背包快捷栏；24 格背包面板（分类页签和实时负重）；负重仪表。 |
| [LootPickup/](../../src/ui/explore/LootPickup/LootPickup.tsx) | 拾取框：先展示再领取，可以放弃。模组可以直接装到卡上（见 `common/item/ModuleInstall`）。 |
| [RewardOverlay/](../../src/ui/explore/RewardOverlay/RewardOverlay.tsx) | 事件结算后，按 `pendingActions` 逐条弹出的奖励处理面板：卡牌、换卡、角色、装备候选、装备调校、遗物三选一。 |
| [EventDossier/](../../src/ui/explore/EventDossier/EventDossierPanel.tsx) | 事件档案面板：页眉、选项、执行者、结果、战利品、候选、装饰；配色主题在 `dossierThemes.ts`。 |
| [WanderingMerchant/](../../src/ui/explore/WanderingMerchant/WanderingMerchantPanel.tsx) | 流浪货商：货架、食品钱包、购买判定（`useMerchantBuyReason` 把探索条件和卡组容量条件合成一处判断）。 |
| [BeaconSkill/](../../src/ui/explore/BeaconSkill/BeaconButton.tsx) / [PicnicSkill/](../../src/ui/explore/PicnicSkill/PicnicPanel.tsx) | 应急信标按钮（传送到已知房间）；野餐按钮与面板。 |

## 共享样式与其他

- `styles/`：`exploreKit`、`explorePanel`、`rewardKit` 三份共享样式，`inventoryPalettes.ts` 是背包配色，`panelReveal.ts` 是面板入场时序。
- [eventKindLabel.ts](../../src/ui/result/EndScreen/parts/eventKindLabel.ts)：旧节点事件类型的中文名，目前只有结算页的 `EventDropBand` 在用。
