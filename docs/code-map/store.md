# 状态层

路径：`src/store/`。Zustand 连接纯逻辑层与 React；城镇档案持久化，远征过程和远征背包不持久化。

| 文件 | 作用 |
| --- | --- |
| [battleStore.ts](../../src/store/battleStore.ts) | 单场战斗状态包装。`play/end/wait` 前先 `structuredClone`，再调用引擎，避免 React 持有对象被原地修改；`pickPendingChoice` / `cancelPendingChoice` 同样克隆后提交待选择回收结果；`seq` 标识新战斗，供 UI 重置分镜。 |
| [exploreStore.ts](../../src/store/exploreStore.ts) | 探索会话与背包 action 包装，按阶段机调用 `explore/session`；转发交易终端购买、待拾取物品、隐藏休息/NPC、待办成长奖励、定向经验和经验消费 action。待拾取的模组另有 `installLootModule`：不进背包直接调 `townStore.installModuleStack` 上卡，装成了才把它从 `pendingLoot` 划掉。远征途中换装另有 `takeBackpackItem` / `putBackpackItems` / `syncPartyVitals` 三个搬运转发，编排在 `runStore`。纯函数返回无效时不替换状态，远征中途刷新即作废。 |
| [sortieStore.ts](../../src/store/sortieStore.ts) | 出击准备临时状态：保存地图、背包和本次购买账本；购买货柜物品、取出仓库消耗品前先校验容量，取消时按来源退款或退回仓库。状态不持久化，正式出击后由 `runStore` 透传背包并清空。 |
| [townStore.ts](../../src/store/townStore.ts) | 持久化城镇档案：角色 profile、回城记录的当前 HP 与体力极限 `hpLimit`（两者都是跨日传承的永久损伤，局外读数统一走 `vitalsOf`；据点换装时由 `shiftVitals` 按上限增减平移，损伤量保留）、唤醒、编队、经验池、个人卡组、污染值、生病、怪癖、卡组锻造、免费三选一/删卡、居民积分、仓库、装备和出售，以及生存天数 `day`、商店货架 `shop`、已通关地图 `clearedMaps`、`squadTalent`（`badgeId` + 已激活节点 id 数组 `nodes`）、`nutrition`（已研究科技 id 和疗养中角色快照）与 `codex`（物品、卡牌、敌人永久收录 id 数组）。训练点由上阵角色卡组等级之和实时计算；营养舱通过 `admitToNutritionPod` 在入舱时扣 100 积分、移出队伍并保存当日治疗量，`advanceDay` 统一负责次日恢复体力极限并清空 occupants；科技研究由 `researchNutritionTech` 复用 `data/nutritionPod` 的可用性和材料判定。`recordCodex` 只做数组并集，避免重复收录触发持久化；全局 `codexCollector` 订阅城镇、探索和战斗 store，在物品进入可见库存、卡牌进入角色卡组或敌人遭遇后统一收录。装备槽除走仓库的 `equipItem` / `unequipItem` 外，另有不经仓库的原子 `wearStack` / `takeOffStack`（远征途中与背包互换时由 `runStore` 调用，前两者内部也复用它们）。模组相关有 `equipCardModule` / `unequipCardModule`、不经仓库的 `installModuleStack`（远征途中从待拾取框直接装载，装配校验的唯一真相点，`equipCardModule` 也复用它）与 `craftModule`（按 `data/moduleCrafting` 的配方扣角色经验与仓库材料，产出模组入库）。存档 key 为 `town-profile-v16`，不兼容旧版本存档。 |
| [runStore.ts](../../src/store/runStore.ts) | 远征流程总编排和界面路由。`beginDescent` / `finishDescent` 与 `pendingDescent` 负责出击到探索之间不可跳过的电梯过场，视频结束后才调用 `startExpedition` 建立会话；启动战斗前消费待处理污染请求并污染当前队伍个人卡组；启动战斗时合并存活队员卡组、羁绊与临时光环，计算完整面板，传入污染/疾病/怪癖与继承的三段血量；远征收尾统一消费探索 `pendingExp` 并落袋，战败、撤退与终局也不丢污染；`bankEverything` 同时把最终 HP 与体力极限写回城镇档案（阵亡成员按 1/1 保底），`partySnapshot` 出发时也不再回满，直接读 `vitalsOf` 的存档值。`backToTown` 是唯一推进一日的地方。远征途中换装由 `equipFromBackpack` / `unequipToBackpack` 编排：阶段限制同背包（`canOpenBackpack`），背包容量一律校验、失败整体回滚，成功后按 `deriveStats` 同步队伍快照的生命上限与负重适应（只裁不补，当前血量不因换装回复）。 |

依赖边界：`runStore` 是探索、战斗和界面的唯一连接点；`townStore` 不直接依赖探索会话。探索层提供队伍快照，战斗只接收 `startHp`、`EncounterModifier` 和有效负重 `burden` 等初始化数据。
