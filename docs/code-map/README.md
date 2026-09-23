# 代码地图索引

这组文档是按需加载的代码地图。动手前先读本索引，再按任务只打开 1–2 份模块说明，不要一次加载全部。

## 按任务选文档

| 任务范围 | 阅读文件 |
| --- | --- |
| 入口、构建配置、环境开关、离线脚本 | [project.md](project.md) |
| 战斗规则：卡牌结算、时刻调度、伤害管线、状态、遗物、挑战 | [engine.md](engine.md) |
| 探索规则：房间图、房间内场景、可交互物件、粒子计价、野餐 | [explore.md](explore.md) |
| 物品类型、背包/仓库容器、掉落、装备词条 | [items.md](items.md) |
| 卡牌、角色、敌人、遭遇战、卡牌模组、羁绊 | [data-combat.md](data-combat.md) |
| 地图、难度、物件数据、物品表、科技树、商店、台词 | [data-world.md](data-world.md) |
| Zustand 状态、远征流程编排、城镇存档 | [store.md](store.md) |
| 全局样式、设计令牌、CSS Modules 约定 | [styles.md](styles.md) |
| 顶层过场、美术登记表、音频、通用 hooks、主菜单、结算页 | [ui-app.md](ui-app.md) |
| 战斗界面与攻击特效 | [ui-battle.md](ui-battle.md) |
| 探索界面：横向场景、小地图、事件档案、奖励浮层 | [ui-explore.md](ui-explore.md) |
| 据点全景与设施（商店、医疗室、研究中心、工房、训练室、博物馆）、出击准备 | [ui-town.md](ui-town.md) |
| 编队页、角色详情、卡组成长 | [ui-character.md](ui-character.md) |
| 公共组件：悬浮详情、物品格、科技板、确认框、引导 | [ui-common.md](ui-common.md) |

## 分层与依赖方向

```text
ui ──▶ store ──▶ explore ──▶ items
 │        │         │  └────▶ engine
 │        │         └───────▶ data
 │        └──▶ engine / data / items
 └──▶ engine（只经 engine/index.ts）/ data / items 的类型与查询
data ──▶ engine / explore / items 的类型
```

- `engine/`、`explore/`、`items/` 都是纯 TypeScript：不引用 React，不引用 store。所有函数都会直接修改传入的状态对象，由 store 层先 `structuredClone` 再调用。
- `store/` 不引用 `ui/`。`runStore` 单向依赖 `townStore`。
- 素材只在 `ui/art/` 中登记，数据层不接触任何图片路径。

## 使用规则

- 规则真相点（`engine/rules.ts`、`explore/rules.ts`、`explore/energyCost.ts`、`data/mapDifficulty.ts`）优先于组件实现。
- 文档中标 ⚠ 的是易踩坑点；标“遗留”的是旧节点路线玩法的残留，UI 已不再调用。
- 设计文档与代码不一致时，以实际代码为准；修改代码后同步更新对应的模块说明。
- 代码健康度与整改建议见 [代码健康度审查](../代码健康度审查.md)。

## 不在地图范围内

- `src/ui/test/`：开发用演示与实验页，通过 `?page=test` 进入（见 [App.tsx](../../src/App.tsx)），本地图不记录它。⚠ 正式代码 `ui/common/BuffIcon/emblemGeometry.ts` 仍引用其中的 `opus/CultivationSigil/cultivationGeometry`。
- `src/assets/`：美术与音频素材，登记关系见 [ui-app.md](ui-app.md) 的“美术登记表”一节。
