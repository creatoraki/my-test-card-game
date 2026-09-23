# 内容数据：世界侧

路径：`src/data/`。本文件覆盖地图、物件、物品、据点设施和台词；卡牌、角色、敌人见 [data-combat.md](data-combat.md)。

## 汇总入口

[data/index.ts](../../src/data/index.ts) 是数据层的聚合入口；注册表和工具函数（`ITEM_DEFS`、各类 `getXxx` 查询、`newUid`、`makeItemStack` / `makeRolledItemStack` 等）实现在 [data/registry.ts](../../src/data/registry.ts)。⚠ data 目录内部的模块直接引 `registry.ts` 或具体文件，不要从 `data/index.ts` 取，否则会形成运行时依赖环。⚠ 卡牌实例和物品实例的 uid 会随存档写入 localStorage，必须用 `newUid` 生成，不能用内存计数器。

## 地图与难度

| 文件 | 作用 |
| --- | --- |
| [maps.ts](../../src/data/maps.ts) | `MapDef` 与 `MAPS`：房间数、事件池、五个战斗档位的遭遇战、起始粒子；解锁条件、装备稀有度范围。 |
| [maps/ecoArk.ts](../../src/data/maps/ecoArk.ts) | 生态方舟地图（12 间房，通关废弃楼层后开放）。 |
| [mapDifficulty.ts](../../src/data/mapDifficulty.ts) | 难度规则的唯一真相点：装备上限、物件等级、敌人生命与攻击倍率。 |
| [mapCombatBalance.ts](../../src/data/mapCombatBalance.ts) | 各难度的战斗倍率修正。 |
| [mapAidSupply.ts](../../src/data/mapAidSupply.ts) | 出击时总部按地图和难度配发的一次性物资。 |
| [mapClearReward.ts](../../src/data/mapClearReward.ts) / [mapDailyReward.ts](../../src/data/mapDailyReward.ts) | 首次通关的固定奖励；每日通关的随机奖励。 |
| [tutorialDungeon.ts](../../src/data/tutorialDungeon.ts) | 新手关的固定蓝图：6 间直线排列的房间，每间放 1–2 个交互物，各演示一种核心交互。 |

## 可交互物件 `curios/`

| 文件 | 作用 |
| --- | --- |
| [curios/index.ts](../../src/data/curios/index.ts) | 物件总表 `CORRIDOR_CURIOS`、随机投放权重、治疗类和陷阱类清单，以及黑影、守卫、警报等遭遇事件。 |
| [curios/types.ts](../../src/data/curios/types.ts) | 物件、决策、缓解条件、失败规则、等级覆写等类型。 |
| [curios/helpers.ts](../../src/data/curios/helpers.ts) | 编写物件用的简写：`fail`、`byJob`、`withItem`、`feedDecision`。 |
| `lootCurios` / `supplyCurios` / `scavengeCurios` / `growthCurios` / `serviceCurios` / `craftCurios` / `trapCurios` / `tutorialCurios` / `ecoArk` | 各类物件：道具奖励、补给、拾荒、成长、服务、制造、陷阱、新手专用、生态方舟专属。 |
| [curios/levelRules.ts](../../src/data/curios/levelRules.ts) / [rewardPools.ts](../../src/data/curios/rewardPools.ts) | 物件等级规则（失败率上限、奖励放大）；按品质档分组的奖励池。 |
| [curios/growthBalance.ts](../../src/data/curios/growthBalance.ts) | 成长服务的选项，以及哪些难度允许删卡（新手和普通难度禁用）。 |
| [curios/merchantPricing.ts](../../src/data/curios/merchantPricing.ts) / [critters.ts](../../src/data/curios/critters.ts) | 货商收取的食品和价格档位；机械小动物的喂食偏好。 |

## 其他探索数据

| 文件 | 作用 |
| --- | --- |
| [picnicRecipes.ts](../../src/data/picnicRecipes.ts) | 野餐食谱：回复体力极限，或给一件一次性遗物。 |

## 物品 `items/`

| 文件 | 作用 |
| --- | --- |
| [items/index.ts](../../src/data/items/index.ts) | 物品表汇总 `DESIGN_ITEM_DEFS`。 |
| [items/equipment/](../../src/data/items/equipment/index.ts) | 装备：武器、防具、饰品，以及 `equipModel.ts` 的分阶展开模板。 |
| [items/materials.ts](../../src/data/items/materials.ts) / [regional.ts](../../src/data/items/regional.ts) / [scrap.ts](../../src/data/items/scrap.ts) | 掉落物三类：通用材料和水晶、地区材料、换金物（废料）。 |
| [items/consumables.ts](../../src/data/items/consumables.ts) / [burden.ts](../../src/data/items/burden.ts) | 消耗品和临期食品；强制拾取、无法丢弃的负担物品。 |
| [items/modules.ts](../../src/data/items/modules.ts) | 模组物品、通用模组族、模组箱。 |
| [items/relics/](../../src/data/items/relics/index.ts) | 遗物：祝福（基础、罕见、教程、野餐专属）和诅咒。⚠ 野餐遗物不并入祝福池，避免被随机抽到。 |
| [items/pricing.ts](../../src/data/items/pricing.ts) | 按“类别 × 稀有度”定价的唯一来源，由 `withBuyValue` 统一给物品标价。 |
| [equipUpgrade.ts](../../src/data/equipUpgrade.ts) | 装备升阶的配方与检查，以及重铸的费用。 |

## 据点设施

| 文件 | 作用 |
| --- | --- |
| [shop.ts](../../src/data/shop.ts) / [shopTech.ts](../../src/data/shopTech.ts) | 据点商店：货位类型、品质权重、商店等级和设施科技。使用 `Math.random`，不进入远征的种子链。 |
| [sortieStock.ts](../../src/data/sortieStock.ts) | 出击准备页的常驻补给柜：固定清单、不限量、不刷新。 |
| [nutritionPod.ts](../../src/data/nutritionPod.ts) / [sanctuary.ts](../../src/data/sanctuary.ts) | 医疗室的疗养舱科技与治疗量；圣水池的规则。 |
| [techTree/](../../src/data/techTree/index.ts) | 研究中心的全局科技树：分类、节点、效果（训练加成、废料售价）、状态判定。 |
| [techCost.ts](../../src/data/techCost.ts) | 科技花费的检查（材料和积分）。 |

## 台词

`botLines.ts`（公共抽取函数 `pickBotLine`，自动避开上一句）、`townBotLines.ts`（据点）、`vendorLines.ts`（出击补给机）、`explorerLines.ts`（探索者独白）：都是纯文案表，并附带随机抽取函数。
