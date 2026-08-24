# 内容数据

路径：`src/data/`。这里放可替换的卡牌、角色、敌人、遭遇战、物品、探索事件和地图数据；规则计算留在 `engine/`、`explore/`、`items/`。

| 文件 | 作用 |
| --- | --- |
| [cards.ts](../../src/data/cards.ts) + [cards/](../../src/data/cards/) | `CARD_DEFS` 汇总入口；具体 `CardDef[]` 按角色放在 `cards/<角色>/index.ts` 中维护，基础卡仍由 `basicCards.ts` 统一生成。剑士、预言家、植物学家专属卡和 `cards/neutral/index.ts` 的中立临时卡已拆分，植物学家已登记 5 张基础普通卡；卡牌支持本回合弃牌减费、速攻计数联动、弃牌触发、弃牌堆回收、随机手牌标记、应星/瀑布、瞄准、培育和普通牌转速攻，攻击牌优先使用攻击力倍率，`text` 支持 `{0}` 等效果数值占位符。中立临时卡 `scrap-shrapnel` 仅由战斗效果生成，不进入角色卡池。 |
| [basicCards.ts](../../src/data/basicCards.ts) | 按角色生成 3 张基础卡，并提供统一的 2 攻 + 2 治 + 1 盾初始卡组。基础卡不进入抽卡池且不计入限携；说明使用 `{0}` 效果数值占位符。 |
| [characters.ts](../../src/data/characters.ts) | 角色颜色、固定 `StatBlock`、统一基础初始卡组和按稀有度分档的个人抽卡池；三名角色基础先手统一为 20，剑士、预言家与植物学家专属卡池均已登记，植物学家暂有 5 张普通卡。 |
| [enemies.ts](../../src/data/enemies.ts) | 敌人属性、招式及各自延迟、招式权重与招式级命中修正、目标选择、每回合行动次数上限、击杀经验和掉落表；4 只已投放小怪各带 3 个差异化招式，覆盖眩晕、叠甲、对护盾增伤、易伤、长延迟重击、虚弱和手牌费用标记；垃圾山的守护者登记五招及 `ai` 状态机字段，按玩家护盾状态驱动后继权重。先手统一 20、与角色基础先手持平，故 `delay` 字段即最终蓄力时刻数。经验写在敌人定义中，不写入掉落表。 |
| [encounters.ts](../../src/data/encounters.ts) | 遭遇战敌人组合与手工站位。引擎只取敌人 id，`dx/dy/scale/flip` 只供 UI 取景（`flip` = 立绘左右镜像）。 |
| [items.ts](../../src/data/items.ts) | 旧版物品清单，暂时保留以兼容现有掉落表和存档数据。 |
| [items/](../../src/data/items/) | 按设计文档拆分的新物品定义：通用/地区/怪物材料、消耗品与临期食品、普通装备模板及成品模组；由 `data/index.ts` 与旧清单合并注册。`items/pricing.ts` 按「类别 × 稀有度」统一给装备与材料打 `buyValue`，消耗品统一使用货柜固定价 20，三张物品表都调它。 |
| [items/modules.ts](../../src/data/items/modules.ts) | 成品模组物品定义；当前登记 1 件用于测试的速攻模组，不填购买/回收价格，因此不会进入商店或回收台。 |
| [cardModules.ts](../../src/data/cardModules.ts) | 卡牌模组注册表与唯一效果落点；按卡牌定义校验装备条件，重算时只还原并覆盖白名单字段，保留卡牌强化后的名称、效果和文案。 |
| [items/pricing.ts](../../src/data/items/pricing.ts) | 物品购买价统一入口：装备和材料按稀有度定价，消耗品使用 `CONSUMABLE_BUY_VALUE = 20`；据点随机商店仍只筛选装备与材料。 |
| [sortieStock.ts](../../src/data/sortieStock.ts) | 出击准备货柜固定库存：6 种临期食品与 4 种普通消耗品，按食品/消耗品两行登记；价格从物品定义读取，不在清单内重复维护。 |
| [shop.ts](../../src/data/shop.ts) | 据点商店：等级配置 `SHOP_LEVELS`、线性递增的刷新计价 `shopRefreshCost`、货架生成 `rollShopStock`。上架资格看 `buyValue`；随机刻意用 `Math.random`，不进探索的可复现种子链。 |
| [exploreEvents.ts](../../src/data/exploreEvents.ts) | 探索节点事件池、事件选项、加权 outcome、独立故事文案和效果。废弃楼层登记 16 个成长事件、8 个生存事件、18 个风险事件与 6 个经济交易事件；风险事件限定第 3-4 推进段，按 `negative` / `highRisk` 分级，并用 `FORCE_ITEM` 发放不可移除的《沉重的负担》。经济事件只登记交易服务槽位，货架与食品结算由 `explore/shop.ts` 负责。大奖策略通过选项食品门槛校验，六个食品触发的隐藏休息映射由事件的 `hiddenRest` 登记。 |
| [tradeServices.ts](../../src/data/tradeServices.ts) | 15 种交易服务的唯一目录：食品货币、标准价格、公开说明、货架类型、待办效果和随机团队 BUFF 候选。 |
| [tradeStock.ts](../../src/data/tradeStock.ts) | 交易货架候选池：通用/地区/怪物材料、消耗品、食品和三类装备按地图与服务类型筛选。 |
| [npcEvents.ts](../../src/data/npcEvents.ts) | 六个隐藏 NPC 事件注册表。每个 NPC 提供独立描述、分支故事和加权 outcome，可发放物品、经验、免费锻造/删卡、装备候选或羁绊重铸。 |
| [squadTalents.ts](../../src/data/squadTalents.ts) | 小队徽章与天赋树的唯一数据定义：每个徽章 = 方向链（`branches`，仅供图标/文案分组）+ 扇形半环坐标节点图（`nodes`，`requires` 任一满足即解锁）；初心者徽章 6 链 22 节点，其余徽章为「待开放」占位。`fan()` 负责纯坐标生成，`pathTo` / `costToReach` 与 `getNode` / `isUnlocked` / `canActivate` / `canRefund` / `spentPoints` / `squadModsOf` 一起作为 UI 与 store 共用的判定入口。 |
| [maps.ts](../../src/data/maps.ts) | 地图名称、描述、轮数、事件池、各战斗档位对应的遭遇战和低档补充敌人。地图素材由 UI 查表。 |
| [index.ts](../../src/data/index.ts) | 按 id 建索引和 getter，维护物品族索引，实例化卡牌/物品并生成持久化 uid。 |

数据层不登记素材路径，也不写流程逻辑。素材查表在 `src/ui/`；战斗、探索和物品规则分别由对应纯逻辑层维护。
