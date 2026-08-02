# 状态层

路径：`src/store/`。Zustand 连接纯逻辑层与 React；城镇档案持久化，远征过程和远征背包不持久化。

| 文件 | 作用 |
| --- | --- |
| [battleStore.ts](../../src/store/battleStore.ts) | 单场战斗状态包装。`play/end` 前先 `structuredClone`，再调用引擎，避免 React 持有对象被原地修改；`seq` 标识新战斗，供 UI 重置分镜。 |
| [exploreStore.ts](../../src/store/exploreStore.ts) | 探索会话与背包 action 包装，按阶段机调用 `explore/session`；纯函数返回无效时不替换状态。远征中途刷新即作废。 |
| [townStore.ts](../../src/store/townStore.ts) | 持久化城镇档案：角色 profile、唤醒、编队、经验池、个人卡组、卡组锻造、居民积分、仓库、装备和出售。`deriveStats` 现算角色局外面板，`equipModsOf` 现算装备修正；存档 key 为 `town-profile-v4`。 |
| [runStore.ts](../../src/store/runStore.ts) | 远征流程总编排和界面路由。启动战斗时合并存活队员个人卡组、计算完整面板、传入继承 HP 与负重快照；结算时回填血量、发经验、处理掉落和最终入仓。 |

依赖边界：`runStore` 是探索、战斗和界面的唯一连接点；`townStore` 不直接依赖探索会话。探索层提供队伍快照，战斗只接收 `startHp`、`EncounterModifier` 和 `burdenPenalty` 等初始化数据。
