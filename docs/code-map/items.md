# 物品层

路径：`src/items/`。纯 TypeScript，描述“实物战利品”：探索中得到的物品占用背包格，活着回到据点才会进入仓库。具体的物品数据在 `data/items/`，见 [data-world.md](data-world.md)。

| 文件 | 作用 |
| --- | --- |
| [types.ts](../../src/items/types.ts) | 物品类型：稀有度及顺序和中文名、类别、装备槽（武器 / 防具 / 饰品）、使用方式、装备词条与模型、遗物规格、`ItemStack`。只有类型和常量表。 |
| [inventory.ts](../../src/items/inventory.ts) | 背包和仓库共用的容器操作：占格计算、放入（`addToContainer`）、移除、消耗、查找、合并显示、排序、背包格子排布。⚠ 模块本身不知道背包容量是 24，容量由调用方传入；不传就是无上限的仓库。 |
| [drops.ts](../../src/items/drops.ts) | 掉落结算：掉落数量、按品质抽取、按掉落表抽取。随机源可以是任何带 `rngState` 的对象，直接传 `ExploreState` 就能接入远征的种子链。 |
| [equipRoll.ts](../../src/items/equipRoll.ts) | 装备生成：词条缩放、完美度的生成与提升、装备升阶。 |

## 相关真相点

- 背包容量：`engine/rules.ts` 中的 `RULES.burden.backpackSlots`。
- 物品售价和挂牌价：`data/items/pricing.ts`。
- 能否寄回据点、是否为一次性物品：`inventory.ts` 中的 `canShipHome` 和 `isDisposable`。

## 测试

`inventory.test.ts`：覆盖占格换算、格子排布和放入规则。
