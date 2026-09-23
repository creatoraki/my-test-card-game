# 状态层

路径：`src/store/`。Zustand 4。store 负责包裹纯逻辑层：每次操作先 `structuredClone`，再把副本交给 engine / explore 的纯函数处理，React 拿到的始终是新对象。store 不引用 `ui/`。

## 四个 store 的边界

| store | 生命周期 | 作用 |
| --- | --- | --- |
| [townStore.ts](../../src/store/town/townStore.ts) | **持久化**（localStorage，键名 `town-profile-v28`，版本号 30） | 城镇档案，存放跨远征的永久资产：角色卡组、装备、经验、居民积分、仓库、编队、阵亡名单、小队天赋、医疗室、图鉴、地图进度、商店与科技。本文件只负责拼装切片、建档 / 重置与「推进一日」。 |
| [runStore.ts](../../src/store/run/runStore.ts) | 内存 | 一次远征的流程编排：界面路由 `screen`、进出探索、建战斗、战后结算、撤离与回城。单向依赖 `townStore`。本文件只保留状态与路由，编排细节在 `store/run/`。 |
| [exploreStore.ts](../../src/store/explore/exploreStore.ts) | 内存（出击前会备份城镇档案） | 包裹 `explore/session/` 的远征会话本身。 |
| [battleStore.ts](../../src/store/battle/battleStore.ts) | 内存 | 包裹战斗引擎。出牌和结束回合会引出敌人行动与弃牌触发，引擎按发生顺序记为 `steps`，UI 逐步回放。 |
| [sortieStore.ts](../../src/store/sortie/sortieStore.ts) | 内存，**刻意不持久化** | 出击准备的临时会话：选地图、装背包。刷新页面即作废，避免半截的出击状态混进存档。 |

## townStore 的切片与辅助

| 文件 | 作用 |
| --- | --- |
| [townTypes.ts](../../src/store/town/townTypes.ts) / [townProfile.ts](../../src/store/town/townProfile.ts) | 城镇档案的状态形状；出厂档案（建档、重置、复苏共用）与训练点计算。 |
| [deckForgeSlice.ts](../../src/store/townSlices/deckForgeSlice.ts) | 卡组锻造：升级、抽卡、删卡、降低最小卡组下限、装备羁绊重铸。 |
| [storageSlice.ts](../../src/store/townSlices/storageSlice.ts) | 仓库与装备：落袋、出售、换金物变现、穿脱装备、卡牌模组装配、模组制造。 |
| [memberCareSlice.ts](../../src/store/townSlices/memberCareSlice.ts) | 队员生命周期：上下阵、阵亡与复苏、营养舱、圣水池。 |
| [conditionSlice.ts](../../src/store/townSlices/conditionSlice.ts) | 经验、污染与怪癖：发经验、污染 / 净化卡牌、战斗与回城时的状态回填。 |
| [squadTalentSlice.ts](../../src/store/townSlices/squadTalentSlice.ts) | 小队天赋：徽章选择与节点点亮 / 退还。 |
| [shopSlice.ts](../../src/store/townSlices/shopSlice.ts) + [shopStock.ts](../../src/store/town/shopStock.ts) | 据点商店的状态和每日货架生成。卡牌货位需要读取角色卡组，所以放在这里生成；物品货位交给 `data/shop/shop.ts`。 |
| [techTreeSlice.ts](../../src/store/townSlices/techTreeSlice.ts) | 研究中心的科技等级和研究动作。 |
| [equipCraftSlice.ts](../../src/store/townSlices/equipCraftSlice.ts) | 工房：装备升阶和羁绊重铸（包括待确认的重铸结果）。 |
| [mapProgressSlice.ts](../../src/store/townSlices/mapProgressSlice.ts) | 地图通关记录和每日通关状态。 |
| [curioTownSlice.ts](../../src/store/townSlices/curioTownSlice.ts) | 物件结算写回城镇档案的两个动作：增加污染、把某张卡换成普通卡。 |
| [characterStats.ts](../../src/store/town/characterStats.ts) | 由装备和羁绊推导角色面板与生命值（`deriveStats`、`vitalsOf`）。 |
| [deckCards.ts](../../src/store/town/deckCards.ts) | 卡组规则：稀有度和同名卡的携带上限、可用卡池、抽取稀有度、加卡。 |
| [expeditionBackup.ts](../../src/store/run/expeditionBackup.ts) | 出击时给城镇档案拍快照，刷新后回滚到出击前。⚠ 必须在 `townStore` 执行 `create(persist(...))` 之前回滚。 |
| [codexCollector.ts](../../src/store/town/codexCollector.ts) | 图鉴收集器，由 `main.tsx` 安装。它汇总城镇、探索、战斗三个 store 中出现过的卡牌、敌人和物品，写入 `townStore.recordCodex`。 |

## runStore 的拆分文件

| 文件 | 作用 |
| --- | --- |
| [run/types.ts](../../src/store/run/types.ts) | runStore 的状态形状与 `set` 签名，让编排模块不必反向引用 runStore。 |
| [run/party.ts](../../src/store/run/party.ts) | 城镇角色 → 探索队伍快照、换装后同步面板。 |
| [run/launchBattle.ts](../../src/store/run/launchBattle.ts) | 建一场战斗：合成羁绊、遗物、负重与能量档位修正。 |
| [run/battleAftermath.ts](../../src/store/run/battleAftermath.ts) | 战斗结算回填、重开、战中撤退、胜利面板确认。 |
| [run/expeditionEnd.ts](../../src/store/run/expeditionEnd.ts) | 远征收尾：落袋、通关奖励、结算页切换。 |
| [run/expeditionActions.ts](../../src/store/run/expeditionActions.ts) | 远征途中换装与「指定角色」类待办。 |
| [curioActions.ts](../../src/store/explore/curioActions.ts) | 物件决策、选择执行者、打开货商货架、购买。 |
| [exploreCorridor.ts](../../src/store/explore/exploreCorridor.ts) | 场景内操作：保存站位、站上传送门、伏击检定、行走扣粒子、传送与信标、打开或关闭物件、BOSS 红门、结束遭遇战。 |
| [exploreGrowthServices.ts](../../src/store/explore/exploreGrowthServices.ts) | 远征途中的装备调校和换卡服务。 |
| [exploreAftermath.ts](../../src/store/explore/exploreAftermath.ts) | 把远征中的污染、卡牌污染和阵亡角色的装备写回城镇档案。 |
| [picnicActions.ts](../../src/store/explore/picnicActions.ts) | 野餐结算后，落地遗物带来的污染变化。 |

## 常见数据流

- **出击**：`sortieStore` 装好背包 → `runStore.startExpedition` → 备份城镇档案 → `exploreStore.start` → 电梯过场 → 探索页。
- **战斗**：`runStore.enterEncounter` 建局，交给 `battleStore` → 战斗结束后由 `runStore.resolveBattle` 回填探索会话、发放经验和掉落。
- **回城**：`runStore.finishExpedition` / `backToTown` → 仓库入库、换金物折算积分、登记阵亡、推进一天（`townStore.advanceDay`，同时刷新货架）。

## 测试

`townStore.test.ts`（只有 15 行）。
