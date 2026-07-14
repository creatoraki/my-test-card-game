# 时刻方舟 · 原型（my-test-card-game）

一个类《超时空方舟》的**网页版卡牌 Roguelite** 原型：以「**时刻制（tick）战斗**」为核心机制，配合「**共享牌库 + 战后构筑成长**」的闭环。

> 目前是**可玩原型**：数据（卡牌 / 角色 / 敌人 / 遭遇战）与规则均为占位默认值，代码结构已按「引擎 / 数据 / 状态 / UI」四层解耦，方便后续替换成正式内容和调整平衡。

---

## 一、核心玩法概览

- **时刻（tick）**：每回合从第 1 时刻开始。打出**普通牌**推进 1 时刻，打出**速攻牌**不推进时刻。
- **敌人排程**：每个敌人有行动间隔 `castTick`，头顶显示**意图 + 倒计时**；当时刻推进到其倒计时归零时行动。回合结束时，本回合还没行动过的敌人会各补一次行动（保证每回合至少被打一次）。
- **资源（光）**：全队每回合共享一个「光」池用于出牌（默认每回合 3 点，不结转）。
- **仇恨（aggro）**：无站位。敌人按仇恨值选择攻击目标，可用「嘲讽」拉仇恨改变敌人目标。
- **构筑闭环**：全队共享一个牌库；每场胜利后可**三选一加卡 / 强化随机牌**，卡组在整场远征中持续成长，串联通关多场遭遇战。

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
└─ src/
   ├─ main.tsx             # React 入口，渲染 <App/> 并引入全局样式
   ├─ App.tsx              # 顶层路由：按 runStore.screen 切换界面
   ├─ styles.css           # 全局深色主题样式（约 640 行）
   │
   ├─ engine/              # ★ 纯 TS 战斗引擎（无 React，无副作用，可序列化、可复现）
   │  ├─ types.ts          # 所有共享类型定义（不含逻辑）
   │  ├─ rules.ts          # ★ 可配置战斗规则常量（调平衡改这里）
   │  ├─ rng.ts            # 可复现伪随机（mulberry32）+ 洗牌
   │  ├─ ops.ts            # 引擎原语：伤害管线 / 治疗 / 护盾 / 状态 / 胜负判定
   │  ├─ statuses.ts       # 状态效果注册表（中毒/力量/易伤/荆棘…含行为钩子）
   │  ├─ effects.ts        # 效果解释器：声明式 EffectDescriptor → 原语调用
   │  ├─ targeting.ts      # 目标选择 + 仇恨（aggro）算法
   │  ├─ deck.ts           # 抽牌堆 / 手牌 / 弃牌堆 / 消耗堆操作
   │  ├─ ai.ts             # 敌人 AI：意图选择（数据驱动脚本）+ 行动执行
   │  ├─ scheduler.ts      # ★ 时刻调度器：推进时刻并结算到点敌人
   │  ├─ battle.ts         # 战斗编排：createBattle / playCard / endRound
   │  ├─ index.ts          # 引擎公开 API（UI/store 只从这里 import）
   │  └─ battle.test.ts    # 引擎单元测试（Vitest）
   │
   ├─ data/                # ★ 内容数据（占位默认，替换正式内容改这里）
   │  ├─ cards.ts          # 卡牌定义（声明式效果）
   │  ├─ characters.ts     # 角色定义（HP / 仇恨 / 初始卡）
   │  ├─ enemies.ts        # 敌人定义（招式 + 意图脚本）
   │  ├─ encounters.ts     # 遭遇战定义 + 一次远征的顺序
   │  ├─ rewards.ts        # 战后奖励卡池
   │  └─ index.ts          # 数据注册表：按 id 索引 + 卡牌实例化/升级
   │
   ├─ store/               # Zustand 状态层（连接引擎与 UI）
   │  ├─ battleStore.ts    # 单场战斗状态（包裹引擎，克隆式不可变更新）
   │  └─ runStore.ts       # 一次「远征」流程（卡组/进度/奖励/界面切换）
   │
   └─ ui/                  # React 视图层（纯展示 + 派发，不含规则）
      ├─ MenuScreen.tsx    # 主菜单：队伍预览 + 开始远征
      ├─ BattleScreen.tsx  # 战斗主界面：敌我单位/手牌/日志/胜负遮罩
      ├─ CombatantView.tsx # 单个战斗单位（血条/护盾/状态/敌人意图）
      ├─ CardView.tsx      # 单张卡牌
      ├─ StatusPips.tsx    # 状态图标一排（emoji + 层数）
      ├─ RewardScreen.tsx  # 战后奖励：三选一加卡 / 强化
      └─ EndScreen.tsx     # 远征结算：胜/负 + 最终卡组
```

---

## 五、各文件功能明细

### 根目录 / 配置

| 文件 | 功能 |
| --- | --- |
| `index.html` | 单页应用入口，包含挂载点 `#root`，通过 module 脚本加载 `src/main.tsx`。 |
| `package.json` | 声明依赖（react / react-dom / zustand）与脚本（dev / build / preview / test）。 |
| `tsconfig.json` | TS 严格模式，配置 `@/*` → `src/*` 路径别名，`bundler` 模块解析。 |
| `vite.config.ts` | 启用 `@vitejs/plugin-react`，并配置 `@` 指向 `src`。 |

### `src/`（入口 & 路由）

| 文件 | 功能 |
| --- | --- |
| `main.tsx` | React 根渲染，`StrictMode` 包裹 `<App/>`，引入全局 `styles.css`。 |
| `App.tsx` | **顶层路由**：读取 `runStore.screen`，在 `menu / battle / reward / victory / defeat` 之间切换对应界面组件。 |
| `styles.css` | 全局深色主题：CSS 变量、卡牌 / 单位 / 血条 / 意图 / 遮罩等所有样式。 |

### `src/engine/`（纯 TS 战斗引擎）

引擎**完全独立于 React**，`BattleState` 无函数、可 `structuredClone`、可存档，且随机数种子在状态内 → **战斗可复现**。

| 文件 | 功能 |
| --- | --- |
| `types.ts` | 引擎与 UI 共享的**类型总集**：`Card` / `Combatant`（`Ally`/`Enemy`）/ `EffectDescriptor` / `StatusDef` / `BattleState` / `EngineOps` 等。只定义类型、不含逻辑、不 import 其他模块。 |
| `rules.ts` | **★ 集中的可配置规则常量**：资源经济、手牌上限、时刻推进量、护盾/虚弱/易伤系数、仇恨模式、升级倍率。调平衡主要改这里。 |
| `rng.ts` | mulberry32 可复现伪随机：`rngFloat/rngInt/rngPick` + Fisher–Yates `shuffle`；`rngState` 存在 `BattleState` 内。 |
| `ops.ts` | **引擎原语与结算落点**：伤害管线（力量→虚弱→易伤→护盾吸收→落定→荆棘反伤）、治疗、加护盾、施加状态、改仇恨、状态生命周期驱动（回合/时刻边界）、胜负判定。 |
| `statuses.ts` | **状态效果注册表**：中毒 / 灼烧 / 再生 / 力量 / 虚弱 / 易伤 / 荆棘 / 眩晕。每个状态带行为钩子（`onRoundStart` / `modifyOutgoingDamage` 等），通过 `ctx.ops` 调用原语——**不 import 引擎实现，避免循环依赖**。 |
| `effects.ts` | **效果解释器**：把声明式 `EffectDescriptor`（DAMAGE / GAIN_BLOCK / HEAL / APPLY_STATUS / DRAW / GAIN_RESOURCE / MODIFY_THREAT）翻译成 `ops` 原语调用，并解析每条效果的作用目标（primary / self / allFoes / randomFoe …）。**卡牌与敌人招式共用**这套。 |
| `targeting.ts` | 目标查询（`aliveOf/foesOf/alliesOf`）与**仇恨算法** `chooseAggroTarget`（最高仇恨 / 加权随机两种模式）。无站位。 |
| `deck.ts` | 抽牌逻辑；抽牌堆抽空时把弃牌堆洗回；受手牌上限约束。 |
| `ai.ts` | 敌人 AI：`buildIntent` 按脚本指针刷新当前意图（含力量加成预览），`enemyAct` 执行意图（处理眩晕跳过、按仇恨选目标、复用效果系统）。 |
| `scheduler.ts` | **★ 时刻调度器**（本作核心特色）：`advanceTick(n)` 逐时刻推进，结算所有 `nextActTick <= tick` 的敌人并重排其下次行动，带死循环安全阀。调度逻辑集中于此，便于日后整体替换。 |
| `battle.ts` | **高层战斗编排**：`createBattle`（建局）/ `startRound`（回合开始补牌、发资源、刷意图）/ `playCard`（出牌扣资源、结算效果、按牌型推进时刻）/ `endRound`（冲刷未行动敌人、结算回合末状态、进入下一回合）。 |
| `index.ts` | 引擎**公开 API 出口**，UI / store 只从这里 import。 |
| `battle.test.ts` | Vitest 单测：初始化、时刻推进（速攻不推进 / 普通 +1）、中毒回合开始结算、回合末冲刷等核心机制。 |

### `src/data/`（内容数据）

均为**占位数据**，替换正式内容/新增内容主要改这一层，无需动引擎。

| 文件 | 功能 |
| --- | --- |
| `cards.ts` | 全部卡牌定义（`CardDef[]`）：归属角色、消耗、普通/速攻、目标类型、声明式 `effects`、稀有度等。含四角色初始卡 + 战后奖励专属卡。 |
| `characters.ts` | 角色定义：看守者（坦克）/ 游侠（输出）/ 医护（支援）/ 术士（AOE），含 HP、初始仇恨、配色、初始卡列表。 |
| `enemies.ts` | 敌人定义：史莱姆 / 哥布林 / 蝙蝠 / 巨兽，含 `castTick`（行动间隔）、`moves`（招式，复用效果系统）、`script`（循环意图脚本）。 |
| `encounters.ts` | 遭遇战定义（每场的敌人组合）+ `RUN_SEQUENCE`（一次远征的遭遇战顺序）。 |
| `rewards.ts` | 战后三选一的奖励卡池。 |
| `index.ts` | **数据注册表**：按 id 建索引 + `getXxx` getter（找不到抛错）；`makeCard`（实例化，带唯一 uid，深拷贝效果）与 `upgradeCard`（升级：数值按倍率提升、名称加 `+`）。 |

### `src/store/`（状态层，Zustand）

| 文件 | 功能 |
| --- | --- |
| `battleStore.ts` | 包裹纯 TS 引擎供 UI 订阅/派发。每次 `play/end` 都先 `structuredClone` 战斗状态再交给引擎修改，保证 React 持有对象不被就地改动（**克隆式不可变更新**）。 |
| `runStore.ts` | 管理一次「远征」的整体流程：持久卡组、队伍、遭遇战进度、战后奖励、界面切换。`startRun` 组建卡组开局，`resolveBattle` 判胜负并推进到奖励/结算，`addCard/upgradeRandom/skipReward` 处理奖励并进入下一场。 |

### `src/ui/`（React 视图层）

视图只负责**展示与派发**，不含战斗规则。

| 文件 | 功能 |
| --- | --- |
| `MenuScreen.tsx` | 主菜单：队伍预览 + 玩法要点 + 「开始一次远征」。 |
| `BattleScreen.tsx` | 战斗主界面：顶部信息条（回合/时刻/光/牌堆数）、敌我单位、目标选择交互、手牌区、结束回合按钮、战斗日志、胜负遮罩。同时高亮敌人预计攻击的最高仇恨友军。 |
| `CombatantView.tsx` | 单个战斗单位卡片：立绘、血条、护盾徽章、状态图标、仇恨值；敌人额外显示**意图徽章 + 行动倒计时**。 |
| `CardView.tsx` | 单张卡牌：消耗、普通/速攻标签、归属角色配色、名称与描述、可出/选中/已强化状态样式。 |
| `StatusPips.tsx` | 一排状态图标（emoji + 层数），悬停显示状态说明。 |
| `RewardScreen.tsx` | 战后奖励：三选一加卡，或强化一张随机牌 / 跳过。 |
| `EndScreen.tsx` | 远征结算：显示胜/负、进度与最终卡组，返回主菜单。 |

---

## 六、设计方案

### 1. 分层架构（关注点分离）

```
data （内容：卡/角色/敌人/遭遇战）
  │  声明式描述符
  ▼
engine （纯 TS 规则：无 React、可序列化、可复现）
  │  公开 API（engine/index.ts）
  ▼
store （Zustand：克隆式不可变更新，连接引擎与视图）
  │  订阅 / 派发
  ▼
ui （React：纯展示 + 交互，不含规则）
```

- **引擎与 React 解耦**：所有战斗规则在 `engine/` 内以纯函数实现，直接修改传入的 `BattleState`；由 store 层负责 `structuredClone` 后再调用，从而对 React 呈现「不可变更新」。引擎因此可被单测、可复现、可存档（`BattleState` 无函数）。
- **可复现随机**：随机种子 `rngState` 保存在 `BattleState` 内，配合 mulberry32 → 相同种子得到相同战斗过程（利于测试与回放）。

### 2. 数据驱动 + 声明式效果

- 卡牌和敌人招式都用同一套 **`EffectDescriptor`**（`{ type, amount, target, status, stacks… }`）声明效果，由 `effects.ts` 统一解释执行。
- **新增一个机制 = 新增一个 `EffectType` + 在 `applyEffect` 的 `switch` 里加一个分支**；新增内容（卡/敌人/遭遇战）只改 `data/`，无需改引擎。

### 3. 状态系统用「行为钩子」

- 状态定义（`statuses.ts`）携带钩子：`onRoundStart` / `onRoundEnd` / `onTick` / `modifyOutgoingDamage` / `modifyIncomingDamage` / `onAfterAttacked`。
- 伤害在 `ops.ts` 里走一条**结算管线**，依次经过施放者修正（力量/虚弱）、目标修正（易伤）、护盾吸收、落定、反伤（荆棘），因此不同状态可自由组合出复杂联动。
- 为**打破循环依赖**：`statuses.ts` 只 import 类型与规则，通过 `ctx.ops`（`EngineOps` 原语集合）反向调用引擎实现，而非直接 import `ops.ts`。

### 4. 时刻制（tick）——核心差异化机制

- 全局时刻时钟 + 敌人行动排程集中在 `scheduler.ts`：出普通牌 `advanceTick(1)`，出速攻牌不推进；每推进 1 时刻就结算所有到点敌人。
- 敌人 `castTick` 决定节奏：蝙蝠极快（1）、巨兽很慢但一击很重（4）。玩家因此要在「快速输出但让敌人频繁行动」与「用速攻牌拖时间」之间权衡。
- 该模块被刻意隔离，**日后要换成「纯先攻轴」等其他调度只需替换这一个文件**。

### 5. 集中可配置的规则

- `rules.ts` 汇总所有平衡旋钮（资源经济、手牌、时刻推进、护盾/虚弱/易伤系数、仇恨模式、升级倍率）。引擎读取这些常量，**调平衡/改机制主要改这一个文件**。

### 6. 可扩展点（后续方向）

- **内容替换**：`data/` 全部为占位默认，替换成正式卡牌/角色/敌人/遭遇战即可。
- **新机制**：加 `EffectType` + handler（效果）、加 `StatusDef`（状态）、加敌人招式/意图脚本。
- **系统级扩展**：资源可扩成每角色独立池 / 结转 / 上限；调度可换轴制；`BattleState` 可序列化 → 易接入存档与回放。
