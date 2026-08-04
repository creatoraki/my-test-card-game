# 状态层

路径：`src/store/`。Zustand 连接纯逻辑层与 React；城镇档案持久化，远征过程和远征背包不持久化。

| 文件 | 作用 |
| --- | --- |
| [battleStore.ts](../../src/store/battleStore.ts) | 单场战斗状态包装。`play/end` 前先 `structuredClone`，再调用引擎，避免 React 持有对象被原地修改；`seq` 标识新战斗，供 UI 重置分镜。 |
| [exploreStore.ts](../../src/store/exploreStore.ts) | 探索会话与背包 action 包装，按阶段机调用 `explore/session`；纯函数返回无效时不替换状态。远征中途刷新即作废。 |
| [townStore.ts](../../src/store/townStore.ts) | 持久化城镇档案：角色 profile、唤醒、编队、经验池、个人卡组、污染值、生病、怪癖、卡组锻造、居民积分、仓库、装备和出售，以及生存天数 `day` 与商店货架 `shop`。`deriveStats` 统一叠加装备、生病和怪癖修正；`contaminateCards` 随机污染未污染个人卡；`syncBattleConditions` 回填战斗内永久条件；存档 key 为 `town-profile-v7`。 |
| [runStore.ts](../../src/store/runStore.ts) | 远征流程总编排和界面路由。启动战斗前消费待处理污染请求并污染当前队伍个人卡组；启动战斗时合并存活队员卡组、计算完整面板、传入污染/疾病/怪癖与继承 HP；结算时回填条件和最大生命，战败、撤退与终局也不丢污染。`backToTown` 是唯一推进一日的地方。 |

依赖边界：`runStore` 是探索、战斗和界面的唯一连接点；`townStore` 不直接依赖探索会话。探索层提供队伍快照，战斗只接收 `startHp`、`EncounterModifier` 和 `burdenPenalty` 等初始化数据。
