# 战斗引擎

路径：`src/engine/`。纯 TypeScript，无 React、无 Zustand、副作用少，可复现并适合单测。

| 文件 | 作用 |
| --- | --- |
| [types.ts](../../src/engine/types.ts) | 战斗状态、卡牌、单位、效果、属性与修正层类型。 |
| [rules.ts](../../src/engine/rules.ts) | 战斗与卡组锻造规则常量；调平衡优先看这里。 |
| [stats.ts](../../src/engine/stats.ts) | 属性合并、命中/暴击/防御/先手、手牌与负重计算的唯一入口。 |
| [ops.ts](../../src/engine/ops.ts) | 伤害、治疗、护盾、状态与胜负等引擎原语。 |
| [effects.ts](../../src/engine/effects.ts) | 将声明式效果翻译为引擎原语；卡牌和敌人招式共用。 |
| [statuses.ts](../../src/engine/statuses.ts) | 状态注册表和状态行为钩子。 |
| [targeting.ts](../../src/engine/targeting.ts) | 存活单位查询与随机目标选择。 |
| [deck.ts](../../src/engine/deck.ts) | 抽牌堆、手牌、弃牌堆和消耗堆。 |
| [ai.ts](../../src/engine/ai.ts) | 敌人意图生成与行动执行。 |
| [scheduler.ts](../../src/engine/scheduler.ts) | tick 推进和敌人到点行动。 |
| [battle.ts](../../src/engine/battle.ts) | 建局、回合、出牌和结束回合编排。 |
| [index.ts](../../src/engine/index.ts) | UI/store 使用的公开 API。 |
| [battle.test.ts](../../src/engine/battle.test.ts) | 战斗核心行为测试。 |

依赖方向：`data -> engine/types`；`engine` 不依赖 UI/store。修改规则时通常联读 `rules.ts`、`stats.ts`、`ops.ts`，不要从组件反推结算口径。
