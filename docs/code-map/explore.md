# 探索引擎

路径：`src/explore/`。管理一趟远征、路由图、节点事件、轮次战斗事件和背包，不负责具体战斗内部结算。与 `engine/` 平行、无 React 和副作用，可复制、可单测。

当前一轮是 5 通道 × 4 推进段的路由图，完成节点后进入轮次战斗事件流程；一趟远征默认 6 轮，最后一轮为 BOSS。旧的危险度/残片模型已废弃，以净化粒子、能量档位和实物背包为准。

| 文件 | 作用 |
| --- | --- |
| [types.ts](../../src/explore/types.ts) | 路由图、节点事件、探索效果、队伍快照、三段血量、临时光环、能量/战斗档位、节点记录、背包和会话阶段类型。`EventRisk` 标记风险事件分级，`FORCE_ITEM` 用于不可放弃的强制拾取；`pendingLoot`、`pendingBoons`、`pendingCardOffer`、`pendingExp`、`pendingActions` 与 `pendingStory` 分别承载战利品、战斗胜利额外奖励、卡牌候选、待落袋经验、治疗/净化等待办奖励和事件文案；装备箱保留生成时的掉落系数，避免战后能量扣除改变品质。 |
| [rules.ts](../../src/explore/rules.ts) | 路由规模、桥接数和揭示时长、节点粒子消耗、轮次战斗档位、BOSS 缩放、团灭、投递口、能量档位和掉落品质权重。探索平衡优先改这里。 |
| [route.ts](../../src/explore/route.ts) | 路由段桥接生成、走线、通道映射与求解。每段入/出通道必须是双射；UI 隐藏桥接时不能读取求解结果。 |
| [boons.ts](../../src/explore/boons.ts) | 战斗胜利额外奖励纯逻辑：按敌人 `boonTable` 与掉落系数生成治疗露珠、卡牌奖励和随机装备箱，处理奖励拾取、固定值回血、装备箱开具和统一放弃。 |
| [shop.ts](../../src/explore/shop.ts) | 交易终端纯逻辑：锁定货架与随机 BUFF 候选、报价校验、食品扣款、商品/服务结算和交易记录。 |
| [session.ts](../../src/explore/session.ts) | 会话状态机：建局、生成/揭示/选入口、到达节点、选项结算、食品门槛、推进、隐藏休息/NPC、待拾取物品、战斗胜利额外奖励、待办成长/治疗/净化奖励、经验暂存、临时光环、离场、轮次战斗事件、战斗接缝、能量/掉落系数、三段血量、背包、寄件、待污染请求和团灭清算。事件效果通过 session RNG 生成加权 outcome；`FORCE_ITEM` 绕过 `pendingLoot`，污染请求保留在会话中等待编排层即时结算，普通事件物品仍先进入 `pendingLoot`，远征胜利奖励在处理完毕后才允许继续。 |
| [route.test.ts](../../src/explore/route.test.ts) | 桥接合法性、双射、入口到末段映射、递增桥接、无空白段和同种子复现。 |
| [session.test.ts](../../src/explore/session.test.ts) | 阶段机、节点保底、粒子、能量档位、六轮闭环、血量继承、团灭、背包和投递口。 |

关键边界：流程收尾链为 `leaving → roundBattle → inBattle`；轮次战斗事件由 `session.roundBattleEvent` 读取文案，`engageRoundBattle` 按 `battleTierOf(round)` 与地图遭遇表写入建局接缝。节点成长链为 `resolving → pendingLoot/pendingActions → resting → npcEvent → npcResolving → atNode`。交易终端与普通分支事件并行：`landed` 阶段选择带 `OPEN_SHOP` 的选项后进入 `shopping`，`shop.ts` 负责原子交易，`closeShopping` 写入成交记录后直接回到 `atNode`。store 只负责克隆和编排，不把背包规则塞进 `engine`。
