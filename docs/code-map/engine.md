# 战斗引擎

路径：`src/engine/`。纯 TypeScript，无 React、无 Zustand，可 `structuredClone`、可复现、适合单测。`BattleState` 不含函数，随机状态保存在状态内。

| 文件 | 作用 |
| --- | --- |
| [types.ts](../../src/engine/types.ts) | 引擎与 UI 共用的类型总集：卡牌、我方/敌方单位、效果、状态、战斗状态、挑战运行态、`EngineOps`、`EncounterModifier`、16 项 `StatBlock`、`StatModifier` 和 `ResistMode`。卡牌带 `contaminated` 标记，我方单位携带污染值、生病和怪癖快照；概率与百分比存百分点整数。 |
| [rules.ts](../../src/engine/rules.ts) | 集中维护资源经济、抽牌基准、时刻推进、虚弱/易伤、命中上下限、概率封顶、格挡、负重、养成和卡组锻造规则；平衡调整优先看这里。 |
| [stats.ts](../../src/engine/stats.ts) | 属性结算唯一入口：面板合并、战斗内修正、命中/暴击/防御、先手排程、小队手牌/抽牌和负重。属性读取必须经过 `statOf`；负重换算由 `burdenPenalty` 统一提供，且只有我方承担负重。 |
| [rng.ts](../../src/engine/rng.ts) | mulberry32 可复现随机、整数/浮点/抽取、Fisher–Yates 洗牌。 |
| [ops.ts](../../src/engine/ops.ts) | 伤害、治疗、护盾、施加状态、战斗内属性修正、状态生命周期和胜负判定等原语；敌人死亡和实际 HP 伤害在这里接入挑战判定。伤害顺序固定为状态修正 → 命中 → 暴击 → 防御 → 格挡 → 护盾 → HP → 荆棘；固定伤害跳过防御与格挡。 |
| [challenges.ts](../../src/engine/challenges.ts) | 挑战词条注册表、随机抽取、克制/大屠杀/慈悲的判定与奖励计算；由 `ops.ts` 和 `battle.ts` 接入战斗真相点。 |
| [effects.ts](../../src/engine/effects.ts) | 将 `EffectDescriptor` 解释为引擎原语，并解析 primary、self、allFoes、randomFoe 等目标。卡牌和敌人招式共用；`amount` 固定伤害，`multiplier` 按施放者攻击力计算，二者只能选一个。 |
| [statuses.ts](../../src/engine/statuses.ts) | 中毒、灼烧、再生、力量、虚弱、易伤、荆棘、眩晕、洞察等状态注册表。状态通过 `ctx.ops` 调用原语，避免直接依赖引擎实现造成循环依赖。眩晕和洞察的实际处理分别在 AI 与 UI。 |
| [targeting.ts](../../src/engine/targeting.ts) | 存活单位、敌我查询和随机目标选择。没有站位仇恨，敌人从存活我方中等概率随机选目标。 |
| [deck.ts](../../src/engine/deck.ts) | 抽牌堆、手牌、弃牌堆和消耗堆；抽牌堆耗尽时洗回弃牌堆，并受小队手牌上限约束。 |
| [quirks.ts](../../src/engine/quirks.ts) | 污染阈值、每张污染卡增量、生病永久修正和怪癖注册表；永久状态不复用会在战斗结束清理的 `StatusInstance`。 |
| [pollution.ts](../../src/engine/pollution.ts) | 污染卡进入手牌时的纯战斗处理：所属角色污染值 `+2`、达到阈值归零、生病和随机怪癖即时写入当前战斗属性。 |
| [ai.ts](../../src/engine/ai.ts) | 敌人意图生成与行动执行：倍率预览、眩晕跳过、随机选目标、效果解释和行动后重排。 |
| [scheduler.ts](../../src/engine/scheduler.ts) | tick 调度核心。`advanceTick` 逐时刻推进，处理所有到点敌人并安排下次行动，带死循环安全阀。 |
| [battle.ts](../../src/engine/battle.ts) | 建局、挑战抽取、回合开始、出牌、结束回合编排。支持跨战斗 `startHp` 和 `EncounterModifier`；开局状态必须在 `startRound` 前施加，确保意图预览吃到状态修正。 |
| [index.ts](../../src/engine/index.ts) | UI/store 使用的公开 API 出口。 |
| [battle.test.ts](../../src/engine/battle.test.ts) | 初始化、速攻/普通牌时刻推进、中毒回合开始、回合末冲刷等核心行为测试。 |

依赖方向：`data -> engine/types`；`engine` 不依赖 UI/store。修改结算口径时联读 `rules.ts`、`stats.ts`、`ops.ts`，不要从组件反推规则。
