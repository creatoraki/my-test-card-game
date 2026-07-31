# 内容数据

路径：`src/data/`。新增或替换卡牌、角色、敌人、遭遇战、物品、事件和地图时优先修改这里。

| 文件 | 作用 |
| --- | --- |
| [cards.ts](../../src/data/cards.ts) | 卡牌定义与效果描述。 |
| [characters.ts](../../src/data/characters.ts) | 角色基础属性、初始卡组和个人抽卡池。 |
| [enemies.ts](../../src/data/enemies.ts) | 敌人属性、招式、意图脚本和掉落表。 |
| [encounters.ts](../../src/data/encounters.ts) | 遭遇战敌人组合与站位。 |
| [items.ts](../../src/data/items.ts) | 物品和装备定义。 |
| [exploreEvents.ts](../../src/data/exploreEvents.ts) | 探索节点事件池和分支。 |
| [maps.ts](../../src/data/maps.ts) | 地图、区域轮数、事件池和战斗档位映射。 |
| [index.ts](../../src/data/index.ts) | 各类数据注册、按 id 查询和实例化。 |

数据层不登记素材路径；素材查表在 `src/ui/`。规则计算留在 `engine/`、`explore/`、`items/`，不要把流程逻辑写进数据文件。
