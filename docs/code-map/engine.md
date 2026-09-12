# 战斗引擎

路径：`src/engine/`。纯 TypeScript，无 React、无 Zustand，可 `structuredClone`、可复现、适合单测。`BattleState` 不含函数，随机状态保存在状态内。

| 文件 | 作用 |
| --- | --- |
| [flee.ts](../../src/engine/flee.ts) | 回合结束的敌人离场通道，按 fleeAfterRound 记录专属逃跑演出并区别于 markDead，不会触发击杀被动或敌人奖励。 |
| [types.ts](../../src/engine/types.ts) | 引擎与 UI 共用的类型总集：卡牌、我方/敌方单位、效果、状态、战斗状态、挑战运行态、`EngineOps`、`EncounterModifier`、16 项 `StatBlock`、`StatModifier` 和 `ResistMode`。效果支持新瀑布条件、全额星辉支付、主目标生命条件、暴击回调与翻牌；待选项支持手牌 BUFF 操作和抽牌堆顶选择，战斗状态记录生效费用、星辉消耗及自动出牌抑制。 |
| [types.ts](../../src/engine/types.ts) | 引擎与 UI 共用的类型总集：卡牌、弃牌触发、我方/敌方单位、效果、状态、战斗状态、挑战运行态、`EngineOps`、`EncounterModifier`、16 项 `StatBlock`、`StatModifier` 和 `ResistMode`。卡牌带污染标记、状态与卡牌效果支持组装/共鸣/手牌操作和多事件被动；战斗状态包含自动出牌、星辉记账、瀑布标记、抽牌堆选择和手牌 BUFF 选择的可序列化运行态。 |
| [rules.ts](../../src/engine/rules.ts) | 集中维护资源经济、抽牌基准、弃牌来源触发/计数口径(含被动卡回收的 `passiveEnd`：不计数不触发)、时刻推进、虚弱/易伤、命中上下限、概率封顶、格挡、我方濒死死亡骰、星辉上限、铁壁防御、护盾战斗内常驻规则、锋利与八千代共用的加算增伤池、负重、养成和卡组锻造规则；平衡调整优先看这里。 |
| [stats.ts](../../src/engine/stats.ts) | 属性结算唯一入口：面板合并、战斗内修正、状态 `statMods` / `statModsPct`、命中/暴击/防御、按招式延迟计算先手、小队手牌/抽牌/费用/换牌/待机和负重。属性读取必须经过 `statOf`；`squadHandLimit(mods)` / `squadDrawCount(mods)` / `squadOpeningDrawCount(mods)` / `squadManaPerRound(mods)` / `squadRedrawLimit(mods)` / `squadWaitLimit(mods)` 提供不依赖 `BattleState` 的小队资源换算，战斗 helper 在此基础上读取开战快照；`burdenValue`、`burdenHitPenalty`、`burdenInitiativePenalty` 集中提供有效负重及两项惩罚。 |
| [stats.ts](../../src/engine/stats.ts) | 属性结算唯一入口：面板合并、战斗内修正、命中/暴击/防御、效果级命中修正、先手排程、小队手牌/抽牌和负重。属性读取必须经过 `statOf`；六个 `squad*` 资源 helper 负责不依赖战斗状态的基准、加成与封顶换算；负重先由 `burdenValue` 得到有效负重点数，再由两个惩罚 helper 向下取整，且只有我方承担负重。 |
| [hitPreview.ts](../../src/engine/hitPreview.ts) | 复用 `hitChance` 计算选中卡牌对指定目标的命中率预览；成熟培育替换卡读取成熟效果；无攻击效果、必中效果或无效目标返回 `null`；预览前把本卡的 `PLAY_STAT_BONUS` 临时写进施放者面板、算完原样撤回，保证攻击力/穿甲/命中类模组的预览数字与实际结算一致。 |
| [cardEffects.ts](../../src/engine/cardEffects.ts) | 卡牌当前生效效果的共享口径：`baseEffectsOf` 处理培育 `replace` 与卡牌自身基础效果，`activeEffectsOf` 在此基础上追加关键词效果；回响只重放基础效果。 |
| [insurance.ts](../../src/engine/insurance.ts) | 精算师保险机制的唯一真相点：读取单体/全队保险层数、受击增值、保险兑现与移除。 |
| [counters.ts](../../src/engine/counters.ts) | 战斗计数器的唯一读取入口；支持当前出牌费用/星辉消耗、抬费手牌数、最近吞噬费用与移除标记数，并保留共鸣、保险和弃牌批次计数。 |
| [rng.ts](../../src/engine/rng.ts) | mulberry32 可复现随机、整数/浮点/等概率与加权抽取、Fisher–Yates 洗牌。 |
| [relicBehaviors/](../../src/engine/relicBehaviors/) | 行为型遗物注册表与钩子派发：承载回合、出牌、洗牌、抽牌、暴击、跨半血与伤害修正等命令式机制；运行态只写入 `BattleRelic.data`。 |
| [relics.ts](../../src/engine/relics.ts) | 声明式战斗遗物的唯一分发入口；读取 `RelicSpec.on` / `effects` 并保留 `every` 计数，行为型遗物由 `relicBehaviors/` 并行处理。 |
| [ops.ts](../../src/engine/ops.ts) | 伤害、治疗、护盾、施加状态、战斗内属性修正、弃牌回调和胜负判定等原语；状态实例支持持续拍数、结构化数据、来源记录与清理，并提供丢牌/出牌、治疗及带攻击者上下文的护盾击破钩子；治疗返回实际治疗量，伤害进入命中、暴击、防御、格挡、护盾与 HP 管线，暴击确认后支持效果回调。 |
| [cost.ts](../../src/engine/cost.ts) | 卡牌生效费用唯一入口；支持本回合计数减费、标记级费用修正、纳刀费用覆盖、雷走回手层数和应星/星契的星辉抵扣。 |
| [cardMarks.ts](../../src/engine/cardMarks.ts) | 卡牌实例标记注册表；提供心眼、星契、沉重、剑冢、神眼、纳刀、逆流与多米诺，标记可声明费用修正、出牌前效果和弃牌触发效果。 |
| [cardText.ts](../../src/engine/cardText.ts) | 将卡牌说明中的 `{0}` / `{d0}` / `{c}` / `{k0}` 占位符按施放者攻击力或治愈力、培育实例状态渲染为具体数值。 |
| [discard.ts](../../src/engine/discard.ts) | 弃牌唯一入口：结算卡上标记的弃牌效果、派发状态钩子与 `cardDiscarded` 被动事件；迁移牌堆、累计弃牌计数、处理自动出牌队列，并在离手时清除沉重/纳刀/逆流，真实弃牌时清除多米诺标记。 |
| [passive.ts](../../src/engine/passive.ts) | 被动卡唯一真相点：按 `cardDiscarded`、`cardDrawn`、`cardPlayed`、`roundStart`、`roundEnd` 等事件分发 `effectsByTrigger`，并在回合结束回收被动卡。 |
| [cardFx.ts](../../src/engine/cardFx.ts) | 卡牌触发的演出录制与快照台账：`withDiscardRecorder`、`currentRecorder`、`ensureCardFxSnapshot`、`takeDiscardSnapshot`、`snapshotHp` 和 `recordCardTrigger`。单独成文件是为了打破 `discard.ts` ↔ `passive.ts` 的静态循环。 |
| [cultivate.ts](../../src/engine/cultivate.ts) | 培育卡实例的生命周期：进手与离手重置、回合开始递减、按指定步长递减、归零就绪判定，以及培育就绪后的有效主目标模式。 |
| [keywords.ts](../../src/engine/keywords.ts) | 卡牌词条注册表；瞄准支持锚定保留被瞄准、记录实际收割数，关键词效果可限制结算次数并追加一次性效果；同时承载回响基础效果扩散、各词条展示释义登记表与文本分段纯函数，并保留登阶、日蚀、月蚀的待接落点。 |
| [challenges.ts](../../src/engine/challenges.ts) | 挑战词条注册表、随机抽取、克制/大屠杀/慈悲的判定与奖励计算；由 `ops.ts` 和 `battle.ts` 接入战斗真相点。 |
| [effects.ts](../../src/engine/effects.ts) | 将 `EffectDescriptor` 解释成引擎原语；支持新条件、自动出牌时抑制瀑布/汇星、按计数缩放 `PLAY_STAT_BONUS` 与封顶的治疗/护盾加成。仍集中处理状态、资源、组装、手牌操作等通用效果；`REVEAL_CARDS` 转发给 `effectsReveal.ts`。 |
| [effectsDamage.ts](../../src/engine/effectsDamage.ts) | DAMAGE 的多段伤害管线：支持 onHit、onCrit、onKill、逐段随机目标、计数增段、目标状态增伤、吸血以及自身治疗溢出转给最伤队友。 |
| [effectsHand.ts](../../src/engine/effectsHand.ts) | 手牌与牌堆效果：弃牌预选、弃牌堆回收及标记、全手牌标记、牌型转换、培育/共鸣、随机变牌、复制入手、多张临时卡入手，以及手牌 BUFF 搬运、吞噬和拆解选择。 |
| [effectsReveal.ts](../../src/engine/effectsReveal.ts) | 翻牌效果唯一落点：费用递减自动出牌链、攻击牌自动使用或非攻击牌入手、抽牌堆顶候选选择；自动出牌复用卡牌演出记录，并抑制瀑布与汇星。 |
| [handChoice.ts](../../src/engine/handChoice.ts) | 无明的纯函数入口：统计当前卡牌基础效果与卡上标记中的手牌第一张/最后一张弃牌需求，供引擎与 UI 共用。 |
| [waterfall.ts](../../src/engine/waterfall.ts) | 当前费用瀑布判定的唯一真相点；处理天顶星强制触发、引力透镜重放瀑布效果，以及漂流状态的护盾回调。 |
| [battleChoices.ts](../../src/engine/battleChoices.ts) | 待选项的唯一结算入口：手牌标记搬运、吞噬、拆解，抽牌堆顶选择、弃牌回收与组装奖励选择。 |
| [cardBoon.ts](../../src/engine/cardBoon.ts) | 手牌激活态的唯一判定点：按培育就绪、减费、星辉抵扣、共鸣、弃牌回手层数、当前费用瀑布、计数型加成和当前成立条件返回卡牌收益分类。被动卡与不在手牌中的卡不激活。 |
| [statuses/prophet.ts](../../src/engine/statuses/prophet.ts) | 预言家状态定义：天顶星、引力透镜与漂流；具体瀑布行为统一由 `waterfall.ts` 执行。 |
| [statuses/](../../src/engine/statuses/) | 状态定义分表：`dot.ts` 负责持续伤害/治疗、反伤与生机培育加速, `botanist.ts` 负责双生花、根系联结、棘冠、常春藤刺与锚定瞄准, `buffs.ts` 负责通用增益与锋利增伤池, `swordsman.ts` 负责镜月、铁衣、风切、残心、残心·凝神与八千代, 其余文件负责保险、减益、控制与叠加策略；`index.ts` 合并并提供注册表。 |
| [statusLifecycle.ts](../../src/engine/statusLifecycle.ts) | 状态节拍唯一驱动入口：我方在回合结束推进一拍, 敌人在行动前按规则推进一拍；按 DOT/HOT → 衰减 → 到期钩子 → 清理顺序处理状态, 并负责敌人 DOT 致死和 tick 钩子。`runOwnerTempo` 按单位暴露拍点, 供回合结束逐个录动画帧。 |
| [targeting.ts](../../src/engine/targeting.ts) | 存活单位、敌我查询和随机目标选择。普通敌人优先在存活的嘲讽目标中等概率随机选取，没有嘲讽时从全部存活我方中随机选取；脚本敌人的强制目标由 `ai.ts` 保持优先。 |
| [deck.ts](../../src/engine/deck.ts) | 抽牌堆、手牌、弃牌堆和消耗堆；抽牌堆耗尽时洗回弃牌堆并派发遗物 `onShuffle`，每抽到一张牌分发被动 `cardDrawn` 与遗物 `onCardDrawn`，并受小队手牌上限约束；通过 `addCardToHand` 统一实例化并加入临时卡。 |
| [quirks.ts](../../src/engine/quirks.ts) | 污染阈值、每张污染卡增量、生病永久修正和怪癖注册表；永久状态不复用会在战斗结束清理的 `StatusInstance`。 |
| [pollution.ts](../../src/engine/pollution.ts) | 污染卡进入手牌时的纯战斗处理：所属角色污染值 `+2`、达到阈值归零、生病和随机怪癖即时写入当前战斗属性。 |
| [ai.ts](../../src/engine/ai.ts) | 敌人按招式权重抽招与行动执行：脚本敌人经 `enemyScript.ts` 按护盾状态和 AI 记忆选招，普通敌人保持随机抽招；按招式延迟开始蓄力、倍率预览、将招式级命中修正注入 DAMAGE 效果、行动前推进状态节拍(`runEnemyTempoPhase` 拆出, 供 `actAndRecord` 把 DOT/HOT 单独录成一帧播在出招之前)、眩晕跳过、随机或最高护盾目标选择和效果解释。每回合行动点在开始时补满，招式发动后按剩余行动点继续选招，用尽后 `nextActTick = null`。 |
| [enemyScript.ts](../../src/engine/enemyScript.ts) | 可序列化敌人行动脚本的纯逻辑：按我方护盾状态、后继权重和回收/喘息/重锤约束选择招式，更新行动记忆，并支持按最高护盾选择目标。 |
| [scheduler.ts](../../src/engine/scheduler.ts) | tick 调度核心。`advanceTick` 逐时刻推进并处理所有到点敌人；`flushPendingActs` 在回合结束继续推进时刻，直到所有蓄力招式和行动点清空，带死循环安全阀；敌人帧与敌人行动后触发的弃牌步骤都写入同一个 `FxRecorder`。 |
| [battle.ts](../../src/engine/battle.ts) | 建局、挑战抽取、回合开始、出牌、待机和结束回合编排；支持当前费用瀑布、星辉消耗记账、瀑布状态与被动触发、弃牌批次，并把待选项交给 `battleChoices.ts`。出牌按有效培育目标校验，关键词记录真实触发次数并按定义限制效果结算。 |
| [battleSetup.ts](../../src/engine/battleSetup.ts) | 建立战斗实例、生成我方与敌方运行态、初始化新增选择/瀑布字段；首回合由 `battle.ts` 编排启动。 |
| [squadBuff.ts](../../src/engine/squadBuff.ts) | 炼金术士小队组装纯逻辑：按有序的 A/B/C/D 部件去重、三件组装成功时消耗先取得的三件并保留第四件，按缺失部件读取建战时注入的攻击/防御/功能/被动奖励池；支持随机移除、全部消费、缺少部件抽取与待选择组装，并派发 `assembleSuccess` 被动事件。 |
| [index.ts](../../src/engine/index.ts) | UI/store 使用的公开 API 出口。 |
| [battle.test.ts](../../src/engine/battle.test.ts) | 初始化、速攻/普通牌时刻推进、状态节拍、敌人蓄力清算等核心行为测试。 |

依赖方向：`data -> engine/types`；`engine` 不依赖 UI/store。敌人招式各自声明 `delay`，AI 每次从招式池随机抽取并消耗行动点；修改结算口径时联读 `rules.ts`、`stats.ts`、`ops.ts`，不要从组件反推规则。
