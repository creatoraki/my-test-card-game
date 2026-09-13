# 探索引擎

路径：`src/explore/`。管理一趟远征、路由图、节点事件、轮次战斗事件和背包，不负责具体战斗内部结算。与 `engine/` 平行、无 React 和副作用，可复制、可单测。

常规一轮是 5 通道 × 4 推进段的路由图，完成节点后进入轮次战斗事件流程；新手关卡前三轮由 `RouteBoardPlan` 提供 1/2/3 通道的固定路线，完成后从地图选择带隐藏；其他地图仍走原有随机生成。一趟普通远征默认 6 轮，最后一轮为 BOSS。旧的危险度/残片模型已废弃，以净化粒子、能量档位和实物背包为准。

| 文件 | 作用 |
| --- | --- |
| [session.ts](../../src/explore/session.ts) · 宝箱怪遭遇 | 推进战斗与节点战斗共用的遭遇抽取口，t1-t3 按 15% 概率先替换为地图登记的宝箱怪遭遇。 |
| [types.ts](../../src/explore/types.ts) | 路由图、固定路线蓝图、节点事件、探索效果、队伍快照、三段血量、临时光环、能量/战斗档位、节点记录、背包和会话阶段类型；`ExploreState.difficulty` 保存出击所选难度。`EventRisk` 标记风险事件分级，`FORCE_ITEM` 用于不可放弃的强制拾取，`GRANT_EQUIP` / `GRANT_MODULE` 用于生成随机装备或模组待拾取奖励；`pendingLoot`、`pendingBoons`、`pendingCardOffer`、`pendingExp`、`pendingActions` 与 `pendingStory` 分别承载战利品、战斗胜利额外奖励、卡牌候选、待落袋经验、治疗/净化等待办奖励和事件文案；装备箱保留生成时的掉落系数，避免战后能量扣除改变品质。`TrialDef` / `ActiveTrial` 与 `START_TRIAL` 描述挑战契约（探索层唯一跨轮生效的机制，代码一律叫 trial 以避开 `engine/challenges` 的战斗挑战词条）：负面修正存 `trials` 而不并入 `auras`（允许叠加、到期必须撤掉），到期结算的展示数据落在 `trialReport`。 |
| [rules.ts](../../src/explore/rules.ts) | 路由规模、桥接数和揭示时长、节点粒子消耗、轮次战斗档位、BOSS 缩放、团灭、投递口、能量档位和掉落品质权重。`battleTierWeights` 是按层数加权的轮次战斗档位表，第 5 层压力低于第 4 层是有意设计的 BOSS 前缓冲轮。探索平衡优先改这里。`eventPool.trialNodes` 控制挑战节点的出现概率与轮次上限，其中 `maxRound` 是硬约束而非手感旋钮（最后一轮打完即通关，等不到结算奖励的那一拍）。 |
| [route.ts](../../src/explore/route.ts) | 路由段桥接生成、走线、通道映射与求解。每段入/出通道必须是双射；UI 隐藏桥接时不能读取求解结果。 |
| [boons.ts](../../src/explore/boons.ts) | 战斗胜利额外奖励纯逻辑：按敌人 `boonTable` 与掉落系数生成治疗露珠、卡牌奖励、随机装备箱和 1 阶模组箱，处理奖励拾取、固定值回血、装备箱/模组箱开具和统一放弃。模组箱在 1 阶清单内均匀随机（1 阶全部是 `fine`，没有可右移的档位），产出进 `pendingLoot`。 |
| [picnic.ts](../../src/explore/picnic.ts) | 远征技能《野餐》纯逻辑：合并六种临期食品、校验最多 4 份、精确匹配隐藏食谱，并生成随机祝福遗物或队伍体力兜底恢复。 |
| [relicBehaviors.ts](../../src/explore/relicBehaviors.ts) | 探索级遗物行为注册表：处理战斗胜利额外铜币、空白事件回血与战后体力极限恢复。 |
| [shop.ts](../../src/explore/shop.ts) | 交易终端纯逻辑：锁定货架与随机 BUFF 候选、报价校验、食品扣款、商品/服务结算和交易记录。 |
| [session.ts](../../src/explore/session.ts) | 会话状态机：建局、生成/揭示/选入口、到达节点、选项结算、食品门槛、推进、隐藏休息/NPC、待拾取物品、战斗胜利额外奖励、待办成长/治疗/净化奖励、经验暂存、临时光环、离场、轮次战斗事件、战斗接缝、能量/掉落系数、三段血量、背包、寄件、待污染请求和团灭清算。地图配置统一经 `difficultyMapConfig` 按所选难度解析，装备候选按对应难度稀有度上限截断。`dropCoefficient` 统一合成能量、挑战和战斗临时额外掉率加成；`finishBattle` 仅将该额外值用于本场战利品与额外奖励的统一掉落系数，不写入后续探索节点奖励。存在 `roundPlans` 时按蓝图解析节点与桥接并从棋盘实际段数推进，否则保持随机生成链；轮末推进战斗先看地图的 `battleEncounterByRound` 是否钉死本轮遭遇战（钉死则跳过宝箱怪替换），节点战斗（战斗签）始终走随机池；事件效果通过 session RNG 生成加权 outcome，`FORCE_ITEM` 绕过 `pendingLoot`，`GRANT_EQUIP` / `GRANT_MODULE` 生成随机待拾取物品，`GRANT_RELIC` 与 `GRANT_RANDOM_RELIC` 统一生成去重后的待拾取遗物，`RELIC_OFFER` 则把去重后的若干件祝福遗物公开成 `relicOffer` 待办（指名 `relicIds` 按给定顺序，否则按稀有度随机抽；全被拿过时折 10 居民积分），玩家在奖励浮层挑一件后与装备候选同路进入 `pendingLoot`，污染请求保留在会话中等待编排层即时结算，普通事件物品仍先进入 `pendingLoot`，远征胜利奖励在处理完毕后才允许继续。挑战契约由 `pickNodes` 独立保底投放并上锁（每图 0-1 个、最后一轮不投），`applyEffect` 的 `START_TRIAL` 写入 `trials`，`settleTrials` 在 `finishBattle` 里夹在「节点战斗早退之后、通关早退之前」结算——节点战斗不推进轮号故不推进倒计时，而最后一轮的 BOSS 战必须能结算掉第 5 轮接下的契约。 |
| [route.test.ts](../../src/explore/route.test.ts) | 桥接合法性、双射、入口到末段映射、递增桥接、无空白段和同种子复现。 |
| [session.test.ts](../../src/explore/session.test.ts) | 阶段机、节点保底、粒子、能量档位、六轮闭环、血量继承、团灭、背包和投递口。 |

关键边界：流程收尾链为 `leaving → roundBattle → inBattle`；轮次战斗事件由 `session.roundBattleEvent` 读取文案，`engageRoundBattle` 按 `battleTierOf(round)` 与地图遭遇表写入建局接缝。节点成长链为 `resolving → pendingLoot/pendingActions → resting → npcEvent → npcResolving → atNode`。交易终端与普通分支事件并行：`landed` 阶段选择带 `OPEN_SHOP` 的选项后进入 `shopping`，`shop.ts` 负责原子交易，`closeShopping` 写入成交记录后直接回到 `atNode`。野餐链路由 `canPicnic` 限定在 `choosingEntry / atNode`，命中食谱时通过 `GRANT_RANDOM_RELIC` 把随机祝福遗物放入待拾取框。store 只负责克隆和编排，不把背包规则塞进 `engine`。
