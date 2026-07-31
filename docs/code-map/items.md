# 物品层

路径：`src/items/`。被探索层和城镇层共同使用，不依赖 `explore/` 或 `store/`。

| 文件 | 作用 |
| --- | --- |
| [types.ts](../../src/items/types.ts) | 物品定义、实例、类别、五档物品稀有度、装备槽和掉落条目。 |
| [inventory.ts](../../src/items/inventory.ts) | 容器纯函数；背包容量由调用方传入，仓库可无上限；含 8×4 排布。 |
| [drops.ts](../../src/items/drops.ts) | 可复现的掉落次数和品质选择。 |
| [inventory.test.ts](../../src/items/inventory.test.ts) | 占格、排布、溢出、掉落复现与品质偏移测试。 |

物品稀有度与战斗卡牌稀有度是两套类型，修改时不要混用。装备占格、负重和仓库穿戴逻辑分别由调用方和 `townStore` 组合。
