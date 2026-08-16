# 战斗引擎

路径：`src/engine/`。纯 TypeScript，无 React、无 Zustand，可 `structuredClone`、可复现、适合单测。`BattleState` 不含函数，随机状态保存在状态内。

| 文件 | 作用 |
| --- | --- |
| [types.ts](../../src/engine/types.ts) | 引擎与 UI 共用的类型总集：卡牌、我方/敌方单位、效果、状态、战斗状态、挑战运行态、`EngineOps`、`EncounterModifier`、16 项 `StatBlock`、`StatModifier` 和 `ResistMode`。卡牌带 `contaminated` 标记，我方单位携带污染值、生病和怪癖快照；效果支持整场弃牌、弃牌批次速攻和随机回收计数来源。 |
| [types.ts](../../src/engine/types.ts) | 引擎与 UI 共用的类型总集：卡牌、弃牌触发、我方/敌方单位、效果、状态、战斗状态、挑战运行态、`EngineOps`、`EncounterModifier`、16 项 `StatBlock`、`StatModifier` 和 `ResistMode`。卡牌带 `contaminated` 标记，我方单位携带污染值、生病和怪癖快照；效果支持按计数取层数、按目标护盾加伤和全手牌标记；战斗状态包含待自动打出的弃牌队列 `pendingAutoPlays`。 |
| [rules.ts](../../src/engine/rules.ts) | 集中维护资源经济、抽牌基准、弃牌来源触发/计数口径、时刻推进、虚弱/易伤、命中上下限、概率封顶、格挡、我方濒死死亡骰、护盾战斗内常驻规则、负重、养成和卡组锻造规则；平衡调整优先看这里。 |
| [stats.ts](../../src/engine/stats.ts) | 属性结算唯一入口：面板合并、战斗内修正、命中/暴击/防御、按招式延迟计算先手、小队手牌/抽牌/费用/换牌/待机和负重。属性读取必须经过 `statOf`；`squadHandLimit` / `squadDrawCount` / `squadOpeningDrawCount` / `squadManaPerRound` / `squadRedrawLimit` / `squadWaitLimit` 提供不依赖 `BattleState` 的小队资源换算，战斗 helper 在此基础上读取开战快照；`burdenValue`、`burdenHitPenalty`、`burdenInitiativePenalty` 集中提供有效负重及两项惩罚。 |
| [stats.ts](../../src/engine/stats.ts) | 属性结算唯一入口：面板合并、战斗内修正、命中/暴击/防御、效果级命中修正、先手排程、小队手牌/抽牌和负重。属性读取必须经过 `statOf`；六个 `squad*` 资源 helper 负责不依赖战斗状态的基准、加成与封顶换算；负重先由 `burdenValue` 得到有效负重点数，再由两个惩罚 helper 向下取整，且只有我方承担负重。 |
| [rng.ts](../../src/engine/rng.ts) | mulberry32 可复现随机、整数/浮点/抽取、Fisher–Yates 洗牌。 |
| [ops.ts](../../src/engine/ops.ts) | 伤害、治疗、护盾、施加状态、战斗内属性修正、弃牌回调、状态生命周期和胜负判定等原语；我方 0 血进入濒死，再受伤按 `RULES.combat.downedDeathChance` 掷死亡骰；死亡时清空该角色抽牌堆/手牌/弃牌堆卡牌。护盾在战斗内跨回合保留，仅随战斗结束消失。敌人死亡和实际 HP 伤害在这里接入挑战判定。伤害顺序固定为状态修正 → 命中 → 暴击 → 防御 → 格挡 → 护盾 → HP → 荆棘；固定伤害跳过防御与格挡。 |
| [cost.ts](../../src/engine/cost.ts) | 卡牌生效费用唯一入口；按本回合弃牌或速攻出牌计数与可选阈值计算动态费用，并由出牌校验、记录和 UI 共享。 |
| [cardMarks.ts](../../src/engine/cardMarks.ts) | 卡牌实例标记注册表；当前提供心眼，打出后通过统一效果解释器触发标记效果。 |
| [cardText.ts](../../src/engine/cardText.ts) | 将卡牌说明中的 `{0}` / `{d0}` 占位符按施放者攻击力或治愈力渲染为具体基础数值。 |
| [discard.ts](../../src/engine/discard.ts) | 弃牌唯一入口：迁移牌堆、按规则累计本回合与整场弃牌计数；`custom` 触发立即结算，`useSelf` 进入自动出牌队列并在本次操作完成后冲刷，同时录制表现快照。 |
| [keywords.ts](../../src/engine/keywords.ts) | 卡牌词条注册表；统一承载共鸣、瞄准、登阶、日蚀、月蚀的待接落点。 |
| [challenges.ts](../../src/engine/challenges.ts) | 挑战词条注册表、随机抽取、克制/大屠杀/慈悲的判定与奖励计算；由 `ops.ts` 和 `battle.ts` 接入战斗真相点。 |
| [effects.ts](../../src/engine/effects.ts) | 将 `EffectDescriptor` 解释成引擎原语，并解析 primary、self、allFoes、randomFoe 等目标；支持按目标护盾加伤、计数取段数/层数/资源/抽牌、随机回收、弃牌批次速攻统计、全手牌标记和普通手牌转速攻。卡牌和敌人招式共用；`amount` 固定伤害，`multiplier` 按施放者攻击力计算，二者只能选一个。 |
| [statuses.ts](../../src/engine/statuses.ts) | 中毒、灼烧、再生、力量、粒子污染、锋利、不周山、虚弱、易伤、荆棘、眩晕、洞察等状态注册表。粒子污染永久可叠层，按层提高攻击伤害，闪避由 `stats.ts` 派生并封顶。状态通过 `ctx.ops` 调用原语，避免直接依赖引擎实现造成循环依赖。眩晕和洞察的实际处理分别在 AI 与 UI。 |
| [targeting.ts](../../src/engine/targeting.ts) | 存活单位、敌我查询和随机目标选择。没有站位仇恨，敌人从存活我方中等概率随机选目标。 |
| [deck.ts](../../src/engine/deck.ts) | 抽牌堆、手牌、弃牌堆和消耗堆；抽牌堆耗尽时洗回弃牌堆，并受小队手牌上限约束。 |
| [quirks.ts](../../src/engine/quirks.ts) | 污染阈值、每张污染卡增量、生病永久修正和怪癖注册表；永久状态不复用会在战斗结束清理的 `StatusInstance`。 |
| [pollution.ts](../../src/engine/pollution.ts) | 污染卡进入手牌时的纯战斗处理：所属角色污染值 `+2`、达到阈值归零、生病和随机怪癖即时写入当前战斗属性。 |
| [ai.ts](../../src/engine/ai.ts) | 敌人随机抽招与行动执行：按招式延迟开始蓄力、倍率预览、眩晕跳过、随机选目标和效果解释。每回合行动点在开始时补满，招式发动后按剩余行动点继续随机抽招，用尽后 `nextActTick = null`。 |
| [scheduler.ts](../../src/engine/scheduler.ts) | tick 调度核心。`advanceTick` 逐时刻推进并处理所有到点敌人；`flushPendingActs` 在回合结束继续推进时刻，直到所有蓄力招式和行动点清空，带死循环安全阀。 |
| [battle.ts](../../src/engine/battle.ts) | 建局、挑战抽取、回合开始、出牌、待机和结束回合编排；`waitTick` 只推进时刻，结束回合会清算所有敌人蓄力。支持动态费用、卡牌标记、弃牌批次和 `pendingChoice` 回收/取消 API；开局状态必须在 `startRound` 前施加，确保随机抽招的意图预览吃到状态修正。 |
| [index.ts](../../src/engine/index.ts) | UI/store 使用的公开 API 出口。 |
| [battle.test.ts](../../src/engine/battle.test.ts) | 初始化、速攻/普通牌时刻推进、中毒回合开始、敌人蓄力清算等核心行为测试。 |

依赖方向：`data -> engine/types`；`engine` 不依赖 UI/store。敌人招式各自声明 `delay`，AI 每次从招式池随机抽取并消耗行动点；修改结算口径时联读 `rules.ts`、`stats.ts`、`ops.ts`，不要从组件反推规则。
