# 探索引擎

路径：`src/explore/`。管理一趟远征和区域路由，不负责具体战斗内部结算。

| 文件 | 作用 |
| --- | --- |
| [types.ts](../../src/explore/types.ts) | 路由图、节点、探索效果、背包状态与会话阶段类型。 |
| [rules.ts](../../src/explore/rules.ts) | 路由规模、粒子档位、轮次战斗档位、掉落系数和投递口规则。 |
| [route.ts](../../src/explore/route.ts) | 路由段生成、桥接、走线和通道映射。 |
| [session.ts](../../src/explore/session.ts) | 建局、区域推进、节点结算、离场、战斗接缝、背包与团灭清算。 |
| [route.test.ts](../../src/explore/route.test.ts) | 路由合法性、双射和可复现测试。 |
| [session.test.ts](../../src/explore/session.test.ts) | 阶段机、粒子、背包、六轮闭环等测试。 |

关键边界：`session.startRoundBattle` 是探索到战斗的接缝；探索层只提供战斗初始化所需的数据，不把背包规则塞进 `engine`。
