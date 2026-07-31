# 状态层

路径：`src/store/`。Zustand 连接纯逻辑层与 React；城镇档案持久化，远征过程不持久化。

| 文件 | 作用 |
| --- | --- |
| [battleStore.ts](../../src/store/battleStore.ts) | 单场战斗状态包装；以克隆式更新调用引擎。 |
| [exploreStore.ts](../../src/store/exploreStore.ts) | 探索会话状态包装和背包操作。 |
| [townStore.ts](../../src/store/townStore.ts) | 编队、唤醒、经验、个人卡组、仓库、装备和居民积分；写入 localStorage。 |
| [runStore.ts](../../src/store/runStore.ts) | 远征流程总编排、界面路由、探索与战斗之间的数据转换和结算。 |

依赖边界：`runStore` 是探索、战斗和界面的连接点；`townStore` 不应直接依赖探索会话。装备属性由 `deriveStats` 现算，战斗开局的负重由探索状态快照传入。
