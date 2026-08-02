# 物品层

路径：`src/items/`。探索层和城镇层共同使用的第三个纯 TypeScript 层，不依赖 `explore/` 或 `store/`。只 type-import `engine/types` 的 `StatBlock` 与 `engine/rng`。

| 文件 | 作用 |
| --- | --- |
| [types.ts](../../src/items/types.ts) | `ItemDef`、`ItemStack`、类别、装备槽、消耗品用途、掉落条目，以及五档 `ItemRarity`、排序和标签。`ItemUse` 不复用 `ExploreEffect`，避免反向依赖探索层。 |
| [inventory.ts](../../src/items/inventory.ts) | 背包/仓库共用的容器纯函数。容量由调用方传入，仓库可不传容量；含堆叠占格、溢出原样返回、增删查找、排序和 8×4 视觉排布。跨 2 格装备不能跨行，`covered` 格渲染时必须跳过；排布不能因 gap 截断物品。 |
| [drops.ts](../../src/items/drops.ts) | 可复现掉落结算：统一系数后的概率、整数保底加小数再掷、族内品质右移，以及掉落表解析。 |
| [inventory.test.ts](../../src/items/inventory.test.ts) | 占格、容量溢出、无上限仓库、跨格排布、gap、概率保底、同种子复现和品质偏移测试。 |

物品稀有度与战斗卡牌稀有度是两套类型，即使都有 `common` / `rare` 也不能互相混用。装备占格、负重和仓库穿戴由本层容器函数与 `explore/session`、`townStore` 组合；穿在身上的装备不占仓库格。
