# UI：战斗

路径：`src/ui/battle/`。战斗画布固定为 1920×1080。战斗状态由 `store/battleStore` 提供；引擎把每次操作的结果记成 `steps`，UI 按顺序回放。

## 页面编排 `BattleScreen/`

| 文件 | 作用 |
| --- | --- |
| [BattleScreen.tsx](../../src/ui/battle/BattleScreen/BattleScreen.tsx) | 战斗页的根组件，负责组装舞台层、HUD 和各类浮层。 |
| [parts/BattleStageLayer.tsx](../../src/ui/battle/BattleScreen/parts/BattleStageLayer.tsx) / [parts/PlaneUnit.tsx](../../src/ui/battle/BattleScreen/parts/PlaneUnit.tsx) | 舞台世界层：背景、氛围、敌人平面。 |
| [parts/BattleHudDock.tsx](../../src/ui/battle/BattleScreen/parts/BattleHudDock.tsx) / [parts/ScreenFxLayer.tsx](../../src/ui/battle/BattleScreen/parts/ScreenFxLayer.tsx) | 底部 HUD 区域（我方头像、手牌、法力、小队增益）；全屏特效层（压暗、闪白、血幕、故障、双箭，以及我方受伤时的暗角）。 |
| [useBattleActions.ts](../../src/ui/battle/BattleScreen/useBattleActions.ts) | 出牌、弃牌、等待、结束回合等玩家操作。 |
| [usePlayback.ts](../../src/ui/battle/BattleScreen/usePlayback.ts) / [useBattleChoreo.ts](../../src/ui/battle/BattleScreen/useBattleChoreo.ts) / [choreoSteps.ts](../../src/ui/battle/BattleScreen/choreoSteps.ts) | 回放引擎 `steps` 的演出时间轴：镜头聚焦 → 蓄力 → 命中 → 顿帧。⚠ 顿帧期间要用墙钟时间排期，不能用缩放后的时间轴。 |
| [useBattleCamera.ts](../../src/ui/battle/BattleScreen/useBattleCamera.ts) / [battleCamera.ts](../../src/ui/battle/BattleScreen/battleCamera.ts) | 把相机系统接到战斗页。 |
| [useHandRender.ts](../../src/ui/battle/BattleScreen/useHandRender.ts) / [useFallenNotice.ts](../../src/ui/battle/BattleScreen/useFallenNotice.ts) | 手牌渲染用的数据；队员阵亡提示。 |

## 相机 `camera/`

`useCameraRig` 用 rAF 循环计算相机状态；`spring` 提供弹簧和冲量包络；`shots` 是镜头预设（包括命中冲量）；`timeline` 负责排期；`rigWriters` 把计算结果写进 DOM；`planeProjection` 把 3D 相机链在每个敌人的锚点处线性化成 2D 矩阵，避免立绘在推镜时被拉糊。

## 单位与 HUD

| 目录或文件 | 作用 |
| --- | --- |
| [unitShell.ts](../../src/ui/battle/unitShell.ts) | “战斗单位外壳”的跨组件约定：敌人的 `CombatantView` 和我方的 `AllyBar` 共用。 |
| [CombatantView/](../../src/ui/battle/CombatantView/CombatantView.tsx) / [EnemySprite/](../../src/ui/battle/EnemySprite/EnemySprite.tsx) | 场上的敌人：立绘、血条、状态、意图、命中率徽章；待机动画由纯 CSS 横向拼条循环播放。 |
| [AllyBar/](../../src/ui/battle/AllyBar/AllyBar.tsx) | 我方队伍的玻璃头像卡。 |
| [HandTray/](../../src/ui/battle/HandTray/HandTray.tsx) / [HandCard/](../../src/ui/battle/HandCard/HandCard.tsx) / [HandTools/](../../src/ui/battle/HandTools/HandTools.tsx) | 手牌托盘、单张手牌（`parts/` 中有印记、模组标记、污染裂纹）、弃牌 / 重抽 / 等待工具。 |
| [handFocusStore.ts](../../src/ui/battle/handFocusStore.ts) | 手牌悬停状态的极小 store。单独抽出是为了性能：悬停变化不会让整个战斗页重新渲染。 |
| [CardInfoPanel/](../../src/ui/battle/CardInfoPanel/CardInfoPanel.tsx) | 画布右上角的固定卡牌说明面板。 |
| [ManaBar/](../../src/ui/battle/ManaBar/ManaBar.tsx) / [TurnTicker/](../../src/ui/battle/TurnTicker/TurnTicker.tsx) | 法力水晶；回合与时刻读数。 |
| [CardPile/](../../src/ui/battle/CardPile/CardPile.tsx) / [PileRail/](../../src/ui/battle/PileRail/PileRail.tsx) / [PileDrawer/](../../src/ui/battle/PileDrawer/PileDrawer.tsx) | 牌堆、牌堆入口栏、牌堆抽屉（同时支持“从牌堆挑一张”的选择模式）。 |
| [RelicRail/](../../src/ui/battle/RelicRail/RelicRail.tsx) / [BondRail/](../../src/ui/battle/BondRail/BondRail.tsx) / [ChallengeRail/](../../src/ui/battle/ChallengeRail/ChallengeRail.tsx) | 遗物栏、羁绊栏、挑战词条栏。 |
| [SquadBuffBar/](../../src/ui/battle/SquadBuffBar/SquadBuffBar.tsx) / [SquadBuffPicker/](../../src/ui/battle/SquadBuffPicker/SquadBuffPicker.tsx) | 小队增益栏；选择要兑现的增益。 |
| [BattleActions/](../../src/ui/battle/BattleActions/BattleActions.tsx) / [BattleSettingsPanel/](../../src/ui/battle/BattleSettingsPanel/BattleSettingsPanel.tsx) | 结束回合等主操作按钮；系统菜单（重开、撤退）。 |
| [BattleToast/](../../src/ui/battle/BattleToast/BattleToast.tsx) + [battleToastStore.ts](../../src/ui/battle/battleToastStore.ts) | 战斗内的轻提示。 |
| [SkillCutInCard/](../../src/ui/battle/SkillCutInCard/SkillCutInCard.tsx) | 出牌时的卡面亮相。 |
| [AmbienceLayer/](../../src/ui/battle/AmbienceLayer/AmbienceLayer.tsx) + [ambience.ts](../../src/ui/battle/ambience.ts) | 用 Canvas 绘制的场景粒子，按地图 id 选择预设。 |

## 演出预设（时长的唯一来源）

| 文件 | 作用 |
| --- | --- |
| [animations.ts](../../src/ui/battle/animations.ts) | 出牌动画预设：分类、首击特效、主色、时间轴参数。被 41 个文件引用。 |
| [animSfx.ts](../../src/ui/battle/animSfx.ts) | 动画和音效的时序对齐表。 |
| [hitFloats.ts](../../src/ui/battle/hitFloats.ts) | 把引擎的逐段命中明细展开成飘字序列和命中特效。 |
| [deathChoreo.ts](../../src/ui/battle/deathChoreo.ts) / [victoryChoreo.ts](../../src/ui/battle/victoryChoreo.ts) | 死亡消散的等待门槛；胜利面板的演出节奏。 |

## 攻击特效 `fx/`

| 目录 | 作用 |
| --- | --- |
| [HitFxLayer/](../../src/ui/battle/fx/HitFxLayer/HitFxLayer.tsx) | 敌我共用的命中表现（着色、时序、飘字）。 |
| `BasicSlashFx` / `BladeSlashFx` / `BloodSlashFx` / `IaiSlashFx` / `KeenEdgeFx` / `NeonCrossFx` / `TripleSlashFx` / `TriSlashFx` | 各类斩击特效，用 CSS 关键帧或几何生成。演示页直接引用这里的正式件，不另存副本。 |
| `TwinArrowFx` | 双箭特效（Canvas 绘制）。 |
| [AttackArtsFx/](../../src/ui/battle/fx/AttackArtsFx/README.md) | 十种攻击特效：斩击、箭、火、毒、神谕各两种，按 `art.id` 分发。详见目录内的 README。 |
| `DeathVanishFx` / `HurtVignette` | 死亡消散；我方受伤时的屏幕暗角。 |

## 胜利结算（战斗画布内）

[VictoryPanel/](../../src/ui/battle/VictoryPanel/VictoryPanel.tsx) 是主面板，由以下部分组成：`VictoryExpRow`（经验）、`VictoryDropSection`（能量档位与掉落）、`VictoryBoonTray`（治疗露珠、卡牌、装备箱）、`VictoryCardOffer`（卡牌候选）、`VictoryLootTray`（战利品盘）、`VictoryBackpack`、`VictoryPlaque` 和 `VictoryButton`。⚠ `VictoryPanel.tsx` 中丢弃物品时仍在用 `window.confirm`。

## 测试

`encounterLayout.test.ts`：检查遭遇战站位下，敌人立绘之间的最小间距。
