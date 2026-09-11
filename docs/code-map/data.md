# 内容数据

路径：`src/data/`。这里放可替换的卡牌、角色、敌人、遭遇战、物品、探索事件和地图数据；规则计算留在 `engine/`、`explore/`、`items/`。

| 文件 | 作用 |
| --- | --- |
| [enemies/mimics.ts](../../src/data/enemies/mimics.ts) | 宝箱怪单列数据：只有自保招式，按 fleeAfterRound 到点离场，并分别必掉装备箱或卡牌候选。 |
| 宝箱怪遭遇战 | encounters.ts 登记「械匣暗格」「牌匣暗格」两场编成；maps.ts 通过 treasureEncounters 供 t1-t3 战斗按概率替换。 |
| [cards.ts](../../src/data/cards.ts) + [cards/](../../src/data/cards/) | `CARD_DEFS` 汇总入口；具体 `CardDef[]` 按角色放在 `cards/<角色>/index.ts` 中维护，基础卡仍由 `basicCards.ts` 统一生成。剑士卡池现为 30 张，按 `cards/swordsman/attack.ts`(攻击 14) + `support.ts`(功能与防御 10) + `passive.ts`(被动 6) 三张分表维护；新增卡覆盖手牌选择、弃牌预选、纳刀、雷走回手、虚无复制、逐段随机伤害和剑士状态联动。其余角色卡池与中立临时卡仍按各自分表维护，被动卡无费用、不可打出、持在手中按事件自动生效(见 engine/passive.ts)。 |
| [basicCards.ts](../../src/data/basicCards.ts) | 按角色生成 3 张基础卡，并提供统一的 2 攻 + 2 治 + 1 盾初始卡组。基础卡不进入抽卡池且不计入限携；说明使用 `{0}` 效果数值占位符。 |
| [characters.ts](../../src/data/characters.ts) | 角色颜色、固定 `StatBlock`、统一基础初始卡组和按稀有度分档的个人抽卡池；五名角色基础先手统一为 20，剑士、预言家、植物学家、炼金术士与精算师专属卡池均已登记，精算师卡池为 8 张普通卡且罕见/稀有池留空。 |
| [enemies.ts](../../src/data/enemies.ts) | 敌人属性、招式及各自延迟、招式权重与招式级命中修正、目标选择、每回合行动次数上限、击杀经验、普通掉落表和战斗胜利 `boonTable`；掉落表按档位挂水晶与废弃楼层地区材料——小怪绿晶/low、精英蓝晶/mid、BOSS 必掉红晶/boss；水晶与换金物按档位共用常量表，通用材料逐怪物固定一种。垃圾山的守护者登记五招及 `ai` 状态机字段，按玩家护盾状态驱动后继权重。首图小怪已包含玻璃水母这一闪避型飞行单位。先手统一 20、与角色基础先手持平，故 `delay` 字段即最终蓄力时刻数。经验写在敌人定义中，不写入掉落表。 |
| [encounters.ts](../../src/data/encounters.ts) | 遭遇战敌人组合与手工站位。引擎只取敌人 id，`dx/dy/scale/flip` 只供 UI 取景（`flip` = 立绘左右镜像）；`lift` 是飞行离地高度，只供 UI 把落地阴影放回地面；t2 同时登记 3 只标准编成与 2 只轻档编成；4 只怪的编成只登记在 t4/t5。 |
| [items.ts](../../src/data/items.ts) | 旧版物品清单，暂时保留以兼容现有掉落表和存档数据。 |
| [items/](../../src/data/items/) | 按设计文档拆分的新物品定义：通用材料与水晶、地区特色材料、换金物、消耗品与临期食品、装备模型模板及成品模组、`items/relics/blessings/{tutorial,basic,uncommon}.ts` 的祝福遗物分表与 `relics/curses.ts` 的诅咒遗物；正向武器由族级词条模板展开五档模型，极端武器仍使用固定属性；由 `data/index.ts` 与旧清单合并注册。`items/pricing.ts` 按「类别 × 稀有度」统一给装备与材料打 `buyValue`，消耗品统一使用货柜固定价 20；`items/materials.ts` 的水晶与 `items/regional.ts` 的地区材料都刻意不过它 ⇒ 没有 `buyValue` ⇒ 据点商店永不上架、回收台也不收。 |
| [picnicRecipes.ts](../../src/data/picnicRecipes.ts) | 远征技能《野餐》的 6 个隐藏食谱与多重集精确匹配；命中食谱后由探索层生成随机祝福遗物，食谱名称只在命中结算时交给 UI。 |
| [items/regional.ts](../../src/data/items/regional.ts) | 地区特色材料的唯一真相点：按地区与 `low` / `mid` / `boss` 档位登记材料，提供 `regionalMaterial()`、`itemRegionId()` 与 `regionalTierOf()`；首批登记废弃楼层三种材料，独立于 `MATERIAL_ITEM_DEFS`，不进入交易终端材料候选池。 |
| [items/modules.ts](../../src/data/items/modules.ts) | 成品模组物品定义：角色模组（速攻、弃牌、落差、卫星、借星、瞄准、催熟、组装 A/B/C/D、急诊、回响）与 1 阶通用模组（攻击力/治愈力/穿甲/暴击/精准/淬毒/燃烧，统一 `fine` + `familyId: "generic-module"`），均不填购买/回收价格，因此不会进入商店或回收台；另有 1 阶模组箱 `module-crate-t1`（消耗品，`use.kind = "openModuleCrate"`）。四件组装模组同构，由 `ASSEMBLE_MODULE_LETTERS` + `assembleModuleItemId` 统一展开，卡牌模组表、制造配方与徽记共用这一份字母表与 id 生成。 |
| [cardModules/](../../src/data/cardModules/) | 卡牌模组注册表与唯一效果落点。`types.ts` 持有 `CardModuleDef` 与装配条件判定（`hasDamageEffect` / `hasScaledDamage` / `hasScaledSupport`，后两者用于挡住「装在固定伤害或固定值护盾牌上收益为零」的情况）；`character.ts` 是角色关键词模组（含炼金术士的组装 A/B/C/D：`costDelta: +1` 换一枚组装部件；精算师的急诊模组：追加《假装受伤》，回响模组：`PLAY_STAT_BONUS` 治愈力 -30 + 追加回响词条，只能装在指向队友的卡上，否则回响会把伤害重放给队友）；`genericT1.ts` 是 1 阶通用模组（面板组走 `PLAY_STAT_BONUS`，异常组走按攻击力 15% 缩放的中毒/灼烧）并导出开箱池 `GENERIC_T1_MODULE_IDS`；`index.ts` 汇总并持有 `recomputeCardModule`：重算时费用与白名单字段还原后覆盖，前置/追加效果和词条均按 `fromModule` 标记剥离再叠加，文案按登记后缀剥离再拼接，保留卡牌强化后的名称、效果和文案。 |
| [moduleCrafting.ts](../../src/data/moduleCrafting.ts) | 模组制造配方表：为剑士、预言家、植物学家、炼金术士、精算师登记配方，包含产出模组、制造者角色、经验消耗、两种通用材料与产出地区的 mid 材料；组装 A/B/C/D 四条同价配方由字母表展开；`craftCheck` 是可行性判定的唯一真相点，store 护栏与 UI 置灰共用它。 |
| [equipUpgrade.ts](../../src/data/equipUpgrade.ts) | 装备升阶与词条重铸配方表；按装备槽位登记两种通用材料，1 阶升阶使用产出地区的 low 材料，高阶继续使用水晶，重铸使用产出地区的 boss 材料；`upgradeCheck` / `reforgeCheck` 是 store 护栏与 UI 置灰共用的唯一可行性判定。 |
| [nutritionPod.ts](../../src/data/nutritionPod.ts) | 营养舱科技与疗养规则：登记带 `requires`、坐标的横向节点图，席位扩建与疗养液配比按链式逐节点解锁；统一计算四态节点、席位、等级和单次体力极限恢复量，`nutritionTechCheck` 复用材料/积分判定，`NUTRITION_TREAT_COST` 固定为 100 积分。 |
| [techTree/](../../src/data/techTree/) | 全局科技树数据与规则：按分类、支线、科技三级组织节点，集中登记等级制消耗、四态判定和训练点/换金物售价效果；`sellPriceOf` 是换金物售价倍率的唯一入口。 |
| [items/pricing.ts](../../src/data/items/pricing.ts) | 物品购买价统一入口：装备和材料按稀有度定价，祝福遗物由 `relicBuyValue` 按稀有度单独取价，消耗品使用 `CONSUMABLE_BUY_VALUE = 20`；遗物不写回 `ItemDef.buyValue`。 |
| [sortieStock.ts](../../src/data/sortieStock.ts) | 出击准备货柜固定库存：6 种临期食品与 4 种普通消耗品，按食品/消耗品两行登记；价格从物品定义读取，不在清单内重复维护。 |
| [botLines.ts](../../src/data/botLines.ts) | 公共台词取句函数：按台词池与分类随机取句，并回避上一句；供出击售货机器人与据点管理终端共用。 |
| [vendorLines.ts](../../src/data/vendorLines.ts) | 出击准备页售货机器人的台词表：按开口场合（问候/闲聊/购买/退款/退回仓库/积分不足/背包已满/仓库取物）分池，`pickVendorLine()` 作为公共 `pickBotLine()` 的薄封装随机取句并回避上一句；分类与 UI 的 `VendorLineKind` 一一对应。 |
| [townBotLines.ts](../../src/data/townBotLines.ts) | 据点常驻管理终端台词表：按问候/闲聊/点击反馈分池，`pickTownBotLine()` 复用公共取句逻辑，不涉及设施规则。 |
| [shop.ts](../../src/data/shop.ts) | 据点统一商店的物品侧货位工厂：保留 `SHOP_LEVELS` 品质权重，提供 `SHOP_KIND_WEIGHTS`、`pickShopKind` 与 `rollShopItemSlot`；祝福遗物池直接取 `items/relics`，装备模型与羁绊在上架时固定到物品货位。随机刻意用 `Math.random`，不进探索的可复现种子链。 |
| [shopTech.ts](../../src/data/shopTech.ts) | 统一商店科技与卡牌价格：维护槽位 6→7→8、刷新基价 100/90/80、四个设施科技节点及状态判定；`CARD_SHOP_PRICE` 保留卡牌三档售价表名。 |
| [exploreEvents.ts](../../src/data/exploreEvents.ts) | 探索节点事件池、事件选项、加权 outcome、独立故事文案和效果。废弃楼层登记 16 个成长事件、8 个生存事件、18 个风险事件与 6 个经济交易事件；风险事件限定第 3-4 推进段，按 `negative` / `highRisk` 分级，并用 `FORCE_ITEM` 发放不可移除的《沉重的负担》。经济事件只登记交易服务槽位，货架与食品结算由 `explore/shop.ts` 负责。大奖策略通过选项食品门槛校验，六个食品触发的隐藏休息映射由事件的 `hiddenRest` 登记；教学事件池由 [tutorialEvents.ts](../../src/data/tutorialEvents.ts) 单独登记，供固定蓝图按 id 取用；挑战节点池由 [exploreTrials.ts](../../src/data/exploreTrials.ts) 单独登记。 |
| [exploreTrials.ts](../../src/data/exploreTrials.ts) | 挑战节点事件池：4 份跨轮契约，各自登记负面属性修正、持续轮数与「物资 / 常驻小队增益」二选一的加权奖励，节点本身只有「接受挑战（−5 粒子）」与「放弃」两支。属性修正在开战时对每名角色各叠一次，故不得写入 `drawCount` / `handLimit` / `burdenAdapt` 这类小队合计属性。 |
| [tutorialRoute.ts](../../src/data/tutorialRoute.ts) | 新手关卡三轮固定路线蓝图：首轮为装备、模组、锻造三段单通道，后两轮继续登记教学用分支；按轮次登记通道数、桥接和节点事件 id，不参与随机地图的事件冷却、桥接和隐藏节点抽取。 |
| [tradeServices.ts](../../src/data/tradeServices.ts) | 12 种交易服务的唯一目录：食品货币、标准价格、公开说明、货架类型、待办效果和随机团队 BUFF 候选。 |
| [tradeStock.ts](../../src/data/tradeStock.ts) | 交易货架候选池：通用材料、水晶、消耗品、食品和武器按服务类型筛选；材料已无地区专属池，只有武器仍按地图筛稀有度。 |
| [npcEvents.ts](../../src/data/npcEvents.ts) | 六个隐藏 NPC 事件注册表。每个 NPC 提供独立描述、分支故事和加权 outcome，可发放物品、经验、免费锻造/删卡、装备候选或羁绊重铸。 |
| [squadTalents.ts](../../src/data/squadTalents.ts) | 小队徽章与天赋树的唯一数据定义：每个徽章 = 方向链（`branches`，仅供图标/文案分组）+ 扇形半环坐标节点图（`nodes`，`requires` 任一满足即解锁）；初心者徽章 6 链 22 节点，其余徽章为「待开放」占位。`fan()` 负责纯坐标生成，`pathTo` / `costToReach` 与 `getNode` / `isUnlocked` / `canActivate` / `canRefund` / `spentPoints` / `squadModsOf` 一起作为 UI 与 store 共用的判定入口。 |
| [maps.ts](../../src/data/maps.ts) | 地图名称、描述、轮数、事件池、各战斗档位对应的遭遇战和低档补充敌人；4 只怪的编成只登记在 t4/t5；`roundPlans` 可为地图提供固定轮次棋盘，`hideAfterClear` 控制通关后从选择带隐藏，`battleTierByRound`、`battleEncounterByRound`（按轮次钉死推进战斗的遭遇战，教学关前两轮用它排两套不同的双敌人编成）、`requiresClear` 与 `locked` 定义按轮次档位和地图解锁规则；`visibleMaps` 是出击界面唯一的可见地图筛选入口。地图素材由 UI 查表。 |
| [index.ts](../../src/data/index.ts) | 按 id 建索引和 getter，维护物品族索引，实例化卡牌/物品并生成持久化 uid；`newUid` 也供临时战斗奖励生成唯一 id。 |

数据层不登记素材路径，也不写流程逻辑。素材查表在 `src/ui/`；战斗、探索和物品规则分别由对应纯逻辑层维护。

统一商店的卡牌价格、科技等级、刷新费用和四条设施科技由 `shopTech.ts` 维护；设施科技拆为展柜扩容与补货链路两条分支，货位数与刷新基价按已研究节点派生；整架混合生成由 `store/shopStock.ts` 读取角色卡组并调用 `data/shop.ts` 的物品货位工厂；全局科技树由 `techTree/` 维护训练点强化与回收溢价，科技积分与材料校验统一由 `techCost.ts` 提供。
