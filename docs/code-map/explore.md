# 探索引擎

路径：`src/explore/`。管理一趟远征、路由图、节点事件、战斗签和背包，不负责具体战斗内部结算。与 `engine/` 平行、无 React 和副作用，可复制、可单测。

当前一轮是 5 通道 × 4 推进段的路由图，完成节点后进入战斗签流程；一趟远征默认 6 轮，最后一轮为 BOSS。旧的危险度/残片模型已废弃，以净化粒子、能量档位和实物背包为准。

| 文件 | 作用 |
| --- | --- |
| [types.ts](../../src/explore/types.ts) | 路由图、节点事件、探索效果、队伍快照、能量/战斗档位、节点记录、背包和会话阶段类型。只定义类型。 |
| [rules.ts](../../src/explore/rules.ts) | 路由规模、桥接数和揭示时长、节点粒子消耗、轮次战斗档位、BOSS 缩放、团灭、投递口、能量档位和掉落品质权重。探索平衡优先改这里。 |
| [route.ts](../../src/explore/route.ts) | 路由段桥接生成、走线、通道映射与求解。每段入/出通道必须是双射；UI 隐藏桥接时不能读取求解结果。 |
| [slot.ts](../../src/explore/slot.ts) | 战斗签老虎机：转轮构造、定格位置、符号组合判定、准备卡和战斗卡回落。 |
| [session.ts](../../src/explore/session.ts) | 会话状态机：建局、生成/揭示/选入口、到达节点、选项结算、推进、离场、战斗签、战斗接缝、能量/掉落系数、背包、寄件和团灭清算。`battleModifier` 是能量档位与战斗签条件的唯一合并点。 |
| [route.test.ts](../../src/explore/route.test.ts) | 桥接合法性、双射、入口到末段映射、递增桥接、无空白段和同种子复现。 |
| [slot.test.ts](../../src/explore/slot.test.ts) | 符号数、三轮不同相、组合数值、准备卡回落和阶段白名单。 |
| [session.test.ts](../../src/explore/session.test.ts) | 阶段机、节点保底、粒子、能量档位、六轮闭环、血量继承、团灭、背包和投递口。 |

关键边界：流程收尾链为 `routeDisclosure → slotSpinning → slotChoosing → inBattle`。`session.startSlot` 是路由图到战斗签的接缝，`session.chooseSlotCard` 是战斗签到战斗的接缝。store 只负责克隆和编排，不把背包规则塞进 `engine`。

`slot.reelIndexAt` 与 [SlotReels.css](../../src/ui/SlotReels.css) 的 `slotSpin` 是同一件事的数值与表现两面，修改一处必须同步检查另一处。
