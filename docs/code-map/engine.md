# 战斗引擎

路径：`src/engine/`。纯 TypeScript，无 React、无 Zustand，可 `structuredClone`、可复现、适合单测。`BattleState` 不含函数，随机状态保存在状态内。

| 文件 | 作用 |
| --- | --- |
| [types.ts](../../src/engine/types.ts) | 引擎与 UI 共用的类型总集：卡牌、我方/敌方单位、效果、状态、战斗状态、挑战运行态、`EngineOps`、`EncounterModifier`、16 项 `StatBlock`、`StatModifier` 和 `ResistMode`。卡牌支持应星/临时牌与模组来源词条，效果支持瀑布条件、临时卡入手、体力极限恢复、按状态筛选目标、培育递减和本次出牌数值加成。 |
| [types.ts](../../src/engine/types.ts) | 引擎与 UI 共用的类型总集：卡牌、弃牌触发、我方/敌方单位、效果、状态、战斗状态、挑战运行态、`EngineOps`、`EncounterModifier`、16 项 `StatBlock`、`StatModifier` 和 `ResistMode`。卡牌带 `contaminated` 标记，我方单位携带污染值、生病和怪癖快照；效果支持护盾回收、按计数取层数、按目标护盾加伤和全手牌标记；状态支持护盾击破钩子，敌人支持可序列化 AI 记忆与行动脚本。战斗状态包含待自动打出的弃牌队列 `pendingAutoPlays`，`FxStep` 将敌人行动与弃牌触发统一为一条有序演出时间线。 |
| [rules.ts](../../src/engine/rules.ts) | 集中维护资源经济、抽牌基准、弃牌来源触发/计数口径(含被动卡回收的 `passiveEnd`：不计数不触发)、时刻推进、虚弱/易伤、命中上下限、概率封顶、格挡、我方濒死死亡骰、星辉上限、铁壁防御、护盾战斗内常驻规则、负重、养成和卡组锻造规则；平衡调整优先看这里。 |
| [stats.ts](../../src/engine/stats.ts) | 属性结算唯一入口：面板合并、战斗内修正、状态 `statMods` / `statModsPct`、命中/暴击/防御、按招式延迟计算先手、小队手牌/抽牌/费用/换牌/待机和负重。属性读取必须经过 `statOf`；`squadHandLimit` / `squadDrawCount` / `squadOpeningDrawCount` / `squadManaPerRound` / `squadRedrawLimit` / `squadWaitLimit` 提供不依赖 `BattleState` 的小队资源换算，战斗 helper 在此基础上读取开战快照；`burdenValue`、`burdenHitPenalty`、`burdenInitiativePenalty` 集中提供有效负重及两项惩罚。 |
| [stats.ts](../../src/engine/stats.ts) | 属性结算唯一入口：面板合并、战斗内修正、命中/暴击/防御、效果级命中修正、先手排程、小队手牌/抽牌和负重。属性读取必须经过 `statOf`；六个 `squad*` 资源 helper 负责不依赖战斗状态的基准、加成与封顶换算；负重先由 `burdenValue` 得到有效负重点数，再由两个惩罚 helper 向下取整，且只有我方承担负重。 |
| [hitPreview.ts](../../src/engine/hitPreview.ts) | 复用 `hitChance` 计算选中卡牌对指定目标的命中率预览；成熟培育替换卡读取成熟效果；无攻击效果、必中效果或无效目标返回 `null`；预览前把本卡的 `PLAY_STAT_BONUS` 临时写进施放者面板、算完原样撤回，保证攻击力/穿甲/命中类模组的预览数字与实际结算一致。 |
| [rng.ts](../../src/engine/rng.ts) | mulberry32 可复现随机、整数/浮点/等概率与加权抽取、Fisher–Yates 洗牌。 |
| [ops.ts](../../src/engine/ops.ts) | 伤害、治疗、护盾、施加状态、战斗内属性修正、弃牌回调和胜负判定等原语；状态实例支持持续拍数、结构化数据、来源记录与清理，并提供状态上下文及护盾击破钩子；我方 0 血进入濒死，再受伤按 `RULES.combat.downedDeathChance` 掷死亡骰；死亡时清空该角色抽牌堆/手牌/弃牌堆卡牌。护盾在战斗内跨回合保留，仅随战斗结束消失。敌人死亡和实际 HP 伤害在这里接入挑战判定。伤害顺序固定为状态修正 → 命中 → 暴击 → 防御 → 格挡 → 护盾 → HP → 荆棘；固定伤害跳过防御与格挡, 纯伤害跳过伤害状态修正。 |
| [cost.ts](../../src/engine/cost.ts) | 卡牌生效费用唯一入口；按 `costRule.per` 支持每 1 点计数线性减费、按 `stackCostRule` 读取卡牌实例累计层数(岚)，按本回合弃牌或速攻出牌计数与可选阈值计算动态费用，叠加标记级费用修正，并提供应星/星契的星辉抵扣与 UI 角标用量。 |
| [cardMarks.ts](../../src/engine/cardMarks.ts) | 卡牌实例标记注册表；提供心眼、星契与《沉重》，打出后通过统一效果解释器触发标记效果，星契同时被费用层识别为可用星辉支付，《沉重》由费用层追加 1 点费用并在打出后移除。 |
| [cardText.ts](../../src/engine/cardText.ts) | 将卡牌说明中的 `{0}` / `{d0}` / `{c}` / `{k0}` 占位符按施放者攻击力或治愈力、培育实例状态渲染为具体数值。 |
| [discard.ts](../../src/engine/discard.ts) | 弃牌唯一入口：`returnToHand` 触发把牌退回手牌并累计实例层数，真正的弃牌动作(manual/effect/cost)结束后分发被动卡的 `cardDiscarded` 事件；迁移牌堆、按规则累计本回合与整场弃牌计数；`custom` 触发立即结算，`useSelf` 进入自动出牌队列并在本次操作完成后冲刷，同时录制表现快照；通过 `ops.flushAutoPlays` 钩子供调度器在敌人行动后立即冲刷；手牌离手时同步清除《沉重》。 |
| [passive.ts](../../src/engine/passive.ts) | 被动卡唯一真相点：`isPassive` / `playableHandUids`(费用、瀑布、标记与转换的候选池一律排除被动卡) / `firePassive`(手牌里监听 `cardDiscarded`、`cardDrawn` 的被动卡各结算一次并各录一条演出步，带递归安全阀) / `recycleHandPassives`(回合结束按 `passiveEnd` 理由收进弃牌堆，不计弃牌数也不触发任何弃牌联动)。 |
| [cardFx.ts](../../src/engine/cardFx.ts) | 卡牌触发的演出录制与快照台账：`withDiscardRecorder`、`currentRecorder`、`ensureCardFxSnapshot`、`takeDiscardSnapshot`、`snapshotHp` 和 `recordCardTrigger`。单独成文件是为了打破 `discard.ts` ↔ `passive.ts` 的静态循环。 |
| [cultivate.ts](../../src/engine/cultivate.ts) | 培育卡实例的生命周期：进手与离手重置、回合开始递减、按指定步长递减和归零就绪判定。 |
| [keywords.ts](../../src/engine/keywords.ts) | 卡牌词条注册表；已实现瞄准的命中目标判定与触发次数结算，同时承载汇星、应星、瀑布、瞄准、培育的展示释义登记表与文本分段纯函数，并保留共鸣、登阶、日蚀、月蚀的待接落点。 |
| [challenges.ts](../../src/engine/challenges.ts) | 挑战词条注册表、随机抽取、克制/大屠杀/慈悲的判定与奖励计算；由 `ops.ts` 和 `battle.ts` 接入战斗真相点。 |
| [effects.ts](../../src/engine/effects.ts) | 将 `EffectDescriptor` 解释成引擎原语，并新增 LOSE_HP(按当前生命百分比失去生命)、击杀触发 `onKill`、低血加倍 `damageBonus.targetHpBelowPct`、按本卡累计层数加倍 `bonusMultiplierPerSelfStack`、护盾/治疗的计数加算倍率、`markPick: "eventCard"`(被动事件卡)与 `convertPick: "handAllFast"`(全速攻转普通并记 `lastConvertBatch`)；并解析 primary、self、allFoes、randomFoe、lowestHpAlly 等目标；随机目标支持按状态过滤，支持护盾回收、按目标有盾/无盾加伤、瀑布/高费用手牌条件、按随机存活角色归属的临时卡入手、培育初始化与递减、体力极限恢复、出牌期临时面板 `PLAY_STAT_BONUS`（目标恒为施放者，写进 `mods` 后记入 `state.playStatMods`，由 `battle.playCard` 在出牌结束逆向撤回）、持续状态、按施放者属性缩放状态层数、星契随机手牌筛选、计数取段数/层数/资源/抽牌、随机回收、弃牌批次速攻统计、全手牌标记和普通手牌转速攻，并提供本次出牌的星辉消耗/瞄准数值加成。卡牌和敌人招式共用；`amount` 固定伤害，`multiplier` 按施放者攻击力计算，二者只能选一个。 |
| [statuses/](../../src/engine/statuses/) | 状态定义分表：`dot.ts` 负责持续伤害/治疗与反伤, `buffs.ts` 负责增益, `debuffs.ts` 负责减益, `control.ts` 负责控制, `stacking.ts` 负责状态叠加策略、有效层数与分段独立计时, `index.ts` 合并并提供注册表。DOT/HOT 通过 `onTempo` 声明, 状态行为只经 `ctx.ops` 调用引擎原语。 |
| [statusLifecycle.ts](../../src/engine/statusLifecycle.ts) | 状态节拍唯一驱动入口：我方在回合结束推进一拍, 敌人在行动前按规则推进一拍；按 DOT/HOT → 衰减 → 清理顺序处理状态, 并负责敌人 DOT 致死和 tick 钩子。`runOwnerTempo` 按单位暴露拍点, 供回合结束逐个录动画帧。 |
| [targeting.ts](../../src/engine/targeting.ts) | 存活单位、敌我查询和随机目标选择。普通敌人优先在存活的嘲讽目标中等概率随机选取，没有嘲讽时从全部存活我方中随机选取；脚本敌人的强制目标由 `ai.ts` 保持优先。 |
| [deck.ts](../../src/engine/deck.ts) | 抽牌堆、手牌、弃牌堆和消耗堆；每抽到一张牌分发一次被动 `cardDrawn` 事件并回填 `ops.draw`；抽牌堆耗尽时洗回弃牌堆，并受小队手牌上限约束；通过 `addCardToHand` 统一实例化并加入临时卡。 |
| [quirks.ts](../../src/engine/quirks.ts) | 污染阈值、每张污染卡增量、生病永久修正和怪癖注册表；永久状态不复用会在战斗结束清理的 `StatusInstance`。 |
| [pollution.ts](../../src/engine/pollution.ts) | 污染卡进入手牌时的纯战斗处理：所属角色污染值 `+2`、达到阈值归零、生病和随机怪癖即时写入当前战斗属性。 |
| [ai.ts](../../src/engine/ai.ts) | 敌人按招式权重抽招与行动执行：脚本敌人经 `enemyScript.ts` 按护盾状态和 AI 记忆选招，普通敌人保持随机抽招；按招式延迟开始蓄力、倍率预览、将招式级命中修正注入 DAMAGE 效果、行动前推进状态节拍(`runEnemyTempoPhase` 拆出, 供 `actAndRecord` 把 DOT/HOT 单独录成一帧播在出招之前)、眩晕跳过、随机或最高护盾目标选择和效果解释。每回合行动点在开始时补满，招式发动后按剩余行动点继续选招，用尽后 `nextActTick = null`。 |
| [enemyScript.ts](../../src/engine/enemyScript.ts) | 可序列化敌人行动脚本的纯逻辑：按我方护盾状态、后继权重和回收/喘息/重锤约束选择招式，更新行动记忆，并支持按最高护盾选择目标。 |
| [scheduler.ts](../../src/engine/scheduler.ts) | tick 调度核心。`advanceTick` 逐时刻推进并处理所有到点敌人；`flushPendingActs` 在回合结束继续推进时刻，直到所有蓄力招式和行动点清空，带死循环安全阀；敌人帧与敌人行动后触发的弃牌步骤都写入同一个 `FxRecorder`。 |
| [battle.ts](../../src/engine/battle.ts) | 建局、挑战抽取、回合开始、出牌、待机和结束回合编排；`waitTick` 只推进时刻，结束回合会清算所有敌人蓄力。支持动态费用、应星自动支付、唯一最高费瀑布、卡牌标记、弃牌批次和 `pendingChoice` 回收/取消 API；出牌推进时刻、结束回合清算与回合结束弃牌共享 recorder，按真实发生顺序产出 `FxStep[]`；开局状态必须在 `startRound` 前施加，确保随机抽招的意图预览吃到状态修正。 |
| [index.ts](../../src/engine/index.ts) | UI/store 使用的公开 API 出口。 |
| [battle.test.ts](../../src/engine/battle.test.ts) | 初始化、速攻/普通牌时刻推进、状态节拍、敌人蓄力清算等核心行为测试。 |

依赖方向：`data -> engine/types`；`engine` 不依赖 UI/store。敌人招式各自声明 `delay`，AI 每次从招式池随机抽取并消耗行动点；修改结算口径时联读 `rules.ts`、`stats.ts`、`ops.ts`，不要从组件反推规则。
