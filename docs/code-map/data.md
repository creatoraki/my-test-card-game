# 内容数据

路径：`src/data/`。这里放可替换的卡牌、角色、敌人、遭遇战、物品、探索事件、战斗签符号和地图数据；规则计算留在 `engine/`、`explore/`、`items/`。

| 文件 | 作用 |
| --- | --- |
| [cards.ts](../../src/data/cards.ts) | `CardDef[]`：归属角色、费用、普通/速攻、目标、声明式效果和稀有度；攻击牌优先使用攻击力倍率。 |
| [characters.ts](../../src/data/characters.ts) | 角色颜色、固定 `StatBlock`、初始卡组和按稀有度分档的个人抽卡池。当前三名角色中后两名仍为占位内容。 |
| [enemies.ts](../../src/data/enemies.ts) | 敌人属性、技能、意图脚本、基础施法延迟和掉落表。经验是敌人固定值，不写入掉落表。 |
| [encounters.ts](../../src/data/encounters.ts) | 遭遇战敌人组合与手工站位。引擎只取敌人 id，`dx/dy/scale` 只供 UI 取景。 |
| [items.ts](../../src/data/items.ts) | 旧版物品清单，暂时保留以兼容现有掉落表和存档数据。 |
| [items/](../../src/data/items/) | 按设计文档拆分的新物品定义：通用/地区/怪物材料、消耗品与临期食品、普通装备模板；由 `data/index.ts` 与旧清单合并注册。 |
| [exploreEvents.ts](../../src/data/exploreEvents.ts) | 探索节点事件池、事件选项、代价和效果。 |
| [slotSymbols.ts](../../src/data/slotSymbols.ts) | 战斗签转轮符号：战斗卡、战前准备卡和 BOSS 开局条件。 |
| [maps.ts](../../src/data/maps.ts) | 地图名称、描述、轮数、事件池、各战斗档位对应的遭遇战、低档补充敌人和转轮池。地图素材由 UI 查表。 |
| [index.ts](../../src/data/index.ts) | 按 id 建索引和 getter，维护物品族索引，实例化卡牌/物品并生成持久化 uid。 |

数据层不登记素材路径，也不写流程逻辑。素材查表在 `src/ui/`；战斗、探索和物品规则分别由对应纯逻辑层维护。
