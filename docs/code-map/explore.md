# 探索引擎

路径：`src/explore/`。纯 TypeScript 的远征规则层，约定与 engine 相同：函数直接修改传入的 `ExploreState`，由 `store/explore/exploreStore` 先克隆再调用。随机数一律走会话里的 `rngState`，同一个种子会生成同一张地图、掉同样的东西。

当前玩法是**房间制**：一张地图就是一张房间图（`dungeon/`），每个房间展开成一段横向场景（`corridor/`），场景中放着可交互物件（`curio/`）。

## 规则真相点

| 文件 | 作用 |
| --- | --- |
| [rules.ts](../../src/explore/core/exploreRules.ts) | 探索层的全部数值旋钮（`EXPLORE_RULES`）和粒子档位（`ENERGY_TIERS`）。 |
| [energyCost.ts](../../src/explore/resources/energyCost.ts) | 粒子计价的唯一入口：换房、交互、战斗、行走四类消耗。UI 的预告和实际扣费都读这里。 |
| [energy.ts](../../src/explore/resources/energy.ts) | 改写粒子数的唯一入口，负责截断和统计。 |
| [types.ts](../../src/explore/types.ts) | 探索层类型：会话、阶段、效果、奖励、待办等。当前房间的场景事件存在 `sceneEvents`，打开的物件 / 黑影下标是 `landedIndex`。 |

## 会话主体

| 文件 | 作用 |
| --- | --- |
| [session/](../../src/explore/session/index.ts) | 远征会话，按职责分文件，由 `session/index.ts` 统一导出（调用方一律从 `explore/session` 引入）：`energy`（粒子档位换算）、`drops`（掉落系数与上下文）、`create`（建局）、`backpack`（占格、负重、拾取、投递口）、`party`（回血掉血、团灭、战斗回填）、`rewards`（装备 / 遗物候选）、`effects`（`applyEffect`）、`items`（消耗品）、`pending`（待办出队）、`battle`（档位抽取、BOSS 红门、`finishBattle`、撤离）、`scene`（黑影开战、`confirmNode`）、`queries`（UI 查询）、`log`。 |
| [boons.ts](../../src/explore/core/boons.ts) | 战斗胜利奖励：治疗露珠、卡牌候选、装备箱、模组箱的生成与领取。 |
| [picnic.ts](../../src/explore/resources/picnic.ts) | 野餐：用临期食品组合食谱，奖励是回复体力极限或一件一次性遗物。 |
| [relics.ts](../../src/explore/relics/relics.ts) / [relicBehaviors.ts](../../src/explore/relics/relicBehaviors.ts) / [relicModifiers.ts](../../src/explore/relics/relicModifiers.ts) | 背包中遗物在探索侧的触发时机、行为，以及对负重、货商格数、废料售价、应急信标的修正。 |

## 房间图 `dungeon/`

| 文件 | 作用 |
| --- | --- |
| [dungeon/types.ts](../../src/explore/dungeon/types.ts) | 房间、传送门方向、房间种类（`start` / `normal` / `battle` / `trap` / `boss`）。每个房间最多连通上下左右 4 个方向。 |
| [dungeon/generate.ts](../../src/explore/dungeon/generate.ts) + [growRooms.ts](../../src/explore/dungeon/growRooms.ts) | 随机地图：先长出生成树，再追加少量环路；BOSS 房放在最深处。 |
| [dungeon/planned.ts](../../src/explore/dungeon/planned.ts) | 固定蓝图地图（新手关）。 |
| [dungeon/curioPlan.ts](../../src/explore/dungeon/curioPlan.ts) / [curioLevel.ts](../../src/explore/dungeon/curioLevel.ts) | 每个房间放哪些物件，以及物件等级（越深的房间越接近地图等级上限）。 |
| [dungeon/session.ts](../../src/explore/dungeon/dungeonSession.ts) | 换房间：站上传送门点亮小地图、确认传送并扣粒子、落地新房间；战斗房立即触发黑影，陷阱房立即打开陷阱物件；另有应急信标传送。 |
| [dungeon/nearMapGeometry.ts](../../src/explore/dungeon/nearMapGeometry.ts) | 近景素材的显示倍率（原图 2 倍）与几何尺寸，房间宽度由它决定。 |

## 房间内场景 `corridor/`

| 文件 | 作用 |
| --- | --- |
| [corridor/types.ts](../../src/explore/corridor/types.ts) | 场景坐标（设计画布像素）、物件、传送门、黑影威胁、槽位计算。 |
| [corridor/session.ts](../../src/explore/corridor/corridorSession.ts) | 把一个房间展开成可游玩的场景：附近物件查询、行走范围限制、打开或关闭物件、BOSS 红门、黑影遭遇的开始与结算。 |
| [corridor/ambush.ts](../../src/explore/corridor/ambush.ts) | 行走过程中的伏击概率和遭遇生成。 |
| [corridor/alarm.ts](../../src/explore/corridor/alarm.ts) | 交互失败拉响的警报：先登记档位，结算完成回到场景后才生成守卫战。 |

## 可交互物件 `curio/`

| 文件 | 作用 |
| --- | --- |
| [curio/resolve.ts](../../src/explore/curio/resolve.ts) | 物件决策的主入口：选择应对方式和执行者。 |
| [curio/visibility.ts](../../src/explore/curio/visibility.ts) | 哪些决策可见、哪些物品可以投入。 |
| [curio/failure.ts](../../src/explore/curio/failure.ts) | 失败判定：概率对玩家隐藏，由基础失败率 + 等级加值 + 职业或物品修正得出。 |
| [curio/leveling.ts](../../src/explore/curio/leveling.ts) | 同一个物件模板按等级放大奖励和惩罚。 |
| [curio/effects.ts](../../src/explore/curio/effects.ts) | 物件效果的落地。 |
| [curio/offering.ts](../../src/explore/curio/offering.ts) / [foodPayment.ts](../../src/explore/curio/foodPayment.ts) | 黑盒投放物品的匹配规则；服务类物件的食品支付。 |
| [curio/merchant.ts](../../src/explore/curio/merchant.ts) | 流浪货商：生成货架（固定 6 格，只收两种临期食品）、判断能否购买、付款。 |
| [curio/fusion.ts](../../src/explore/curio/fusion.ts) / [temporaryRelic.ts](../../src/explore/curio/temporaryRelic.ts) / [reveal.ts](../../src/explore/curio/reveal.ts) | 装备融合与遗物升级、发放一次性遗物、揭示整张地图。 |

## 测试

`session.rooms.test.ts`（房间图结构、换房、交互扣费）、`session.battle.test.ts`（战斗接缝、粒子档位、背包、撤离）、共用夹具 `session.testkit.ts`，以及 `curio/curio.test.ts`。
