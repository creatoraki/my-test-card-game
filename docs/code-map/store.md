# 状态层

路径：`src/store/`。Zustand 连接纯逻辑层与 React；城镇档案持久化，远征过程和远征背包不持久化。

| 文件 | 作用 |
| --- | --- |
| [battleStore.ts](../../src/store/battleStore.ts) | 单场战斗状态包装。`play/end/wait` 前先 `structuredClone`，再调用引擎，避免 React 持有对象被原地修改；`pickPendingChoice` / `cancelPendingChoice` 同样克隆后提交待选择回收结果；`seq` 标识新战斗，供 UI 重置分镜。 |
| [exploreStore.ts](../../src/store/exploreStore.ts) | 探索会话与背包 action 包装，按阶段机调用 `explore/session`；转发交易终端购买、待拾取物品、隐藏休息/NPC、待办成长奖励、定向经验和经验消费 action。纯函数返回无效时不替换状态，远征中途刷新即作废。 |
| [sortieStore.ts](../../src/store/sortieStore.ts) | 出击准备临时状态：保存地图、背包和本次购买账本；购买货柜物品、取出仓库消耗品前先校验容量，取消时按来源退款或退回仓库。状态不持久化，正式出击后由 `runStore` 透传背包并清空。 |
| [townStore.ts](../../src/store/townStore.ts) | 持久化城镇档案：角色 profile、唤醒、编队、经验池、个人卡组、污染值、生病、怪癖、卡组锻造、免费三选一/删卡、居民积分、仓库、装备和出售，以及生存天数 `day` 与商店货架 `shop`。收费扩充/精简按角色记录每日阶梯用量并懒重置，存档 key 为 `town-profile-v8`。`cureQuirk`、`reducePollution`、`purifyCards` 处理生存事件待办，`grantExpEach` 接收远征事件的经验映射，`reforgeEquipped` 处理已穿戴装备的羁绊重铸。 |
| [runStore.ts](../../src/store/runStore.ts) | 远征流程总编排和界面路由。启动战斗前消费待处理污染请求并污染当前队伍个人卡组；启动战斗时合并存活队员卡组、羁绊与临时光环，计算完整面板，传入污染/疾病/怪癖与继承的三段血量；远征收尾统一消费探索 `pendingExp` 并落袋，战败、撤退与终局也不丢污染。`backToTown` 是唯一推进一日的地方。 |

依赖边界：`runStore` 是探索、战斗和界面的唯一连接点；`townStore` 不直接依赖探索会话。探索层提供队伍快照，战斗只接收 `startHp`、`EncounterModifier` 和 `burdenPenalty` 等初始化数据。
