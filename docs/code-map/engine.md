# 战斗引擎

路径：`src/engine/`。纯 TypeScript，无 React、无 Zustand，可 `structuredClone`、可复现、适合单测。`BattleState` 不含函数，随机状态保存在状态内。

| 文件 | 作用 |
| --- | --- |
| [types.ts](../../src/engine/types.ts) | 引擎与 UI 共用的类型总集：卡牌、我方/敌方单位、效果、状态、战斗状态、挑战运行态、`EngineOps`、`EncounterModifier`、16 项 `StatBlock`、`StatModifier` 和 `ResistMode`。卡牌支持应星/临时牌，状态支持持续回合与每层属性修正，效果支持瀑布条件、临时卡入手和体力极限恢复。 |
| [types.ts](../../src/engine/types.ts) | 引擎与 UI 共用的类型总集：卡牌、弃牌触发、我方/敌方单位、效果、状态、战斗状态、挑战运行态、`EngineOps`、`EncounterModifier`、16 项 `StatBlock`、`StatModifier` 和 `ResistMode`。卡牌带 `contaminated` 标记，我方单位携带污染值、生病和怪癖快照；效果支持护盾回收、按计数取层数、按目标护盾加伤和全手牌标记；状态支持护盾击破钩子，敌人支持可序列化 AI 记忆与行动脚本。战斗状态包含待自动打出的弃牌队列 `pendingAutoPlays`，`FxStep` 将敌人行动与弃牌触发统一为一条有序演出时间线。 |
| [rules.ts](../../src/engine/rules.ts) | 集中维护资源经济、抽牌基准、弃牌来源触发/计数口径、时刻推进、虚弱/易伤、命中上下限、概率封顶、格挡、我方濒死死亡骰、中毒每层 5 点伤害、星辉上限、再生回复和铁壁防御、护盾战斗内常驻规则、负重、养成和卡组锻造规则；平衡调整优先看这里。 |
| [stats.ts](../../src/engine/stats.ts) | 属性结算唯一入口：面板合并、战斗内修正、状态 `statMods` / `statModsPct`、命中/暴击/防御、按招式延迟计算先手、小队手牌/抽牌/费用/换牌/待机和负重。属性读取必须经过 `statOf`；`squadHandLimit` / `squadDrawCount` / `squadOpeningDrawCount` / `squadManaPerRound` / `squadRedrawLimit` / `squadWaitLimit` 提供不依赖 `BattleState` 的小队资源换算，战斗 helper 在此基础上读取开战快照；`burdenValue`、`burdenHitPenalty`、`burdenInitiativePenalty` 集中提供有效负重及两项惩罚。 |
| [stats.ts](../../src/engine/stats.ts) | 属性结算唯一入口：面板合并、战斗内修正、命中/暴击/防御、效果级命中修正、先手排程、小队手牌/抽牌和负重。属性读取必须经过 `statOf`；六个 `squad*` 资源 helper 负责不依赖战斗状态的基准、加成与封顶换算；负重先由 `burdenValue` 得到有效负重点数，再由两个惩罚 helper 向下取整，且只有我方承担负重。 |
| [hitPreview.ts](../../src/engine/hitPreview.ts) | 复用 `hitChance` 计算选中卡牌对指定目标的命中率预览；成熟培育替换卡读取成熟效果；无攻击效果、必中效果或无效目标返回 `null`。 |
| [rng.ts](../../src/engine/rng.ts) | mulberry32 可复现随机、整数/浮点/等概率与加权抽取、Fisher–Yates 洗牌。 |
| [ops.ts](../../src/engine/ops.ts) | 伤害、治疗、护盾、施加状态、战斗内属性修正、弃牌回调、状态生命周期和胜负判定等原语；状态统一支持持续回合扣减、结构化数据、来源记录与清理，并提供体力极限恢复和护盾击破钩子；我方 0 血进入濒死，再受伤按 `RULES.combat.downedDeathChance` 掷死亡骰；死亡时清空该角色抽牌堆/手牌/弃牌堆卡牌。护盾在战斗内跨回合保留，仅随战斗结束消失。敌人死亡和实际 HP 伤害在这里接入挑战判定。伤害顺序固定为状态修正 → 命中 → 暴击 → 防御 → 格挡 → 护盾 → HP → 荆棘；固定伤害跳过防御与格挡。 |
| [cost.ts](../../src/engine/cost.ts) | 卡牌生效费用唯一入口；按本回合弃牌或速攻出牌计数与可选阈值计算动态费用，叠加标记级费用修正，并提供应星/星契的星辉抵扣与 UI 角标用量。 |
| [cardMarks.ts](../../src/engine/cardMarks.ts) | 卡牌实例标记注册表；提供心眼、星契与《沉重》，打出后通过统一效果解释器触发标记效果，星契同时被费用层识别为可用星辉支付，《沉重》由费用层追加 1 点费用并在打出后移除。 |
| [cardText.ts](../../src/engine/cardText.ts) | 将卡牌说明中的 `{0}` / `{d0}` / `{c}` / `{k0}` 占位符按施放者攻击力或治愈力、培育实例状态渲染为具体数值。 |
| [discard.ts](../../src/engine/discard.ts) | 弃牌唯一入口：迁移牌堆、按规则累计本回合与整场弃牌计数；`custom` 触发立即结算，`useSelf` 进入自动出牌队列并在本次操作完成后冲刷，同时录制表现快照；通过 `ops.flushAutoPlays` 钩子供调度器在敌人行动后立即冲刷。 |
| [cultivate.ts](../../src/engine/cultivate.ts) | 培育卡实例的生命周期：进手与离手重置、回合开始递减、归零就绪判定。 |
| [keywords.ts](../../src/engine/keywords.ts) | 卡牌词条注册表；已实现瞄准的命中目标判定与触发次数结算，同时承载汇星、应星、瀑布、瞄准、培育的展示释义登记表与文本分段纯函数，并保留共鸣、登阶、日蚀、月蚀的待接落点。 |
| [challenges.ts](../../src/engine/challenges.ts) | 挑战词条注册表、随机抽取、克制/大屠杀/慈悲的判定与奖励计算；由 `ops.ts` 和 `battle.ts` 接入战斗真相点。 |
| [effects.ts](../../src/engine/effects.ts) | 将 `EffectDescriptor` 解释成引擎原语，并解析 primary、self、allFoes、randomFoe、lowestHpAlly 等目标；支持护盾回收、按目标有盾/无盾加伤、瀑布/高费用手牌条件、按随机存活角色归属的临时卡入手、培育初始化、体力极限恢复、持续状态、星契随机手牌筛选、计数取段数/层数/资源/抽牌、随机回收、弃牌批次速攻统计、全手牌标记和普通手牌转速攻。卡牌和敌人招式共用；`amount` 固定伤害，`multiplier` 按施放者攻击力计算，二者只能选一个。 |
| [statuses.ts](../../src/engine/statuses.ts) | 中毒、灼烧、再生、星辉、铁壁、力量、粒子污染、锋利、不周山、虚弱、易伤、荆棘、眩晕、洞察、瞄准、龙舌兰、充能外壳、破甲、萎靡、仙人掌、生机、坚固、嘲讽等状态注册表。中毒每层每回合开始造成 5 点无视护盾伤害；再生按层固定回复并由 `duration` 过期，生机读取施加者治愈力并按回合开始持续治疗；铁壁/破甲/坚固按层提供属性修正，龙舌兰与萎靡通过状态百分比修正调整攻击，仙人掌在有护盾且被攻击后反伤。粒子污染永久可叠层，按层提高攻击伤害，闪避由 `stats.ts` 派生并封顶。状态通过 `ctx.ops` 调用原语，避免直接依赖引擎实现造成循环依赖。眩晕对我方按回合扣层并由出牌入口封牌，对敌人按行动次数扣层并跳过行动，嘲讽由普通敌人目标选择读取，洞察的实际处理在 UI。 |
| [targeting.ts](../../src/engine/targeting.ts) | 存活单位、敌我查询和随机目标选择。普通敌人优先在存活的嘲讽目标中等概率随机选取，没有嘲讽时从全部存活我方中随机选取；脚本敌人的强制目标由 `ai.ts` 保持优先。 |
| [deck.ts](../../src/engine/deck.ts) | 抽牌堆、手牌、弃牌堆和消耗堆；抽牌堆耗尽时洗回弃牌堆，并受小队手牌上限约束；通过 `addCardToHand` 统一实例化并加入临时卡。 |
| [quirks.ts](../../src/engine/quirks.ts) | 污染阈值、每张污染卡增量、生病永久修正和怪癖注册表；永久状态不复用会在战斗结束清理的 `StatusInstance`。 |
| [pollution.ts](../../src/engine/pollution.ts) | 污染卡进入手牌时的纯战斗处理：所属角色污染值 `+2`、达到阈值归零、生病和随机怪癖即时写入当前战斗属性。 |
| [ai.ts](../../src/engine/ai.ts) | 敌人按招式权重抽招与行动执行：脚本敌人经 `enemyScript.ts` 按护盾状态和 AI 记忆选招，普通敌人保持随机抽招；按招式延迟开始蓄力、倍率预览、将招式级命中修正注入 DAMAGE 效果、眩晕跳过、随机或最高护盾目标选择和效果解释。每回合行动点在开始时补满，招式发动后按剩余行动点继续选招，用尽后 `nextActTick = null`。 |
| [enemyScript.ts](../../src/engine/enemyScript.ts) | 可序列化敌人行动脚本的纯逻辑：按我方护盾状态、后继权重和回收/喘息/重锤约束选择招式，更新行动记忆，并支持按最高护盾选择目标。 |
| [scheduler.ts](../../src/engine/scheduler.ts) | tick 调度核心。`advanceTick` 逐时刻推进并处理所有到点敌人；`flushPendingActs` 在回合结束继续推进时刻，直到所有蓄力招式和行动点清空，带死循环安全阀；敌人帧与敌人行动后触发的弃牌步骤都写入同一个 `FxRecorder`。 |
| [battle.ts](../../src/engine/battle.ts) | 建局、挑战抽取、回合开始、出牌、待机和结束回合编排；`waitTick` 只推进时刻，结束回合会清算所有敌人蓄力。支持动态费用、应星自动支付、唯一最高费瀑布、卡牌标记、弃牌批次和 `pendingChoice` 回收/取消 API；出牌推进时刻、结束回合清算与回合结束弃牌共享 recorder，按真实发生顺序产出 `FxStep[]`；开局状态必须在 `startRound` 前施加，确保随机抽招的意图预览吃到状态修正。 |
| [index.ts](../../src/engine/index.ts) | UI/store 使用的公开 API 出口。 |
| [battle.test.ts](../../src/engine/battle.test.ts) | 初始化、速攻/普通牌时刻推进、中毒回合开始、敌人蓄力清算等核心行为测试。 |

依赖方向：`data -> engine/types`；`engine` 不依赖 UI/store。敌人招式各自声明 `delay`，AI 每次从招式池随机抽取并消耗行动点；修改结算口径时联读 `rules.ts`、`stats.ts`、`ops.ts`，不要从组件反推规则。
