# 《霓虹都市》· 原型（my-test-card-game）

> 已定的游戏背景与机制依据见 **`游戏设定.md`**。代码内仍有占位命名，后续按确认后的设定逐步替换。

一个类《超时空方舟》的**网页版卡牌 Roguelite** 原型：以「**时刻制（tick）战斗**」为核心机制，配合「**角色养成（等级/属性点）+ 个人卡组改造**」的闭环。

> 目前是**可玩原型**：数据（卡牌 / 角色 / 敌人 / 遭遇战）与规则均为占位默认值，代码结构已按「引擎 / 数据 / 状态 / UI」四层解耦，方便后续替换成正式内容和调整平衡。

---

## 一、核心玩法概览

- **时刻（tick）**：每回合从第 1 时刻开始。打出**普通牌**推进 1 时刻，打出**速攻牌**不推进时刻。
- **敌人排程**：每个敌人有行动间隔 `castTick`，头顶显示**施法倒计时**；当时刻推进到其倒计时归零时行动。**攻击意图默认不可见**——你知道敌人「何时」动手，但不知道「要做什么」；意图数据引擎里照常生成，需靠「洞察」标记揭示（后续会做对应卡牌能力）。回合结束时，本回合还没行动过的敌人会各补一次行动（保证每回合至少被打一次）。
- **资源（光）**：全队每回合共享一个「光」池用于出牌（默认每回合 3 点，不结转）。
- **选目标**：无站位、**无仇恨**。敌人在存活的我方单位里等概率随机挑一个（走战斗 RNG，同种子可复现）。
- **属性与结算**：角色有一张 16 项的固定基础面板（HP / 攻击力 / 治愈力 / 防御力 / 命中率 / 闪避率 / 暴击率 / 爆伤 / 精准 / 先手 / 格挡 / 治愈强度 / 护盾强度 / 异常抗性 / 负重适应 / 手牌上限 / 抽牌数）。攻击牌写的是**攻击力倍率**而不是固定点数；非固定伤害的结算顺序固定为「命中 → 暴击 → 防御 → 格挡 → 护盾 → HP」，防御减伤 `防御/(防御+50)`，格挡成功伤害减半，暴击/闪避/格挡/异常抗性最终值 70% 封顶。**先手**决定敌人行动时刻：`T = max(1, 技能延迟 + 我方先手均值 − 敌方先手)`。口径见 `角色养成设计.md`。
- **手牌与抽牌**：不再是全局定值 —— 小队手牌上限与每回合抽牌数 = 上阵角色对应属性之和 + 全队修正（`RULES.hand`）。第 1 回合抽满至上限，之后每回合只抽抽牌数那么多。
- **养成闭环**：每个角色**独立拥有一个个人卡组**，战斗实际卡组 = 上阵角色个人卡组的集合。角色不设等级、不加属性点，面板进游戏后固定；战斗与探索获得的经验进入角色的**可用经验池**，唯一去处是锻造个人卡组（升卡组等级 / 抽卡 / 删卡 / 降低最小卡组下限）。卡组等级只改变抽卡时的稀有度权重，稀有度限携（普通 20 / 罕见 6 / 稀有 3）是不可被任何来源提高的硬约束。长期战力主要来自三槽装备的基础属性、随机羁绊词条，以及卡牌与关键词模组形成的战斗内构筑。养成进度是**城镇的持久资产**（localStorage）——跨远征持续，胜败都保留。
  > **三装备槽已实现**：装备从远征里掉落 → 带回据点存进物资中转仓 → 在「装备」抽屉里穿戴/拆卸（`townStore.CharacterState.equipped`，修正层由 `equipModsOf` 现算后进 `deriveStats`）。⚠ **随机羁绊词条、羁绊饰品与重铸尚未实现**：`ItemDef.affinityRollable` / `ItemStack.affinity` 已留好字段但不生成。
- **探索路由**：进入地图后**不是直接战斗**，而是走 **6 轮区域推进**。每轮由两个彼此独立的关卡组成：
  1. **区域路由图（阿弥陀签，等距瓦片战棋视角）** —— 一张 **5 条通道 × 4 个推进段**的横向拼接图，共 **20 个节点事件全程可见**；桥接（旧称横线）**一次性全图揭示，本轮仅此一次机会**（2.0-3.0 秒）。玩家**只在进入区域时选择一次入口通道**，此后信号沿通道向右推进、遇桥接强制跨到相邻通道，每跨过一个推进段抵达一个节点。**抵达 ≠ 结算**：先弹落点浮层给出两条分支，选定后才扣粒子、跑效果。每个节点结算完毕后玩家决定**「继续推进」还是「前往下一区域」**（0-4 次，深度由玩家自己决定）。本轮结束时**强制披露全图桥接与玩家实际路径**，让每次记错都能归因。
  2. **战斗签（老虎机）** —— **战斗必然发生**，路由图上没有任何战斗终点或避战出口。转轮 8 个符号 = **5 张战斗卡 + 3 张战前准备卡**，3 个槽位由玩家按 3 次暂停键定住，再**从 3 张里任选 1 张**执行；选中准备卡则先结算其效果、再随机取一张战斗卡作为本轮战斗条件。**同花加成**：对子 **+0.50**、三连 **+1.50**（加法并入掉落系数）。转轮速度定为「勉强可读」（单槽命中 40-50%），因为**追三连的代价是放弃选择权**。
  - 每轮的推进战斗档位是**固定**的：轻 / 中 / 中 / 大 / 大 / BOSS。**战斗只掉落物品，不直接掉落居民积分**；废料须带回据点出售后才换取积分。
  - **净化粒子**是唯一的难度与时限轴（只降不升——**每节点 −3、每战斗回合 −1**，事件另有增减）。**消耗速度由玩家决定，这就是杠杆**。掉落系数阶梯刻意压平（`K_energy` 仅 1.00→1.60），因为**深潜的回报是「能抵达第 3-4 推进段的高价值节点」而不是乘数**；档位惩罚也按此重新定价。
  - 详见 `探索模式设计.md`（结构 / 数值 / 类型）与 `事件设计.md`（事件与战斗签内容）。
  > ✅ **区域路由图（上面第 1 条）已按新设计整体落地**：4 段拼接图形生成（每段独立合法 + 双射 + 桥接数递增）、20 个节点的深度分层与保底、一次性全图揭示、单次入口选择、逐段推进与 `atNode` 止损决策、本轮线路披露、每节点 −3 粒子、新档位表（`K_energy` 1.00→1.60、惩罚下调）、掉落系数**全加法**合成，以及 §11.1 的**等距瓦片呈现**（瓦片地板 + 小水管连线 + 站立事件图标 + 节点详情侧栏）。
  >
  > ⚠ **老虎机战斗签（上面第 2 条）尚未实现**：本轮结束后按固定档位表（轻/中/中/大/大/BOSS）直接建一场遭遇战，没有转轮、三选一与同花加成，故 K 里的「同花加成」恒为 0。接缝在 `explore/session.startRoundBattle` 与 `data/maps.ts` 的 `battleEncounters`，接上时流程与阶段机都不用改。**「每战斗回合 −1 粒子」也随它一起做**（需要战斗引擎的回合钩子）。
  >
  > 已实现且继续有效的部分：**实物战利品链路**（敌人掉落表 + 事件产出 → **32 格背包**，每占 1 格全队命中/暴击/闪避各 −1%，开战瞬间快照进战斗 → 活着回据点才入仓，团灭全丢，投递口寄回的除外）。⚠ **仍未做**：探索指令（拓扑扫描 / 信号锚点 / 并行探针 / **侧向跨接**）与挑战词条只在 HUD 上留了置灰占位，故 K 里的「Σ 挑战加成」恒为 0（`lateralShiftsLeft` 字段已在会话里占位）。
- **流程**：主菜单 →「开始游戏」→ **据点**（常驻中枢）→ **控制终端 → 下降舱 → 选择地图** → **6 轮区域推进**（每轮：读 20 张节点卡 / 一次性揭示桥接 / 选入口通道 / 逐段推进并在每个节点决定继续或止损 / 本轮线路披露 → 老虎机战斗签 / 三选一 / 推进战斗 / 战后整备）→ 击杀 BOSS 或撤退 → 结算回据点。**当前实现里战斗签那一步是「披露页按下『进入推进战斗』直接开打」。**
  > ⚠ **据点页正在改造中**：现已换成「大厅场景 + 冬眠仓 / 训练室 / 控制终端 / 物资中转仓四个毛玻璃入口」，点击这些入口会播一段**进设施运镜**（镜头以「拿起 → 对焦 → 放大」的节奏推进，前两处短停；界面元素逐个飞出，背景交叉淡入设施场景）。**目前控制终端、冬眠仓与物资中转仓有真实内容**：`ui/ControlTerminalScene.tsx`（下降舱 → 场景内浮层选地图 → 出击；委托 → 三条示例工单的灰化占位，工单系统未接入）、`ui/CryoScene.tsx`（编队 / 队员档案 / 冬眠唤醒 三个浮层）与 `ui/StorageScene.tsx`（库存清单 / 装备调配 / 回收台 三个浮层）；**训练室**进去仍只有背景与「返回据点」。**顶部导航条与「回主菜单」的路仍未恢复**（角落只剩「重置存档」），但**据点已不再是死路** —— 下降舱接的就是 `runStore.startExpedition`，编队则在冬眠仓里。⚠ 旧的 `ExpeditionScreen`（远征选图页）已随探索重做一并删除；`FormationScreen`（旧编队页）仍在但不可达：冬眠仓是设施内 UI，没走那条路由。

---

## 二、技术栈

| 领域 | 选型 |
| --- | --- |
| 构建工具 | [Vite 5](https://vitejs.dev/) |
| UI 框架 | React 18 |
| 状态管理 | [Zustand 4](https://github.com/pmndrs/zustand) |
| 语言 | TypeScript 5（严格模式） |
| 测试 | [Vitest 2](https://vitest.dev/) |

## 三、运行方式

```bash
npm install       # 安装依赖
npm run dev       # 启动开发服务器（Vite）
npm run build     # 类型检查 + 生产构建
npm run preview   # 预览生产构建
npm test          # 运行 Vitest 单元测试
npm run test:watch # watch 模式跑测试
```

---

## 四、目录结构

```
my-test-card-game/
├─ index.html              # 应用入口 HTML，挂载点 #root
├─ package.json            # 依赖与脚本
├─ tsconfig.json           # TypeScript 配置（strict、@/* 路径别名）
├─ vite.config.ts          # Vite 配置（React 插件 + @ 别名）
├─ 游戏设定.md             # ★ 世界观与机制设定：3300 年代苏醒、电子生命城市、粒子污染探索、经验锻造卡组、关键词模组、据点设施与地下城场地
├─ 抠图技巧.md             # 立绘抠图流程与调参经验（配套 scripts/chroma-cut.mjs）
├─ 各文件功能明细.md       # ★ 逐文件的职责说明（比本目录树更细，查某个文件干什么看这里）
├─ 探索模式设计.md         # ★ 探索层总设计（轮次制）：6 轮区域推进、5 通道 × 4 推进段的等距阿弥陀签、老虎机战斗签与同花加成、净化粒子（唯一难度轴，每节点 −3 / 每战斗回合 −1）、全加法掉落系数与按档位分池的挑战词条、侧向跨接、实物战利品与背包、首图「废弃楼层」节点池、类型与状态机（⚠ 代码仍是旧段制，新设计整体待实现，见 §十二 P0）
├─ 事件设计.md             # ★ 节点事件与战斗签内容设计：事件职责与形态、轮次与粒子口径、先手/T_attack、污染卡牌（待改为加权）、场景特殊卡牌、体力极限与结疤（未实现）、废弃楼层战斗签模型（8 符号老虎机）
├─ 探索机制评审.md         # 探索机制的玩家体验评审 + **决策记录**：9 条问题的处理结论、原 §2.1 方案的双射漏洞为何被推翻、讨论中新增的 10 项决策及其理由（已写回设计文档；仅「污染加权方向」待拍板）
├─ 角色养成设计.md         # ★ 角色养成设计：无等级的固定基础面板，装备/卡牌/关键词模组养成，属性计算、负重适应和小队资源规则
├─ 物品设计.md             # ★ 物品与装备设计：三装备槽、稀有度、随机羁绊、羁绊饰品与重铸规则
└─ src/
   ├─ main.tsx             # React 入口，渲染 <App/>；★ 第一行 import "./styles/index.css"（必须排在所有 import 之前）
   ├─ App.tsx              # 顶层路由：按 runStore.screen 选界面，交给 ScreenTransition 编排过场
   │
   ├─ styles/              # ★ 公共样式层（只由 main.tsx 单点引入，必然先于所有组件 CSS 注入）
   │  ├─ index.css         # 只做 @import，固定公共层内部顺序：tokens → base → layout → widgets
   │  ├─ tokens.css        # :root 设计令牌（配色 / 边框 / 圆角等 CSS 变量）；★ 含五档物品稀有度配色 --rarity-*（与卡牌稀有度无关，卡牌那套没有配色）
   │  ├─ base.css          # reset、html/body/#root、body 底纹、button 全家桶、input/code
   │  ├─ layout.css        # 屏幕骨架：.screen / .terminal-screen / .title / .row / .overlay(-card)
   │  └─ widgets.css       # 跨界面复用的小部件：奖励三选一 / 卡组摘要 / 战利品 chip / 经验条
   │
   ├─ engine/              # ★ 纯 TS 战斗引擎（无 React，无副作用，可序列化、可复现）
   │  ├─ types.ts          # 所有共享类型定义（不含逻辑）；★ StatBlock 16 项属性面板 / StatModifier 修正层 / BattleState.burdenPenalty（开战快照的负重惩罚）在这里
   │  ├─ rules.ts          # ★ 可配置战斗/养成规则常量（调平衡改这里）：减伤常量、概率上下限、格挡减免、小队手牌修正、卡组等级曲线/稀有度权重/限携额度/锻造价格
   │  ├─ stats.ts          # ★ 属性结算唯一入口：面板合并 (基础+装备)×(1+%)、战斗内修正叠加、概率封顶、命中率/暴击率/减伤/先手延迟/小队手牌与抽牌数；★ burdenPenalty 是负重换算的唯一真相点，burdenOf 保证只有我方吃负重
   │  ├─ rng.ts            # 可复现伪随机（mulberry32）+ 洗牌
   │  ├─ ops.ts            # 引擎原语：★ 伤害管线（命中→暴击→防御→格挡→护盾→HP，命中与暴击都走 stats 的 hitChance/critChance 以吃到负重）/ 治疗 / 护盾 / 状态与异常抗性 / 战斗内属性修正 / 胜负判定
   │  ├─ statuses.ts       # 状态效果注册表（中毒/力量/易伤/荆棘…含行为钩子与 resistMode 异常抗性口径）
   │  ├─ effects.ts        # 效果解释器：声明式 EffectDescriptor → 原语调用（DAMAGE 的 amount=固定伤害 / multiplier=攻击力倍率）
   │  ├─ targeting.ts      # 目标选择：无站位、★ 无仇恨，敌人等概率随机挑一个存活我方单位
   │  ├─ deck.ts           # 抽牌堆 / 手牌 / 弃牌堆 / 消耗堆操作
   │  ├─ ai.ts             # 敌人 AI：意图选择（数据驱动脚本）+ 行动执行
   │  ├─ scheduler.ts      # ★ 时刻调度器：推进时刻并结算到点敌人
   │  ├─ battle.ts         # 战斗编排：createBattle / playCard / endRound
   │  ├─ index.ts          # 引擎公开 API（UI/store 只从这里 import）
   │  └─ battle.test.ts    # 引擎单元测试（Vitest）
   │
   ├─ explore/             # ★ 纯 TS 探索引擎（与 engine/ 平行的第二个纯逻辑层）
   │  │  ⚠ **老虎机战斗签（`探索模式设计.md` §2.4）尚未实现**：本轮结束后按 §3.1 的固定档位表
   │  │    （轻/中/中/大/大/BOSS）直接建局，接缝是 `session.startRoundBattle`；
   │  │    将来接上时只需在那里多一层「转轮 → 三选一 → 定 encounterId」，流程与阶段机都不用动。
   │  │    随之未做的还有：`slot.ts` + `slot.test.ts`、同花加成、挑战词条、每战斗回合 −1 粒子。
   │  ├─ types.ts          # 探索层类型总集（路由图 RouteBoard/RouteSegment/RouteBridge、节点事件 NodeEvent（depth 深度分层）、队伍快照、净化粒子档位、推进战斗档位、13 个阶段的会话状态；★ 背包 backpack·shipped·pendingPickup 与 GAIN_ITEM/ROLL_DROP/DISCARD_SLOTS/OPEN_CHUTE 四种效果在这里）
   │  ├─ rules.ts          # ★ 可配置探索规则常量：5 通道 × 4 推进段 + 每段桥接数区间与揭示时长（按轮次三档）+ **每节点 −3 粒子** + 轮次→战斗档位表 + 新 5 档净化粒子表（K_energy 1.00→1.60）+ ★ 掉落系数 K（kGlobal 总产出旋钮）与五档品质权重表 + 投递口代价（调探索平衡改这里）
   │  ├─ route.ts          # ★ 4 段拼接阿弥陀签的生成与求解：generateSegmentBridges / generateSegments（每段独立合法、桥接数递增、无空白段）/ traceSegment / laneAfterSegments / lanePath / solveSegmentMapping（每段入→出必为双射）
   │  ├─ session.ts        # ★ 会话逻辑：建局 / **generateRound（4 段图 + 20 个节点，含深度分层与保底修复）** / finishGenerating → sealed / startReveal → revealing（★ 全图桥接一轮只能看一次）/ **chooseEntry（全轮唯一一次入口选择）** / arriveNode（只落点不结算）/ chooseOption（扣每节点 −3 + 分支代价、跑效果）/ confirmNode → **atNode（继续推进 / 前往下一区域，走满 4 段后不得再推进）** / leaveRegion → routeDisclosure / **startRoundBattle（按档位表建局，老虎机将来的唯一接缝）** / finishBattle（胜则进下一轮，第 6 轮 BOSS 胜即通关）/ 能量换算与**全加法**掉落系数；★ 背包的真相点：backpackSlots·burdenNow·addItems·discardStack·useItem·takePending·shipHome·canOpenBackpack·canUseItem，团灭清空走 loseEverything 一处
   │  ├─ route.test.ts     # 路由图单元测试（每段合法性 / 每段双射 / 桥接数递增 / 同种子可复现）
   │  └─ session.test.ts   # 探索会话单元测试（阶段机与不可跳步 / 20 节点的深度分层与保底 / 每节点 −3 与免费节点 / 档位 / 血量继承 / 背包占格与负重 / 团灭清空 / 投递口 / 六轮闭环与 BOSS 轮）
   │
   ├─ items/               # ★ 纯 TS 物品层（与 engine/ explore/ 平行的第三个纯逻辑层）
   │  │  为什么单开一层：物品被**探索层**（背包/掉落）与**城镇层**（仓库/穿戴）对称消费 ——
   │  │  放 engine 会让战斗引擎认识背包，放 explore 会让 townStore 反向依赖远征层。
   │  │  本层只 type-import engine/types 与 engine/rng，不 import explore/ 与 store/。
   │  ├─ types.ts          # ItemDef / ItemStack / ItemCategory / ★ ItemRarity 五档（普通·精良·稀有·史诗·传说，与卡牌的三档 Rarity 是两套）/ EquipSlot / ItemUse / DropEntry
   │  ├─ inventory.ts      # 容器纯函数（背包与仓库共用，**不认识 32 这个数**，容量由调用方传）：occupiedSlots / addToContainer / removeByUid / sortStacks / ★ layoutBackpack（8×4 视觉排布，装备跨 2 格且不跨行）
   │  ├─ drops.ts          # 掉落结算（复用 engine/rng，可复现）：rollCount（finalChance>1 整数保底+小数再掷）/ pickByQuality（qualityBias 在族内右移）/ rollDropTable
   │  └─ inventory.test.ts # 物品层单元测试（占格 / 跨格排布与行末 gap / 溢出 / 掉落可复现与品质右移）
   │
   ├─ data/                # ★ 内容数据（占位默认，替换正式内容改这里）
   │  ├─ cards.ts          # 卡牌定义（声明式效果）：剑士初始卡 + 按稀有度分档的专属抽卡池；攻击牌写攻击力倍率不写死点数
   │  ├─ characters.ts     # 角色定义（★ 固定基础 StatBlock / 初始卡 / 按稀有度分档的专属抽卡池 pools）
   │  ├─ enemies.ts        # 敌人定义（面板 stats + 招式 + 意图脚本 + ★ dropTable 掉落表；castTick 是技能基础延迟，实际间隔叠先手差）
   │  ├─ encounters.ts     # 遭遇战定义（每场的敌人组合 + 可选的手工站位）
   │  ├─ items.ts          # ★ 物品清单（废料 / 模组材料 / 数据存档 / 消耗品 / 三槽装备）；装备按 familyId 分族、每族各占一个稀有度档，掉落时 qualityBias 在族内右移。maxStack 一律 1 ⇒「1 格 = 1 件」，装备占 2 格
   │  ├─ exploreEvents.ts  # ★ 节点事件池（首图「废弃楼层」，按生存/成长/经济/路由/能量/风险/终局七类分组；⚠ **战斗类事件池与「BOSS 接入点」已删除** —— 战斗改由战斗签承担；每个事件用 `depth` 声明允许出现的推进段、终局类用 `minRound` 声明最早轮次；仍未实现的条目标 disabled 不参与抽取）
   │  ├─ maps.ts           # ★ 地图定义（区域轮数 / 事件池 id / **四个战斗档位各打哪一场 battleEncounters** / 起始净化粒子 / 高档位填充敌人）
   │  └─ index.ts          # 数据注册表：按 id 索引（含 ★ 物品与家族索引）+ 卡牌/物品实例化 + 事件池查找
   │
   ├─ store/               # Zustand 状态层（连接引擎与 UI）
   │  ├─ battleStore.ts    # 单场战斗状态（包裹引擎，克隆式不可变更新）
   │  ├─ exploreStore.ts   # ★ 探索会话状态（包裹 explore/session，克隆式不可变更新）：generateDone / beginReveal / revealDone / pickEntry / arrive / pickOption / confirmNode / pushOn / leaveRegion / startBattle / settleBattle；含背包 action：discardItem / useItem / takePending / abandonPending / shipHome
   │  ├─ townStore.ts      # ★ 城镇档案：编队/个人卡组/可用经验池/卡组锻造（升级·抽卡·删卡·降下限）/稀有度限携/★ 物资中转仓 storage（无上限）与三装备槽 equipped/居民积分（persist → localStorage，key `town-profile-v4`）；`deriveStats` 是局外面板的唯一换算点，装备修正由 `equipModsOf` 从 equipped 现算（不另存一份）
   │  └─ runStore.ts       # 一次「远征」流程编排（界面路由 + 路由图与战斗的往返 + 终局结算）；★ 开战时用 burdenNow 快照负重传进 BattleSetup，收尾时 bankEverything 把积分与实物一起入仓
   │
   └─ ui/                  # React 视图层（纯展示 + 派发，不含规则）
      │  ★ 样式约定：下列**每个 .tsx 组件旁都贴着一个同名 .css**（如 BattleScreen.tsx ↔ BattleScreen.css），
      │  由组件自己在 import 块末尾 `import "./<同名>.css"`。类名仍是全局的（没用 CSS Modules），
      │  同名只是「这段样式归谁」的边界约定。纯逻辑模块（transitions.ts / animations.ts / stage.ts / facilityScenes.ts…）没有 .css。
      │  合并主题层后**每个选择器全项目只有一处定义**，组件 CSS 之间的加载顺序不影响结果。
      ├─ unit-badges.css   # ★ 唯一没有同名组件的 CSS：CombatantView 与 AllyBar 共用的护盾徽章/阵亡遮罩，两者都 import（Vite 自动去重）
      ├─ transitions.ts    # ★ 场景过场预设表：全局开关 + 特效登记 + 按路线/按界面配置
      ├─ ScreenTransition.tsx # 过场编排：出场 → 黑场停顿 → 入场（串行）
      ├─ MenuScreen.tsx    # 主菜单：1920×1080 设计画布开屏（复用 stage.ts，恒 16:9、四周黑边）——视频背景（菜单.mp4 铺满 cover）+ 游戏标题图（场景/霓虹都市.png，无滤镜无动画的纯图，left/top/width 在内联 style 微调）+ 「开始游戏」按钮（MenuStartButton，right/bottom/width 在内联 style 微调 → 城镇）
      ├─ MenuStartButton.tsx # ★ 「开始游戏」霓虹牌匾按钮：图 + 轮廓跑光/内部光尘/外溢火星三层特效（用 PNG 自身 alpha 当 mask）
      ├─ StartGameButton.tsx # 「开始游戏」像素科技风艺术字按钮（内联 SVG 像素化滤镜 + 黑白金属质感 + HUD 装饰[角框/闪烁光标/扫描线] + 硬像素投影 + 悬停通电切蓝白）
      ├─ TownScreen.tsx    # 据点大厅：1920×1080 设计画布（复用 stage.ts，恒 16:9、四周黑边）+ 大厅.png 固定背景 + 右下 718×350 的 bento 毛玻璃面板（6 块形状各异的半透明玻璃砖拼成规则矩形：冬眠仓/训练室/控制终端 3 个真入口 + 3 个未开放占位，图标为内联线框 SVG）+ 角落的重置存档；★ 点真入口播「进设施」演出（3s「拿起→对焦→放大」运镜，前两处短停 + 界面元素逐个错峰飞出 + 背景交叉淡入设施场景，参数见 facilityScenes.ts）；★ 设施内容走模块级 FACILITY_CONTENT 登记表（目前 worklog → ControlTerminalScene、cryo → CryoScene、storage → StorageScene）；⚠ 训练室仍是空场景。⚠ 解锁一个设施要**同时**去掉 `locked` 并在 facilityScenes 里登记场景 —— `openable = !locked && hasFacilityScene(id)`
      ├─ facilityScenes.ts # ★ 进设施演出预设表：设施 id → 背景图/推镜焦点/倍数 + 相机换算 + 时间轴与飞出参数（据点专用，无 .css）；已登记 cryo/training/worklog/storage 四处（⚠ storage 暂借用「大楼废弃楼层.png」，专属图到位后只改这一行）
      ├─ ControlTerminalScene.tsx # ★ 控制终端（设施 worklog）的设施内 UI：亮色玻璃基调（白底场景专用的 --term-* 一套，不复用 .bento-glass）+ 右侧两条**抽屉式入口**（常态半隐在画布右缘外，悬浮哪条哪条向左弹出）→「下降舱」浮层（地图列表/预览图/队伍摘要 → startExpedition 出击）与「委托」浮层（3 条示例工单全灰化，工单系统未接入）；浮层**无全局遮罩**，背板是白色毛玻璃，顶边左右各 34% 处垂两根**吊绳**（.term-modal 的伪元素，靠 PANEL_SIZE 传来的 --panel-w/h 定位），开合是 600ms 的「连绳带板从天花板滑下 / 收回」
      ├─ CryoScene.tsx     # ★ 冬眠仓（设施 cryo）的设施内 UI：与 ControlTerminalScene **完全同构**（右侧三条**抽屉式入口** + **无遮罩吊绳浮层**，场景上只有标题 + 读数 + 抽屉，点入口才弹浮层），只把亮玻璃的强调色从深青换成**深紫罗兰 #7c4dbe**（冬眠仓.png 是紫粉白的浅色场景，--cryo-* 一套）。三条抽屉 → 三个浮层：①「编队」= partySize 个**冷冻舱造型**出战槽（舱盖灯带 / 玻璃反光 / 空槽画四角括号 + 呼吸 ＋）+ 待命名册，互相编入/撤出，编入播「光柱注入」、撤出播「弹出落位」；②「队员档案」= 左名册 + 右**只读**详情（立绘 / 可用经验 / **16 项属性面板按四组竖排，每行带滚动数值 + 占比微条** / 卡组等级与最小卡组下限 / 个人卡组逐张翻入），换人时右栏整块重挂重播；③「冬眠唤醒」= **2 列舱位网格**（已解封 / 密封 / 无信号三态靠灯带·状态灯·冷雾浓度区分，至少 `POD_SLOTS`=6 格）+ 右侧舱位详情（密封舱带缓慢扫描环 + 四格滚动读数）+「解封唤醒 −awakenCost 居民积分」→ `townStore.awaken`。★ 浮层背板上还有一层常驻氛围 `CryoAmbience`（冷凝雾 / 扫描线 / 8 粒霜花，纯 CSS、只动 transform），内容一律在面板落定（`CONTENT_DELAY_MS`）后按 `--i` 错峰浮现。⚠ 卡组锻造（升级/抽卡/删卡/降下限）刻意**不**在这里（按 `游戏设定.md` 的设施分工归训练室）；角色不设等级，也就没有属性加点这回事。⚠⚠ `.cryo-scene`/`.cryo-entries`/`.cryo-modal` 三层永远不能挂 animation/opacity/transform/filter（会成 backdrop root 把玻璃糊死），动画一律挂叶子
      ├─ StorageScene.tsx  # ★ 物资中转仓（设施 storage）的设施内 UI：与 CryoScene / ControlTerminalScene **逐层同构**（右侧三条抽屉式入口 + 无遮罩吊绳浮层，场景上只有标题 + 读数 + 抽屉）。差别只有两处：借用的「大楼废弃楼层」是**暗色**场景 ⇒ 走暗玻璃配方，强调色换成**琥珀橙 #e59b3f**（--stor-* 一套）。三条抽屉 → 三个浮层：①「库存清单」= **无上限**的流式网格（复用 ItemSlot + ItemTabs）+ 详情 + 丢弃二次确认；②「装备」= 左名册 → 中三个槽位（武器/防具/饰品）→ 右仓库里的候选，穿戴/拆卸后 16 项面板当场变（deriveStats 现算）；③「回收台」= 废料批量勾选出售换居民积分（**探索层产出变成城镇通货的唯一途径**）。⚠⚠ 与 CryoScene 同一条约束：`.stor-scene`/`.stor-entries`/`.stor-modal` 三层永远不能挂 animation/opacity/transform/filter
      ├─ ItemSlot.tsx      # ★ 物品格共用件（背包 / 仓库 / 战后小结 / 远征结算四处共用）：五档稀有度边框（层数逐档加码：细边 → 内描边 → 外发光 → 左上切角三角标，颜色读 tokens.css 的 --rarity-*）+ 分类图标 + 堆叠数；装备用 `grid-column: span 2` 真的横跨两格。附带导出 EmptySlot（空格 / 行末让出的死格）
      ├─ ItemTabs.tsx      # ★ 分类 tab 条共用件：一级按类别（全部/装备/消耗品/模组材料/数据存档/废料，各带计数），选中「装备」时展开武器/防具/饰品二级 tab
      ├─ ItemDetail.tsx    # ★ 物品详情共用件：名称按稀有度着色 + 类别/槽位/占格 + 描述 + 装备属性增减 + 售价；操作按钮走 children 插槽（探索里是使用/丢弃，据点里是穿戴/出售）
      ├─ itemFilters.ts    # 分类 tab 的定义与过滤规则（纯 TS，两个界面共用，无 .css）：ITEM_TABS / EQUIP_TABS / matchTab / tabCounts
      ├─ itemArt.tsx       # 物品图标查找表（与 enemyArt.ts / cardArt.ts 同约定，数据层不碰素材）：7 个 48×48 **内联线框 SVG**，全部 `stroke="currentColor"` ⇒ 由父级 .item-slot 的 `color: var(--rr)` 自动染上稀有度色，一套图标覆盖全部五档，不依赖任何美术资源
      ├─ BackpackPanel.tsx # ★ 探索页背包浮层：8×4 = 32 格网格（layoutBackpack 排版，装备跨 2 格不跨行）+ 分类 tab + **顶部实时负重读数**（`负重 14/32 · 命中 −14% 暴击 −14% 闪避 −14%`，key 挂占格数 ⇒ 丢一件就跳一下）+ 丢弃二次确认（在详情区原地换按钮，不叠二级模态）+ **替换模式**（pendingPickup 非空时强制打开且关不掉，丢够格子才拿得走）+ **寄件模式**（投递口开启时多选寄回）；沿用探索页的无遮罩上方滑入语言，⚠ 开放时机的真相点在 explore/session.canOpenBackpack，本组件只画结论
      ├─ useCountUp.ts     # 数值滚动共用件（rAF 驱动，从 0 或上一值滚到目标，可延迟起跑；`prefersReducedMotion()` 下直接给终值）——目前冬眠仓的属性面板与舱位读数在用
      ├─ mapArt.ts         # 地图 id → 场景图的查找表 + warmMapArt() 预热（与 battleBg.ts 同约定；那边是战斗背景，这边同时供下降舱的选层预览与探索页的全屏底图）
      ├─ ExploreScreen.tsx # ★ 探索主界面：1920×1080 设计画布（复用 stage.ts）+ 废弃楼层背景全屏铺满 + 中央**等距区域路由图**面板；四角 HUD —— 左上区域/轮次 n/6/推进段 m/4/阶段提示/本轮战斗档位、右上读数（净化粒子表 / 污染层数 / 居民积分 / ★ 负重实时读数）、**左上空三角里的节点详情侧栏**（等距棋盘沿左下→右上铺开，包围盒的左上/右下两角本来就空着）（悬停任一节点图标即展开完整文本与两条分支预览）、左下队伍血条（复用 HpBar）、右下探索指令（置灰占位，含侧向跨接剩余次数）+ ★ 背包按钮（按 `session.canOpenBackpack` 锁阶段，开 BackpackPanel；背包装不下东西时强制打开且不许推进）+ 撤离；★ 浮层一律落在图的**下方**且无全屏遮罩：landed 选分支 → resolving 看结算 → **atNode 两个并排等重按钮（继续推进：下一段 −3 粒子 · 该段 N 根桥接 ／ 前往下一区域：放弃剩余 K 个节点）** → **routeDisclosure 披露页 +「进入推进战斗」**；聚焦靠四角 HUD 的 `.is-recede`（只压叶子元素）与落点升起的光柱 `.expl-beam`；⚠ 舞台与玻璃砖的祖先链上禁挂 animation/opacity/transform/filter
      ├─ RouteBoard.tsx    # ★ 等距区域路由图本体（一张 SVG 打全部阶段，**经典战棋的等距平行投影**：2:1 斜率，推进轴 = 左下→右上、通道轴 = 左上→右下，四个方向分别指向左上/右上/左下/右下，整张图是一块斜置的棋盘）：generating **新区域 2 秒沿推进方向逐条浮现**（起点地板 → 水管 → 节点地板，时长由导出的 `GENERATE_MS` 统一，全程锁交互，桥接不出现）→ sealed 图已就位但**桥接仍遮蔽**、正中悬「探索路线」按钮 → revealing **全图 4 段桥接一次性全显** + 顶部倒计时条（时长取按轮次分档的 `revealDurationMs`，★ 一轮仅此一次）→ choosingEntry 桥接**只改 opacity 不卸载**、入口通道 A-E 可点（blockedLanes 置灰）→ advancing 信号顺主管推进、到岔口拐上桥管落到隔壁通道（dash 点亮 + 亮头尾迹 + 过桥扩散环 + animateMotion 信号点，0.42 设计 px/ms 的慢速）→ landed/atNode 落点地板被「撞」一下并高亮、已走过的路径保持点亮 → routeDisclosure 全图桥接常亮 + 实际路径整条描出 + 被放弃的节点压暗；★ 画面语言 = **瓦片地板 + 小水管**：起点与 20 个节点都是一块带厚度的等距瓦片地板（2:1 菱形顶面 + 侧面 + 地砖缝），地板上**站着**一个立体化的 48×48 内联线框 SVG 图标（暗部厚度 / 主体线框 / 受光边三层叠加 + 脚下椭圆投影，不用 emoji），地板之间用细圆柱小水管相连（暗轮廓 + 管身 + 顶部高光 + 圆头端帽插进地板）；⚠ **桥管与主管完全同款**，等距下「两轴撞车」的风险改由三件事承担——① 朝向天然相反（主管右上 / 桥管右下）② 地板只长在推进轴上 ③ 桥管平时根本不在画面上；节点文字详情走 ExploreScreen 的侧栏；入口 A-E 是**同款地板 + 立体字母**（多层 text-shadow 挤出厚度，常态极缓慢上下浮动、悬停定住抬起并把所属通道整串水管点亮，封锁态地板描边转虚线、字母划掉）；⛔ 全页禁止闪烁型明暗变化
      ├─ EnergyMeter.tsx   # ★ 净化粒子仪表（取代旧 DangerMeter）：5 格档位条 + 数值 + 档名 + 「本段结束后将跌入〈告急〉」的跨档预警（档位真相点在 explore/session.energyTier）
      ├─ TerminalNav.tsx   # 非战斗界面共用的顶部终端导航条（探索页走全屏场景，不挂它）
      ├─ BattleScreen.tsx  # ★ 战斗主界面：顶端信息条（贴死画布上沿：法力/换牌丢弃/手牌读数/时刻标尺/结束回合）+ 敌我单位/手牌/胜负遮罩 + 分镜编排 + 场景相机（世界坐标）
      ├─ animations.ts     # ★ 出牌动画预设表：CINEMA 分镜时间轴/相机参数/顿帧震屏/空闲漂移 + ANIM 每种特效的预设
      ├─ ambience.ts       # ★ 场景氛围预设表：地图 id → Canvas 粒子发射器 + 灯光闪烁 + 屏幕调色
      ├─ AmbienceLayer.tsx # 氛围层：双 Canvas（远/近景粒子，单 rAF 驱动）+ 屏幕空间调色层
      ├─ useIdleTwitch.ts  # 待机小动作：每隔几秒随机让一个存活敌人抖一下
      ├─ CombatantView.tsx # 敌人单位（无框立绘 + 下方血条/状态 + 倒计时/意图 + 受击特效挂载点）
      ├─ AllyBar.tsx       # ★ 我方队伍卡：底部 HUD 左段，固定 3 格描边立绘卡（血条/护盾条 + 护盾角标；悬停/选中手牌时归属槽位变宽点亮）。⚠ 仇恨移除后不再有「敌人预计打谁」的高亮
      ├─ HpBar.tsx         # ★ 血条共用件（敌我共用）：血量分档配色 + 流光带/端头火花/掉血迸溅粒子
      ├─ TickRuler.tsx     # ★ 顶端信息条里的时刻标尺（当前时刻高亮；敌人行动标记开关预留；其右侧紧接结束回合按钮）
      ├─ HitFxLayer.tsx    # 命中表现共用件：首击特效 + 飘字 + 受击反应类名/变量（敌我共用）
      ├─ CharacterPortrait.tsx # 角色立绘（有图用图，无图回退 emoji）；半身像/头部两套取景登记
      ├─ EnemySprite.tsx   # 敌人待机立绘播放器（横向拼条 + steps() 无限循环）
      ├─ enemyArt.ts       # 敌人 id → 待机拼条立绘的查找表 + 预加载
      ├─ battleBg.ts       # 地图 id → 战斗背景素材（视频 / 静态图）的查找表 + 预加载
      ├─ stage.ts          # ★ 设计画布（战斗 + 封面共用）：STAGE(1920×1080 基准) + useStageScale（画布→窗口的等比缩放）
      ├─ SpriteFx.tsx      # 序列帧播放器（逐帧 <img> 用 animation-delay 错开）
      ├─ IaiSlashFx.tsx    # 居合斩程序化特效（蓄力光点 + 左下→右上斩痕刃光，纯 CSS 无素材）
      ├─ vfxSprites.ts     # 序列帧图 URL 表 + 预加载
      ├─ SkillCutInCard.tsx# 出牌「亮相」卡面浮层（左侧飞入 → 停留 → 飞出）
      ├─ HandCard.tsx      # 手牌单卡（三段式卡面：顶行 3D 水晶费用 + 卡名 / 中间 1:1 配图 / 底部效果说明；发牌飞入 / 出鞘离场 / 机能边框 + 巡游流光；悬停只向上弹出半张卡高、不放大）
      ├─ CardView.tsx      # 单张卡牌（奖励/结算界面用）
      ├─ CardInfoPanel.tsx # 手牌右侧的固定卡牌说明面板（1:2 竖版：上半 1:1 大卡面 + 下半信息；无卡时科幻待机占位）
      ├─ ManaCrystalIcon.tsx # 「光」资源水晶图标（内联 3D SVG 宝石，中央桌面留给费用数字）
      ├─ cardArt.ts        # 卡面配图查找表
      ├─ StatusPips.tsx    # 状态图标一排（emoji + 层数）
      ├─ ExpRewardScreen.tsx # 战后小结：净化粒子档位与产出倍率 + 各角色经验入账；⚠ 当前“本场居民积分”展示属于 P0 临时占位，正式规则为战斗掉落物品、废料回据点出售换积分（★ 无等级，故没有升级提示与进度条）
      └─ EndScreen.tsx     # 远征结算：通关/撤退/团灭三种收场 + 「远征记录」（session.history 逐段列出入口/落点事件/能量）+ 居民积分落袋
```


# 操作事项
如需要查看某个文件的具体功能，可查看 F:\new\my-test-card-game\各文件功能明细.md