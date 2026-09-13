# 探索引擎

路径：`src/explore/`。管理一趟远征、房间图、物件事件、战斗接缝和背包，不负责具体战斗内部结算。与 `engine/` 平行、无 React 和副作用，可复制、可单测。

**房间制（没有「层」）**：一张地图就是一张房间网格图，房间总数 `MapDef.roomCount` 就是这张图的庞大程度。`generateDungeonRun` 在建局时生成整张图并落到起始房间，之后整趟远征不再重新生成。每个房间是一屏 1920×1080，最多连通上下左右 4 个房间（最多 4 座传送门，四座外观完全一致，方向只能从小地图读出）。粒子口径只有三项：**每移动 1 个房间 −5、每交互 1 个事件 −2、每进行 1 个战斗回合 −1**。

`ExploreState.round` 在房间制下只表示「当前房间的深度 + 1」，用于战斗档位爬升与事件池 `minRound` 门槛，不再是层号。原路由生成器另名为 `generateRouteRound` 保留，已不参与当前探索入口；下文关于桥接、限时揭示、旧事件池的描述属于保留模块。

房间内的阶段链为 `atNode → landed → resolving → atNode`；不处理物件可直接回到 `atNode` 且不扣粒子。敌人链为 `atNode → encounter → inBattle`：**进入战斗房或 BOSS 房立刻起黑影**，演出完成后由 `engageRoomThreat` 建局 —— 战斗房走节点战斗，胜利后清场并留在原房间；BOSS 房走推进战斗接缝，胜利即通关（房间制没有下一层）。领取奖励和背包规则继续由原会话结算处理。

| 房间制模块 | 职责 |
| --- | --- |
| `dungeon/types.ts` | 房间节点、出口方向、房间图状态与方向换算。 |
| `dungeon/generate.ts` | 网格房间图生成：生成树 + 少量环路、BFS 深度、BOSS 房与战斗房投放、地面槽位分配。全程用会话 RNG，同种子复现。 |
| `dungeon/session.ts` | 进入房间、站上传送门点亮目标、确认传送扣粒子、房间探索完成判定、场景进度回写房间图。 |
| `corridor/types.ts` | 房间内的位置、朝向、物件、传送门、遭遇状态与场景常量（含地面槽位表）。 |
| `corridor/session.ts` | 单个房间的场景展开（`buildRoomScene`）、交互距离、传送门判定、敌人阻挡、物件开启/取消和战后状态。 |
| `energy.ts` | 净化粒子的唯一改写口，会话与地牢模块共用。 |
| `../data/corridorCurios.ts` | 8 种物件的选项、效果和图集格位；黑影事件不写死档位，按房间深度抽。 |
| `../store/exploreCorridor.ts` | 保存位置、点亮/确认传送门、打开物件、遭遇演出结束后的原子战斗编排（只做克隆与提交）。 |

| 文件 | 作用 |
| --- | --- |
| [session.ts](../../src/explore/session.ts) · 宝箱怪遭遇 | 推进战斗与节点战斗共用的遭遇抽取口，t1-t3 按 15% 概率先替换为地图登记的宝箱怪遭遇。 |
| [types.ts](../../src/explore/types.ts) | 路由图、固定路线蓝图、节点事件、探索效果、队伍快照、三段血量、临时光环、能量/战斗档位、节点记录、背包和会话阶段类型；`ExploreState.difficulty` 保存出击所选难度，`dungeon` 保存整张房间图，`roomCount` 是地图的房间总数，`round` 只表示当前房间深度 + 1，`battlesWon` 是挑战契约的倒计时基准。`EventRisk` 标记风险事件分级，`FORCE_ITEM` 用于不可放弃的强制拾取，`GRANT_EQUIP` / `GRANT_MODULE` 用于生成随机装备或模组待拾取奖励；`pendingLoot`、`pendingBoons`、`pendingCardOffer`、`pendingExp`、`pendingActions` 与 `pendingStory` 分别承载战利品、战斗胜利额外奖励、卡牌候选、待落袋经验、治疗/净化等待办奖励和事件文案；装备箱保留生成时的掉落系数，避免战后能量扣除改变品质。`TrialDef` / `ActiveTrial` 与 `START_TRIAL` 描述挑战契约（探索层唯一跨房间生效的机制，倒计时按战斗场次走：`untilBattles` vs `battlesWon`；代码一律叫 trial 以避开 `engine/challenges` 的战斗挑战词条）：负面修正存 `trials` 而不并入 `auras`（允许叠加、到期必须撤掉），到期结算的展示数据落在 `trialReport`。 |
| [rules.ts](../../src/explore/rules.ts) | 房间图规模旋钮（`dungeon.energyPerRoomMove` / `battleRoomRatio` / `loopEdgeRatio` / `curiosPerRoom`）、交互粒子消耗、战斗档位、BOSS 缩放、团灭、投递口、能量档位和掉落品质权重。`battleTierWeights` 的下标语义已改为**当前房间的深度**（越深越难，超表长取最后一档），BOSS 房固定 t5 不读该表。`battleTierWeights` 是按层数加权的轮次战斗档位表，第 5 层压力低于第 4 层是有意设计的 BOSS 前缓冲轮。探索平衡优先改这里。`eventPool.trialNodes` 控制挑战节点的出现概率与轮次上限，其中 `maxRound` 是硬约束而非手感旋钮（最后一轮打完即通关，等不到结算奖励的那一拍）。 |
| [route.ts](../../src/explore/route.ts) | 路由段桥接生成、走线、通道映射与求解。每段入/出通道必须是双射；UI 隐藏桥接时不能读取求解结果。 |
| [boons.ts](../../src/explore/boons.ts) | 战斗胜利额外奖励纯逻辑：按敌人 `boonTable` 与掉落系数生成治疗露珠、卡牌奖励、随机装备箱和 1 阶模组箱，处理奖励拾取、固定值回血、装备箱/模组箱开具和统一放弃。模组箱在 1 阶清单内均匀随机（1 阶全部是 `fine`，没有可右移的档位），产出进 `pendingLoot`。 |
| [picnic.ts](../../src/explore/picnic.ts) | 远征技能《野餐》纯逻辑：合并六种临期食品、校验最多 4 份、精确匹配隐藏食谱，并生成随机祝福遗物或队伍体力兜底恢复。 |
| [relicBehaviors.ts](../../src/explore/relicBehaviors.ts) | 探索级遗物行为注册表：处理战斗胜利额外铜币、空白事件回血与战后体力极限恢复。 |
| [shop.ts](../../src/explore/shop.ts) | 交易终端纯逻辑：锁定货架与随机 BUFF 候选、报价校验、食品扣款、商品/服务结算和交易记录。 |
| [session.ts](../../src/explore/session.ts) | 会话状态机：建局（生成整张房间图并落到起始房间）、物件交互结算（固定 −2 粒子，`interactionCost` 是唯一口径）、黑影接缝 `engageRoomThreat`（战斗房 / BOSS 房分流）、战斗胜利后按 `battlesWon` 结算挑战契约、BOSS 房胜利即 `cleared`；以及旧路由的生成/揭示/选入口、到达节点、选项结算、食品门槛、推进、隐藏休息/NPC、待拾取物品、战斗胜利额外奖励、待办成长/治疗/净化奖励、经验暂存、临时光环、离场、轮次战斗事件、战斗接缝、能量/掉落系数、三段血量、背包、寄件、待污染请求和团灭清算。地图配置统一经 `difficultyMapConfig` 按所选难度解析，装备候选按对应难度稀有度上限截断。一次性援助物品可正常使用与丢弃，但 `shipHome` 通过 `canShipHome` 阻止寄回；物品保留在探索会话中直到 `runStore.bankEverything` 统一过滤销毁。`dropCoefficient` 统一合成能量、挑战和战斗临时额外掉率加成；`finishBattle` 仅将该额外值用于本场战利品与额外奖励的统一掉落系数，不写入后续探索节点奖励。存在 `roundPlans` 时按蓝图解析节点与桥接并从棋盘实际段数推进，否则保持随机生成链；轮末推进战斗先看地图的 `battleEncounterByRound` 是否钉死本轮遭遇战（钉死则跳过宝箱怪替换），节点战斗（战斗签）始终走随机池；事件效果通过 session RNG 生成加权 outcome，`FORCE_ITEM` 绕过 `pendingLoot`，`GRANT_EQUIP` / `GRANT_MODULE` 生成随机待拾取物品，`GRANT_RELIC` 与 `GRANT_RANDOM_RELIC` 统一生成去重后的待拾取遗物，`RELIC_OFFER` 则把去重后的若干件祝福遗物公开成 `relicOffer` 待办（指名 `relicIds` 按给定顺序，否则按稀有度随机抽；全被拿过时折 10 居民积分），玩家在奖励浮层挑一件后与装备候选同路进入 `pendingLoot`，污染请求保留在会话中等待编排层即时结算，普通事件物品仍先进入 `pendingLoot`，远征胜利奖励在处理完毕后才允许继续。`applyEffect` 的 `START_TRIAL` 写入 `trials`，`settleTrials` 在 `finishBattle` 里排在**所有早退之前**——房间制下战斗房与 BOSS 房都推进倒计时，放到节点战斗早退之后就只有 BOSS 战能结算了。 |
| [route.test.ts](../../src/explore/route.test.ts) | 桥接合法性、双射、入口到末段映射、递增桥接、无空白段和同种子复现。 |
| [session.test.ts](../../src/explore/session.test.ts) | 阶段机、节点保底、粒子、能量档位、六轮闭环、血量继承、团灭、背包和投递口。 |

关键边界：BOSS 房的收尾链为 `encounter → atNode → roundBattle → inBattle`（`engageRoomThreat` 内部走 `leaveRegion` + `engageRoundBattle`，档位固定 t5）；战斗房走 `encounter → landed → inBattle`，胜利后 `settleCorridorEncounter` + `syncRoomFromScene` 清场并回到 `atNode`。挑战契约的倒计时按**战斗场次**走（`untilBattles` vs `battlesWon`），战斗房与 BOSS 房同权，`settleTrials` 因此排在所有早退之前。节点成长链为 `resolving → pendingLoot/pendingActions → resting → npcEvent → npcResolving → atNode`。交易终端与普通分支事件并行：`landed` 阶段选择带 `OPEN_SHOP` 的选项后进入 `shopping`，`shop.ts` 负责原子交易，`closeShopping` 写入成交记录后直接回到 `atNode`。野餐链路由 `canPicnic` 限定在 `choosingEntry / atNode`，命中食谱时通过 `GRANT_RANDOM_RELIC` 把随机祝福遗物放入待拾取框。store 只负责克隆和编排，不把背包规则塞进 `engine`。
