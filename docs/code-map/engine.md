# 战斗引擎

路径：`src/engine/`。纯 TypeScript 的战斗规则层，不依赖 React 和 store。UI 和 store 只能通过 [index.ts](../../src/engine/index.ts) 引入。所有函数都会直接修改传入的 `BattleState`，由 `store/battle/battleStore` 先克隆再调用。

## 规则真相点

| 文件 | 作用 |
| --- | --- |
| [rules.ts](../../src/engine/core/battleRules.ts) | 战斗与养成的全部数值旋钮（`RULES`），以及卡组升级、抽卡、删卡的费用函数。调平衡只改这里。 |
| [types/](../../src/engine/types/index.ts) | 引擎与 UI 共用的类型（只有类型），按领域分文件、由 `types/index.ts` 统一导出：`base`（阵营、挑战、目标）、`effects`（效果描述符）、`cards`、`statuses`、`stats`（属性面板）、`combatants`（战斗单位、遭遇战改造器）、`battleState`、`engineOps`（引擎原语）、`anim`（动画帧）。 |
| [hookRegistry.ts](../../src/engine/core/hookRegistry.ts) | 状态定义与行为型遗物的查表入口，不 import 任何运行时模块。`statuses/index`、`relics/relicBehaviors` 在加载时注册；ops、属性、伤害管线只查这张表，从而不与状态 / 遗物定义互相引用。⚠ 需先加载引擎入口（`engine/index` 或 `engine/battle/battle`）表才有内容。 |
| [stats.ts](../../src/engine/combat/stats.ts) | 属性换算的唯一入口：（基础 + 装备固定值）×（1 + 装备百分比）+ 战斗内修正；也提供命中率、暴击率、负重、精通等计算。 |
| [rng.ts](../../src/engine/core/rng.ts) | 可复现的随机数（mulberry32），状态存在 `BattleState.rngState` 中。⚠ 规则层禁止使用 `Math.random`。 |

## 战斗编排

| 文件 | 作用 |
| --- | --- |
| [battle.ts](../../src/engine/battle/battle.ts) | 对外的高层操作：`createBattle`、`startRound`、`canPlay` / `playBlockReason`、`playCard`、`discardHandCard`、`redrawHandCard`、`waitTick`、`endRound`。 |
| [battleSetup.ts](../../src/engine/battle/battleSetup.ts) | 根据遭遇战和队伍快照建局，注入敌人的基础命中和格挡。⚠ 直接读取 `import.meta.env.BattleTest`，开启时敌人只有 1 点生命。 |
| [scheduler.ts](../../src/engine/battle/scheduler.ts) | 时刻调度（本作核心）：打出普通牌推进 1 个时刻并结算到点的敌人行动；速攻牌不推进时刻。 |
| [statusLifecycle.ts](../../src/engine/combat/statusLifecycle.ts) | 按时刻和敌我阵营运行状态的持续与结算。 |
| [battleChoices.ts](../../src/engine/battle/battleChoices.ts) | 战斗中需要玩家做选择的结算与取消（例如从抽牌堆挑一张）。 |
| [flee.ts](../../src/engine/battle/flee.ts) | 敌人到点离场（宝箱怪）。 |

## 卡牌与效果

| 文件 | 作用 |
| --- | --- |
| [effects.ts](../../src/engine/effects/effects.ts) | 效果解释器：把声明式的 `EffectDescriptor` 翻译成引擎原语。卡牌和敌人招式共用。新增机制就在 `applyEffect` 里加一个分支。 |
| [effectsDamage.ts](../../src/engine/effects/effectsDamage.ts) / [effectsHand.ts](../../src/engine/effects/effectsHand.ts) / [effectsReveal.ts](../../src/engine/effects/effectsReveal.ts) / [effectsStatusMove.ts](../../src/engine/effects/effectsStatusMove.ts) / [effectsStrip.ts](../../src/engine/effects/effectsStrip.ts) | 从 `effects.ts` 拆出的效果分支：伤害、手牌与牌堆操作、翻看、状态转移、状态剥除。`effectsHand`、`effectsReveal` 需要回调 `resolveEffects` 时由 `effects.ts` 以参数注入，不反向 import。 |
| [effectConditions.ts](../../src/engine/effects/effectConditions.ts) | 效果的触发条件判定。 |
| [deck.ts](../../src/engine/deck/deck.ts) | 抽牌堆、手牌、弃牌堆、消耗堆之间的移动；抽空时把弃牌洗回抽牌堆。 |
| [discard.ts](../../src/engine/deck/discard.ts) | 弃牌的唯一入口：迁移牌堆、统计回合弃牌数、触发“被弃置时”效果。 |
| [cardFx.ts](../../src/engine/cards/cardFx.ts) | 弃牌联动与被动卡的演出记录器。单独成文件是为了打破 `discard` ↔ `passive` 的循环依赖。 |
| [passive.ts](../../src/engine/combat/passive.ts) / [passiveCards.ts](../../src/engine/cards/passiveCards.ts) | 被动卡：没有费用、不能打出，持在手中时按事件自动结算，回合结束时收入弃牌堆。 |
| [keywords.ts](../../src/engine/cards/keywords.ts) | 卡牌词条注册表，负责词条的判定和触发后的副作用。 |
| [cardMarks.ts](../../src/engine/cards/cardMarks.ts) / [cardEffects.ts](../../src/engine/cards/cardEffects.ts) | 卡面印记的定义；卡牌的基础效果和当前生效效果（已叠加印记与模组）。 |
| [cardBoon.ts](../../src/engine/cards/cardBoon.ts) | 判定手牌是否处于“激活态”（培育成熟、降费、星光支付、共鸣等条件已满足），供手牌高亮使用。 |
| [cardText.ts](../../src/engine/cards/cardText.ts) | 渲染卡牌说明文字（把 `{0}` 等占位符替换成实际数值）。 |
| [cost.ts](../../src/engine/cards/cost.ts) | 法力与星光费用的计算和支付。 |
| [cultivate.ts](../../src/engine/deck/cultivate.ts) / [waterfall.ts](../../src/engine/battle/waterfall.ts) / [fullDraw.ts](../../src/engine/deck/fullDraw.ts) / [handChoice.ts](../../src/engine/deck/handChoice.ts) | 角色专属机制：培育阶段、瀑布再演、`fullDraw` 效果的命中结算（与穿刺层数联动）、弃牌选择的数量计算。 |
| [counters.ts](../../src/engine/combat/counters.ts) / [pierce.ts](../../src/engine/combat/pierce.ts) / [insurance.ts](../../src/engine/combat/insurance.ts) | 计数器、穿刺层数、精算师的保险层数。 |

## 伤害与状态

| 文件 | 作用 |
| --- | --- |
| [damage/pipeline.ts](../../src/engine/damage/pipeline.ts) | 伤害结算管线，顺序固定为：乘区 → 命中前 → 命中 → 暴击 → 防御 → 格挡 → 护盾 → 扣血前 → 扣血 → 结算后。固定伤害跳过防御和格挡两段。 |
| [damage/modifiers.ts](../../src/engine/damage/modifiers.ts) / [damage/types.ts](../../src/engine/damage/types.ts) | 乘区收集：（基础 + 固定加成）×（1 + 造成百分比）× 造成倍率 ×（1 + 承受百分比）× 承受倍率，结果与状态挂上的先后顺序无关。 |
| [damage/preview.ts](../../src/engine/damage/preview.ts) / [hitPreview.ts](../../src/engine/combat/hitPreview.ts) | 不消耗随机数的伤害预览与命中率预览，已计入模组带来的出牌临时加成。 |
| [ops.ts](../../src/engine/core/ops.ts) | 引擎原语：治疗、护盾、施加状态、属性修正、死亡标记、胜负判定。所有效果最终都落到这里。 |
| [statuses/](../../src/engine/statuses/index.ts) | 状态定义（`STATUS_DEFS`），按类别拆分：增益、减益、持续伤害、控制、各角色专属、废弃楼层敌人专属。叠层与合并规则在 `stacking.ts`。 |
| [pollution.ts](../../src/engine/combat/pollution.ts) / [quirks.ts](../../src/engine/combat/quirks.ts) | 污染累积与抽到污染卡的登记；怪癖（如“生病”）的定义。 |
| [squadBuff.ts](../../src/engine/combat/squadBuff.ts) | 小队增益，以及炼金术士组装部件的收集和兑现。 |

## 敌人、遗物与挑战

| 文件 | 作用 |
| --- | --- |
| [ai.ts](../../src/engine/enemy/ai.ts) | 敌人蓄力、抽招和出手。 |
| [enemyMovePick.ts](../../src/engine/enemy/enemyMovePick.ts) / [enemyScript.ts](../../src/engine/enemy/enemyScript.ts) | 招式权重、条件偏好、目标选择，以及首领的状态机脚本。 |
| [targeting.ts](../../src/engine/combat/targeting.ts) | 敌我查询与嘲讽规则：有嘲讽单位时只能选它，否则在存活单位中随机选。 |
| [relics/](../../src/engine/relics/relics.ts)（relics.ts + relicBehaviors.ts + basic / uncommon / tutorial） | 声明式遗物的触发，以及行为型遗物（分基础、罕见、教程三组）。`runRelicHook` 从 `hookRegistry` 查行为表。`ops.dealDamage` 与 `ops.draw` 等同样是晚绑定：由 `damage/index`、`deck/deck` 等模块加载时挂到 `ops` 上。 |
| [challenges/defs.ts](../../src/engine/challenges/defs.ts) / [challenges/index.ts](../../src/engine/challenges/index.ts) | 挑战词条：定义表和运行时钩子。完成后的掉落加成会计入探索掉落系数。 |
| [animHits.ts](../../src/engine/core/animHits.ts) | 记录多段伤害每一段的命中明细，只给 UI 回放用，不参与结算。 |

## 测试

`battle.test.ts`、`relics.test.ts`。
