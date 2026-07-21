# 时刻方舟 · 原型（my-test-card-game）

一个类《超时空方舟》的**网页版卡牌 Roguelite** 原型：以「**时刻制（tick）战斗**」为核心机制，配合「**角色养成（等级/属性点）+ 个人卡组改造**」的闭环。

> 目前是**可玩原型**：数据（卡牌 / 角色 / 敌人 / 遭遇战）与规则均为占位默认值，代码结构已按「引擎 / 数据 / 状态 / UI」四层解耦，方便后续替换成正式内容和调整平衡。

---

## 一、核心玩法概览

- **时刻（tick）**：每回合从第 1 时刻开始。打出**普通牌**推进 1 时刻，打出**速攻牌**不推进时刻。
- **敌人排程**：每个敌人有行动间隔 `castTick`，头顶显示**施法倒计时**；当时刻推进到其倒计时归零时行动。**攻击意图默认不可见**——你知道敌人「何时」动手，但不知道「要做什么」；意图数据引擎里照常生成，需靠「洞察」标记揭示（后续会做对应卡牌能力）。回合结束时，本回合还没行动过的敌人会各补一次行动（保证每回合至少被打一次）。
- **资源（光）**：全队每回合共享一个「光」池用于出牌（默认每回合 3 点，不结转）。
- **仇恨（aggro）**：无站位。敌人按仇恨值选择攻击目标，可用「嘲讽」拉仇恨改变敌人目标。
- **养成闭环**：每个角色**独立拥有一个个人卡组**，战斗实际卡组 = 上阵角色个人卡组的集合。战斗胜利**不掉卡**，只给上阵角色发经验；**升级不涨基础属性，只获得 5 属性点**。属性点在城镇「编队」里二选一花法：加四维属性（生命/攻击/防御/仇恨），或花 2 点从角色**专属卡池**随机 3 选 1 抽一张新卡（抽卡不可取消）。养成进度是**城镇的持久资产**（localStorage）——跨远征持续，胜败都保留。
- **探索牌局**：进入地图后**不是直接战斗**，而是进入一场**探索牌局**。3 张〔遭遇〕路线牌固定在手，事件卡靠抽取；**打事件卡会累积「区域危险度」**，危险度同时抬高所有战斗的难度与奖励，并最终决定 BOSS 的强度与掉落。核心张力是「**牌是资源，而抽牌权只能靠打仗换**」——详见 `探索模式设计.md` 与下方「探索牌局」章节。
- **流程**：主菜单 →「开始游戏」→ **城镇**（常驻中枢，开放「远征」「编队」）→ **选择地图** → **探索牌局**（打事件卡 / 打遭遇卡进战斗 / 随时撤退）→ 击杀 BOSS 或撤退 → 结算回城镇。

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
├─ 抠图技巧.md             # 立绘抠图流程与调参经验（配套 scripts/chroma-cut.mjs）
├─ 探索模式设计.md         # ★ 探索卡牌模式设计文档（待实现：远征改造成一场探索牌局）
└─ src/
   ├─ main.tsx             # React 入口，渲染 <App/> 并引入全局样式
   ├─ App.tsx              # 顶层路由：按 runStore.screen 选界面，交给 ScreenTransition 编排过场
  ├─ styles.css           # 全局深色主题样式 + 场景过场 + 城镇/远征界面 + 战斗画面 16:9 / 最大 2560×1440 画布约束
   │
   ├─ engine/              # ★ 纯 TS 战斗引擎（无 React，无副作用，可序列化、可复现）
   │  ├─ types.ts          # 所有共享类型定义（不含逻辑）
   │  ├─ rules.ts          # ★ 可配置战斗/养成规则常量 + 经验曲线（调平衡改这里）
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
   ├─ explore/             # ★ 纯 TS 探索牌局引擎（与 engine/ 平行的第二个纯逻辑层）
   │  ├─ types.ts          # 探索层类型总集（探索卡 / 轨迹 / 队伍快照 / 危险度档位 / 会话状态）
   │  ├─ rules.ts          # ★ 可配置探索规则常量 + 5 档危险度表（调探索平衡改这里）
   │  ├─ session.ts        # ★ 会话逻辑：建局 / 出牌 / 场地能力 / 战斗回填 / 危险度换算
   │  └─ session.test.ts   # 探索牌局单元测试（Vitest）
   │
   ├─ data/                # ★ 内容数据（占位默认，替换正式内容改这里）
   │  ├─ cards.ts          # 卡牌定义（声明式效果）：剑士初始卡 + 专属抽卡池
   │  ├─ characters.ts     # 角色定义（HP / 仇恨 / 初始卡 / 专属抽卡池）
   │  ├─ enemies.ts        # 敌人定义（招式 + 意图脚本）
   │  ├─ encounters.ts     # 遭遇战定义（每场的敌人组合 + 可选的手工站位）
   │  ├─ explore.ts        # ★ 探索卡定义（路线牌 + 事件卡池）—— 与战斗卡是两套独立体系
   │  ├─ maps.ts           # ★ 地图定义（遭遇战池 / BOSS / 探索卡池 / 高危填充敌人）
   │  └─ index.ts          # 数据注册表：按 id 索引 + 卡牌/探索卡实例化 + 升级
   │
   ├─ store/               # Zustand 状态层（连接引擎与 UI）
   │  ├─ battleStore.ts    # 单场战斗状态（包裹引擎，克隆式不可变更新）
   │  ├─ exploreStore.ts   # ★ 探索牌局状态（包裹 explore/session，克隆式不可变更新）
   │  ├─ townStore.ts      # ★ 城镇档案：角色养成/编队/个人卡组/残片（persist → localStorage）
   │  └─ runStore.ts       # 一次「远征」流程编排（界面路由 + 牌局与战斗的往返）
   │
   └─ ui/                  # React 视图层（纯展示 + 派发，不含规则）
      ├─ transitions.ts    # ★ 场景过场预设表：全局开关 + 特效登记 + 按路线/按界面配置
      ├─ ScreenTransition.tsx # 过场编排：出场 → 黑场停顿 → 入场（串行）
      ├─ MenuScreen.tsx    # 主菜单：队伍预览 + 开始游戏（→ 城镇）
      ├─ TownScreen.tsx    # 城镇：设施入口（「远征」「编队」开放，其余占位）+ 重置存档
      ├─ FormationScreen.tsx # ★ 编队：队伍编辑 / 角色详情 / 属性加点 / 抽卡改造个人卡组
      ├─ ExpeditionScreen.tsx # 远征：地图选择列表
      ├─ ExploreScreen.tsx # ★ 探索牌局主界面：危险度仪表 + 队伍血量 + 轨迹 + 路线/手牌 + 场地能力
      ├─ ExploreCardView.tsx # 探索卡卡面（与战斗卡 CardView 刻意不复用）
      ├─ DangerMeter.tsx   # 区域危险度仪表（5 格档位条 + 悬停预演跨档警示）
      ├─ TrailStrip.tsx    # 轨迹：已打出的卡横向排开 + 右端 BOSS 标记
      ├─ TerminalNav.tsx   # 非战斗界面共用的顶部终端导航条
      ├─ BattleScreen.tsx  # ★ 战斗主界面：敌我单位/手牌/胜负遮罩 + 分镜编排 + 场景相机（世界坐标）
      ├─ animations.ts     # ★ 出牌动画预设表：CINEMA 分镜时间轴/相机参数/顿帧震屏/空闲漂移 + ANIM 每种特效的预设
      ├─ ambience.ts       # ★ 场景氛围预设表：地图 id → Canvas 粒子发射器 + 灯光闪烁 + 屏幕调色
      ├─ AmbienceLayer.tsx # 氛围层：双 Canvas（远/近景粒子，单 rAF 驱动）+ 屏幕空间调色层
      ├─ useIdleTwitch.ts  # 待机小动作：每隔几秒随机让一个存活敌人抖一下
      ├─ CombatantView.tsx # 敌人单位（无框立绘 + 下方血条/状态 + 倒计时/意图 + 受击特效挂载点）
      ├─ AllyBar.tsx       # ★ 我方队伍头像栏：舞台底部 15% 高的一条，中间 80% 固定 4 格玻璃头像
      ├─ HitFxLayer.tsx    # 命中表现共用件：首击特效 + 飘字 + 受击反应类名/变量（敌我共用）
      ├─ CharacterPortrait.tsx # 角色立绘（有图用图，无图回退 emoji）；半身像/头部两套取景登记
      ├─ EnemySprite.tsx   # 敌人待机立绘播放器（横向拼条 + steps() 无限循环）
      ├─ enemyArt.ts       # 敌人 id → 待机拼条立绘的查找表 + 预加载
      ├─ battleBg.ts       # 地图 id → 战斗背景素材（视频 / 静态图）的查找表 + 预加载
      ├─ stage.ts          # ★ 战斗设计画布：STAGE(1920×1080 基准) + useStageScale（画布→窗口的等比缩放）
      ├─ SpriteFx.tsx      # 序列帧播放器（逐帧 <img> 用 animation-delay 错开）
      ├─ vfxSprites.ts     # 序列帧图 URL 表 + 预加载
      ├─ SkillCutInCard.tsx# 出牌「亮相」卡面浮层（左侧飞入 → 停留 → 飞出）
      ├─ HandCard.tsx      # 手牌单卡（发牌飞入 / 出鞘离场）
      ├─ CardView.tsx      # 单张卡牌（奖励/结算界面用）
      ├─ CardDetailPopup.tsx # 悬浮手牌时跟随的详情浮窗
      ├─ ManaCrystalIcon.tsx # 「光」资源水晶图标
      ├─ cardArt.ts        # 卡面配图查找表
      ├─ StatusPips.tsx    # 状态图标一排（emoji + 层数）
      ├─ ExpRewardScreen.tsx # 战后小结：本场残片 + 各角色经验入账 / 升级提示
      └─ EndScreen.tsx     # 远征结算：通关/撤退/团灭三种收场 + 轨迹回顾 + 残片落袋
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
| `探索模式设计.md` | **★ 探索卡牌模式设计文档（设计定稿，待实现）**：把「进入地图后连打 N 场战斗」改造成一场**探索牌局** —— 3 张固定〔遭遇〕卡 + 靠抽取的事件卡，打事件卡累积**区域危险度**，危险度同时抬高所有战斗的难度与奖励并最终决定 BOSS 强度。含完整规则、卡型表、档位数值、数据结构、界面稿与分期实施清单。**动远征流程前先读这个**。 |

### `src/`（入口 & 路由）

| 文件 | 功能 |
| --- | --- |
| `main.tsx` | React 根渲染，`StrictMode` 包裹 `<App/>`，引入全局 `styles.css`。 |
| `App.tsx` | **顶层路由**：读取 `runStore.screen`，把「界面 → 组件」的映射抽成纯函数 `renderScreen`，交给 `<ScreenTransition>` 渲染。抽成函数是为了让过场期间能继续渲染**旧**界面。 |
| `styles.css` | 全局深色主题：CSS 变量、卡牌 / 单位 / 血条 / 意图 / 遮罩、城镇设施网格 / 地图卡片、**探索牌局**（危险度仪表 / 轨迹 / 探索卡面 / 场地能力）、**场景过场**、**场景动感**（空闲漂移 / 震屏 / 待机呼吸 / 落地阴影 / 氛围层定位 / 屏幕调色）等所有样式；战斗画面固定为 16:9、最大 2560×1440，超出画布的视口区域以黑色填充。⚠ `prefers-reduced-motion` 的战斗降级块**必须留在文件末尾**，理由见下方「场景动感」。 |

### `src/engine/`（纯 TS 战斗引擎）

引擎**完全独立于 React**，`BattleState` 无函数、可 `structuredClone`、可存档，且随机数种子在状态内 → **战斗可复现**。

| 文件 | 功能 |
| --- | --- |
| `types.ts` | 引擎与 UI 共享的**类型总集**：`Card` / `Combatant`（`Ally`/`Enemy`）/ `EffectDescriptor` / `StatusDef` / `BattleState` / `EngineOps` / **`EncounterModifier`** 等。只定义类型、不含逻辑、不 import 其他模块。 |
| `rules.ts` | **★ 集中的可配置规则常量**：资源经济、手牌上限、时刻推进量、护盾/虚弱/易伤系数、仇恨模式、升级倍率，以及**养成段 `progression`**（上阵上限 / 每级属性点 / 经验曲线 / 每点属性收益 / 抽卡消耗），另导出经验曲线函数 `expToNext`。调平衡主要改这里。 |
| `rng.ts` | mulberry32 可复现伪随机：`rngFloat/rngInt/rngPick` + Fisher–Yates `shuffle`；`rngState` 存在 `BattleState` 内。 |
| `ops.ts` | **引擎原语与结算落点**：伤害管线（力量→虚弱→易伤→护盾吸收→落定→荆棘反伤）、治疗、加护盾、施加状态、改仇恨、状态生命周期驱动（回合/时刻边界）、胜负判定。 |
| `statuses.ts` | **状态效果注册表**：中毒 / 灼烧 / 再生 / 力量 / 虚弱 / 易伤 / 荆棘 / 眩晕 / 洞察。其中眩晕与洞察是**纯显示定义**（无钩子），实际效果分别在 `ai.ts` 与 UI 层处理。其余状态带行为钩子（`onRoundStart` / `modifyOutgoingDamage` 等），通过 `ctx.ops` 调用原语——**不 import 引擎实现，避免循环依赖**。 |
| `effects.ts` | **效果解释器**：把声明式 `EffectDescriptor`（DAMAGE / GAIN_BLOCK / HEAL / APPLY_STATUS / DRAW / GAIN_RESOURCE / MODIFY_THREAT）翻译成 `ops` 原语调用，并解析每条效果的作用目标（primary / self / allFoes / randomFoe …）。**卡牌与敌人招式共用**这套。我方角色的**攻击/防御属性加成在此注入**：施放者是我方单位时，DAMAGE 效果 +attack、GAIN_BLOCK 效果 +defense（敌人招式不受影响）。 |
| `targeting.ts` | 目标查询（`aliveOf/foesOf/alliesOf`）与**仇恨算法** `chooseAggroTarget`（最高仇恨 / 加权随机两种模式）。无站位。 |
| `deck.ts` | 抽牌逻辑；抽牌堆抽空时把弃牌堆洗回；受手牌上限约束。 |
| `ai.ts` | 敌人 AI：`buildIntent` 按脚本指针刷新当前意图（含力量加成预览），`enemyAct` 执行意图（处理眩晕跳过、按仇恨选目标、复用效果系统）。 |
| `scheduler.ts` | **★ 时刻调度器**（本作核心特色）：`advanceTick(n)` 逐时刻推进，结算所有 `nextActTick <= tick` 的敌人并重排其下次行动，带死循环安全阀。调度逻辑集中于此，便于日后整体替换。 |
| `battle.ts` | **高层战斗编排**：`createBattle`（建局）/ `startRound`（回合开始补牌、发资源、刷意图）/ `playCard`（出牌扣资源、结算效果、按牌型推进时刻）/ `endRound`（冲刷未行动敌人、结算回合末状态、进入下一回合）。建局额外接受两样探索层传来的东西：`AllyInit.startHp`（**血量跨战斗继承**，缺省 = maxHp）与 `EncounterModifier`（追加敌人 / 全体开局状态 / `castTick` 调整 / 敌人 HP 倍率）。⚠ 开局状态必须在 `startRound` **之前**施加——`startRound` 会 `buildIntent`，意图预览要吃到力量加成。 |
| `index.ts` | 引擎**公开 API 出口**，UI / store 只从这里 import。 |
| `battle.test.ts` | Vitest 单测：初始化、时刻推进（速攻不推进 / 普通 +1）、中毒回合开始结算、回合末冲刷等核心机制。 |

### `src/explore/`（纯 TS 探索牌局引擎）

与 `engine/` **平行的第二个纯逻辑层**：同样无 React、无副作用、可 `structuredClone`、可单测。分工是「`engine/` 管一场战斗内部，`explore/` 管一趟远征的牌局」，两者不互相 import（只有 `explore/session.ts` 单向读 `engine` 的 rng 与 `EncounterModifier` 类型）。

| 文件 | 功能 |
| --- | --- |
| `types.ts` | 探索层**类型总集**：`ExploreCardDef`/`ExploreCard`（4 种 `kind`：encounter/boss/retreat/event）、`ExploreEffect`（6 种效果）、`TrailEntry`（轨迹条目）、`PartySnapshot`（跨战斗继承的队伍血量）、`DangerTier`、`PendingDiscard`、`ExploreState`。只定义类型、不含逻辑。 |
| `rules.ts` | **★ 集中的可配置探索规则**：手牌上限 / 起手与战后抽牌数 / 危险度每档点数与封顶 / 三个场地能力的代价与收益 / 残片基础产出 / BOSS 缩放系数 / 团灭惩罚，以及 **5 档危险度表 `DANGER_TIERS`**（每档的追加敌人数、开局状态、`castTick` 调整、奖励倍率）。调探索平衡只改这里。⚠ 高档位刻意不给敌人「开局护盾」——`clearBlockOnRoundStart` 会在第 1 回合把它清空，等于什么都没做；加硬度只能走状态。 |
| `session.ts` | **★ 会话逻辑**：`createSession`（发路线牌 + 洗牌库 + 起手）、`playEvent`（结算效果 → 改危险度 → 进轨迹）、`playRoute`（切进 `inBattle`，真正建局交给 `runStore`）、`retreat`、`finishBattle`（回填血量 / 结算残片 / 补抽 / 揭示 BOSS）、三个场地能力与弃牌选择、以及**危险度换算的唯一真相点** `dangerTier` / `rewardMultiplier` / `encounterModifier` / `previewDanger`。 |
| `session.test.ts` | Vitest 单测（21 条）：建局构成、危险度跨档与 `previewDanger` 一致性、打出的卡不洗回牌库、抽满即止、「抽牌权靠打仗换」、BOSS 揭示时机、血量继承、团灭清算、场地能力与死局不成立。 |

### `src/data/`（内容数据）

均为**占位数据**，替换正式内容/新增内容主要改这一层，无需动引擎。

| 文件 | 功能 |
| --- | --- |
| `cards.ts` | 全部卡牌定义（`CardDef[]`）：归属角色、消耗、普通/速攻、目标类型、声明式 `effects`、稀有度等。当前为剑士 3 张初始卡 + 6 张专属抽卡池占位卡。 |
| `characters.ts` | 角色定义（当前仅剑士，占位）：HP、初始仇恨、配色、初始卡列表 `startingCardIds`、**专属抽卡池 `poolCardIds`**（编队里花属性点 3 选 1 获得）。 |
| `enemies.ts` | 敌人定义（当前有「怪异的鸟」「废品机器人」「电线杆机器人」「收音机机器人」，占位；后三者技能一致）：`castTick`（行动间隔）、`moves`（招式，复用效果系统）、`script`（循环意图脚本）。 |
| `encounters.ts` | 遭遇战定义（每场的敌人组合）。**编排顺序不在此**——见 `maps.ts`。`enemies` 的每个槽位可写成裸 `"id"`（默认居中排布）或 `{ id, dx, dy, scale }`（**手工站位**，让敌人贴合背景地面；两种写法可混用）。`dx/dy` 挪整个单位，`scale` **只放大立绘与命中特效**（血条 / BUFF / 意图 / 倒计时全场统一尺寸不跟着变），缩放中心是立绘底边中点，故改 `scale` 脚不离地、无需回头补 `dy`。`slotDefId`/`slotPlacement` 是配套取值器：引擎只取前者，站位不进 `BattleState`。 |
| `explore.ts` | **★ 探索卡定义**（`ExploreCardDef[]`）：3 张**路线牌**（遭遇 / 深处之物 / 撤退）+ 事件卡池（采集、抽牌、回血、高危高收益、降危刹车、负面杂质）。与战斗卡 `cards.ts` 是**两套完全独立的体系**，刻意不复用。文件头写有卡池设计准则：每张卡必须同时动两个数（收益 + 危险度）、降危卡必须有代价、地图性格靠卡池表达、稀有度不做抽牌权重（靠在 `explorePool` 里重复登记加权）。 |
| `maps.ts` | **★ 地图定义**：`MapDef`（名称 / 描述 / 难度 1-5 / 占位 emoji + `encounterCount` 发几张遭遇卡 / `encounterPool` 遭遇战池 / `bossEncounterId` 最终战 / `explorePool` 探索卡池 / `fillerEnemyIds` 高危时追加的敌人）。**一张地图 = 一场探索牌局**；新增远征内容主要改这里。⚠ 打出的探索卡不洗回牌库 ⇒ **`explorePool` 的长度 = 这张地图最多能玩多久**，这是调远征长度最直接的旋钮。地图配图不在此登记（数据层不碰素材，与 `enemies.ts` 同约定）——**战斗背景按 id 登记在 `ui/battleBg.ts`**。 |
| `index.ts` | **数据注册表**：按 id 建索引 + `getXxx` getter（找不到抛错，含 `getMap` / `getExploreCardDef`）；`makeCard`（实例化，深拷贝效果；**uid 用 `crypto.randomUUID` 生成**——卡组会持久化，不能用刷新即归零的内存计数器）、`makeExploreCard`（探索卡实例化）与 `upgradeCard`（升级：数值按倍率提升、名称加 `+`）。 |

### `src/store/`（状态层，Zustand）

| 文件 | 功能 |
| --- | --- |
| `battleStore.ts` | 包裹纯 TS 引擎供 UI 订阅/派发。每次 `play/end` 都先 `structuredClone` 战斗状态再交给引擎修改，保证 React 持有对象不被就地改动（**克隆式不可变更新**）。`init` 额外透传 `EncounterModifier`。另有 **`seq` 建局计数**：`BattleScreen` 用它当「这是第几场战斗」的身份标识来重置分镜/手牌渲染状态——`battle` 对象每次 commit 都换新不能当身份用，`encounterId` 又可能在一趟远征里重复。 |
| `exploreStore.ts` | **★ 探索牌局状态**：包裹 `explore/session.ts`，与 `battleStore` 同模式（先 `structuredClone` 再交给纯函数，纯函数返回 `false` 表示操作无效则不替换）。**不持久化**——远征中途关页面即作废。分工：本 store 只管牌局本身，「打出遭遇卡 → 真的建一场战斗 → 切界面」由 `runStore` 编排。 |
| `townStore.ts` | **★ 城镇档案**：跨远征持久的角色养成资产。每个角色一份 `CharacterState`（等级 / 经验 / 未分配属性点 / 四维已加点 `attrs` / 个人卡组 `deck` / 抽卡候选 `pendingDraw`）+ 上阵名单 `party`（1~3 人）+ **残片余额 `loot`**。actions：`ensureProfile`（幂等建档）、`resetProfile`、`allocatePoint`（花 1 点加一维）、`startDraw`/`pickDraw`（花 2 点随机 3 选 1 抽卡，候选持久化 → 刷新逃不掉）、`toggleParty`、`grantExp`（发经验并处理连升，每级 +5 点）、**`bankLoot`**（远征结束落袋）。另导出 `deriveStats`（基础值 + 加点 × 每点收益的唯一换算点）。**已接 zustand persist（localStorage，key `town-profile-v1`）**。 |
| `runStore.ts` | 一次「远征」的**流程编排**：界面路由 + 牌局与战斗之间的往返。只有它同时认识 `battleStore`、`exploreStore` 与 `Screen`，故这三者的连接点全部集中在此。`startExpedition` 建牌局；`enterEncounter` 在打出路线牌后 `launchBattle`——合并上阵角色个人卡组（`structuredClone` 副本）、用 `deriveStats` 生成数值、**传入继承的 `startHp`**、把危险度经 `encounterModifier` 注入战斗；`resolveBattle` 把战斗终局血量回填给牌局、按危险度倍率发经验（**委托 `townStore.grantExp`**，带幂等护栏）；`confirmExpReport` 回牌桌或进最终结算；`retreat` 落袋回城。⚠ **只有存活角色参战**——本次远征内阵亡的角色不出战，其个人卡组也一并排除出战斗卡组。 |

### `src/ui/`（React 视图层）

视图只负责**展示与派发**，不含战斗规则。

| 文件 | 功能 |
| --- | --- |
| `transitions.ts` | **★ 场景过场预设表**：总开关 `TRANSITIONS_ENABLED`、特效登记表 `FX`（fadeOut/fadeIn/zoomIn/zoomOut/slideUp/none）、全局默认 `DEFAULT_TRANSITION`、按界面 `SCREEN_FX`、按路线 `ROUTE_FX`（键为 `` `${from}>${to}` ``），以及解析函数 `resolveTransition`。**调过场节奏与演出只改这里**。当前 `ROUTE_FX` 里给 `explore>battle` / `reward>explore` 配了更长的黑场——牌桌是俯瞰整片区域的抽象层、战斗是钻进其中一个点，两者尺度差得远，需要「下潜/上浮」感而不是页面跳转。 |
| `ScreenTransition.tsx` | **过场编排**：界面切换时把「瞬移」拆成 出场 → 黑场停顿 → 入场，**串行**执行（旧界面先卸载、新界面再挂载，避免 BattleScreen 双挂载/视频双解码）。用 `render` 回调而非 children，才能在出场期间继续渲染旧界面。定时器带批次序号守卫，快速连点会作废旧批次。 |
| `MenuScreen.tsx` | 主菜单：队伍预览 + 玩法要点 + 「开始游戏」（→ 城镇）。仅在启动游戏时出现一次。 |
| `TownScreen.tsx` | **城镇**：远征之间的常驻中枢。设施网格中「远征」「编队」可点，其余（补给站 / 锻造台 / 酒馆 / 档案库）为 disabled 占位，逐个实现后从 `LOCKED_FACILITIES` 挪走。另有「重置存档」按钮与上阵人数/合计行动卡显示。 |
| `FormationScreen.tsx` | **★ 编队**：左栏角色列表（等级/属性点/上阵切换，至少 1 人、至多 3 人），右栏选中角色详情——四维属性加点（基础值 + 每点收益，即点即生效）、装备占位空槽（武器/护甲/饰品，未开放）、个人卡组网格、「抽取行动卡」（花 2 属性点）。抽卡后弹**无法关闭的 3 选 1 弹层**（候选在 `pendingDraw` 持久化，刷新也必须选完）。 |
| `ExpeditionScreen.tsx` | **远征选图**：把 `MAPS` 渲染成卡片（emoji / 名称 / 难度星级 / 描述 / 场次与探索卡池大小），点击即 `startExpedition(map.id)` **进入探索牌局**（不再直接开打）。 |
| `ExploreScreen.tsx` | **★ 探索牌局主界面**：自上而下为〔地图名 + 危险度仪表 + 残片/牌库〕→〔队伍血量条〕→〔轨迹〕→〔牌桌：左侧路线牌、右侧手牌〕→〔三个场地能力按钮〕。悬停手牌时把 `previewDanger` 下发给仪表与卡面做**跨档预演**。弃牌选择模式下手牌的点击语义从「打出」切换为「勾选」。 |
| `ExploreCardView.tsx` | 探索卡卡面。**与战斗卡的 `CardView` 刻意不复用**——两者信息结构完全不同（战斗卡讲「消耗/目标/效果」，探索卡讲「危险度/收益/这一步通往哪」）。遭遇/BOSS 卡开局即绑定具体 `encounterId`，故卡面能提前亮出敌人数，玩家因此可以**自选先打哪一场**。 |
| `DangerMeter.tsx` | 区域危险度仪表：5 格档位条 + 档名 + 当前数值 + 「再 +N 跳档」。传入 `preview` 时用 ghost 格与档名箭头**预演打出后的落点**——决策发生在「跨档的那一手」，所以这个提示必须比当前态更抢眼。 |
| `TrailStrip.tsx` | 轨迹：已打出的卡横向排开（emoji / 名称 / 危险度增量 / 当时的危险度），右端常驻 BOSS 标记（未揭示是背面，揭示后显示按当前危险度算出的 HP/掉落倍率预览，随玩家继续刷事件卡实时变化）。新卡落位后自动滚到最右。**远征结算页复用同一组件**做轨迹回顾。 |
| `TerminalNav.tsx` | 非战斗界面共用的顶部终端导航条（原为 `MenuScreen` 内的局部组件，多屏共用后提取）。除 `active` 外的条目仍是占位。 |
| `BattleScreen.tsx` | 战斗主界面：顶部信息条（回合/时刻/光/牌堆数）、敌我单位、目标选择交互、手牌区、结束回合按钮、胜负遮罩。敌人预计攻击的最高仇恨友军会被高亮，但该提示同样属于「意图信息」——**仅当场上有敌人被「洞察」时才显示**。另含**分镜编排**（`runSteps` 定时器队列）与**场景相机**（`computeCamera`，见下方「分镜相机」）。背景层按当前 `runStore.mapId` 查 `battleBg.ts` 取素材，视频渲染 `<video>`、静态图渲染 `<img>`——两者都只是场景里的一张地皮，自身不带 transform。命中时刻同时触发**顿帧 + 震屏**（见下方「场景动感」）。 |
| `animations.ts` | **★ 动画预设表**：`CINEMA`（分镜时间轴 + 相机放大上限 `scale` / 取景留白 `fit` + **打击感 `hitstop`/`shake`** + **空闲漂移 `drift`**）、`ANIM`（每种 `CardAnim` 的特效图形/主色/时序 + **震屏档位 `shake: 0/1/2`**）、`cardAnim`/`moveAnim`（卡牌与敌人招式 → 动画类型）。调演出节奏主要改这里。 |
| `ambience.ts` | **★ 场景氛围预设表**：按 `MapDef.id` 登记 `emitters`（粒子发射器：`kind` rain/dust/mist、`layer` far/near、数量/颜色/尺寸/速度/透明度/倾角/失焦/摆幅）、`flicker`（世界内的灯光闪烁）、`grade`（屏幕空间暗角/色偏/扫描线）。与 `battleBg.ts`/`enemyArt.ts` 同约定——数据层不碰表现。**调氛围只改这一个文件**。 |
| `AmbienceLayer.tsx` | 氛围层实现：`<AmbienceLayer>` 渲染 far/near 两张 `<canvas>`（CSS 尺寸恒为设计画布，位图分辨率按 dpr 上浮但封顶 1.5）+ 可选的 `.battle-flicker`，由**同一个** rAF 循环驱动；粒子池长度恒定、出界即就地复用。近景失焦走整层 CSS `filter: blur`（层级属性，不逐粒子设 `ctx.filter`）。系统「减少动态效果」下**根本不挂载**；`document.hidden` 停循环；`paused`（顿帧）跳过位置更新但照常重绘。另导出 `<AmbienceGrade>`——屏幕空间调色层，**必须渲染在场景之外**（是「镜头」不是「场景」）。 |
| `useIdleTwitch.ts` | 待机小动作：每隔 3~6s 随机挑一个存活敌人返回其 id（持续 400ms）。纯循环的呼吸看久了会露出「这是段循环动画」的破绽，一个低频随机事件即可盖掉。刻意是 UI 局部状态、不进 `BattleState`。 |
| `CombatantView.tsx` | **敌人**单位（下发 `--idle-*` 待机呼吸参数与 `--shadow-w` 落地阴影宽度；我方走 `AllyBar.tsx`）：**无背景面板**，立绘直接浮在场景上，自上而下为〔施法倒计时；仅在敌人带「洞察」时额外显示意图徽章，见 `isIntentRevealed`〕→ 立绘（完整不裁切）→ 血条（名字嵌在左侧、HP 数值靠右）→ 护盾/BUFF-DEBUFF 一排。带 `data-cmb-id`（相机据此定位聚焦目标），并挂载 `HitFxLayer`。可选的 `placement` 会下发成 `--place-dx/dy/scale`，由 `styles.css` 的 `.combatant` 落到**独立的 `translate`/`scale` 属性**上——不能走 `transform`，那条已被 `:hover`/`.attacking` 前冲/`hitShake` 抖动占用。 |
| `AllyBar.tsx` | **★ 我方队伍头像栏**：场景底部一条固定构图——高度 = 设计画布全高的 15%（162px），横向 10%/80%/10% 三段，左右两段是纯透明占位，中间 80% 由 `ALLY_SLOTS`(4) **固定均分**（与上阵上限 `progression.maxParty` 刻意解耦：人数变化不改格宽，空出的格子渲染成 `.empty` 空槽）。单格自上而下为：悬空外挂的徽章排（护盾/仇恨/BUFF-DEBUFF，绝对定位不占流）→ **黑色玻璃蒙板**（玻璃下透出立绘裁出的头部片段作头像）→ 与玻璃**一体化**的血条（贴底边，自身不带角，轮廓由玻璃的 `overflow`+`clip-path` 裁出）。槽位根节点**刻意仍带 `.combatant.player` 类名**——前冲/受击抖动/受益光晕/阵亡/特效层定位那套规则全部 scoped 在 `.combatant` 上，复用即可与敌人共享同一套演出。它仍在 `.battle-scene` 内 ⇒ **跟随分镜相机**，每格带 `data-cmb-id` 供 `computeCamera` 定位。 |
| `HitFxLayer.tsx` | 命中表现的**共用件**，敌人（`CombatantView`）与我方（`AllyBar`）共用以保证两边的特效着色/命中时序/飘字一致：`<HitFxLayer>` 渲染首击特效（序列帧/emoji，`key={hit.seq}` 重挂载重播）+ 伤害/治疗飘字；`hitFxVars(hit)` 导出挂在单位根节点上的受击反应类名（`hit-react`/`bless-react`）与 CSS 变量（`--vfx-color`/`--vfx-impact`）。两者都相对**最近的定位祖先**定位，故必须挂在 `.combatant` 内部。 |
| `CharacterPortrait.tsx` | 角色立绘：有配图用图，无图回退 emoji。`CHARACTER_ART` 登记表（**立绘只登记在 UI 层**，`data/characters.ts` 不碰素材路径）按 `CharacterDef.id` 索引，一份 def 同时承载**两套独立取景**的微调参数：`dx/dy` → 战斗半身像（`--portrait-dx/dy`），`head: { zoom, dx, dy }` → 头像栏的头部取景（`--head-zoom/dx/dy`）。两套的取景窗尺寸与裁法都不同、偏移量不通用，故刻意不复用。走哪套由 `className` 决定：无 → 半身像、`avatar-portrait` → 头部、`menu-portrait` → 全身。 |
| `EnemySprite.tsx` | 敌人待机立绘播放器：单张横向拼条图靠 `background-position` + `steps()` 无限循环。与 `SpriteFx` 并列的另一套机制——那套是逐帧独立图、播一次即停的命中特效。 |
| `enemyArt.ts` | 敌人 `EnemyDef.id` → 待机拼条立绘（`EnemySpriteDef`：帧数/每帧时长/渲染尺寸）的查找表 + `warmEnemyArt()` 预加载。未登记的敌人由 `CombatantView` 回退 emoji。**静态单帧立绘**按 `frames: 1` 登记即可（拼条机制在单帧下自然退化成不动的背景图，无需特判）。另有可选的 **`idle` 段**（`bob`/`sway`/`tilt`/`dur`/`delay`）——挂在 `.combatant-figure` 上的待机呼吸，专治 `frames: 1` 的立绘完全不动；`enemyIdle()` 负责与 `DEFAULT_IDLE` 合并。逐个错开 `delay`，避免全场同频「齐步走」。 |
| `battleBg.ts` | **地图 `MapDef.id` → 战斗背景素材**（`BattleBgDef`：`kind` 为 `video`/`image` + `src`）的查找表 + `warmBattleBg()` 预加载（只预热静态图，视频由 `<video preload>` 自理）。未登记的地图回退森林视频。**新增地图专属背景改这里**（数据层不碰素材，与 `enemyArt.ts` 同约定）。 |
| `stage.ts` | **★ 战斗设计画布**：`STAGE`（1920×1080 基准分辨率 + `maxScale` 上限）与 `useStageScale`（`ResizeObserver` 观测 letterbox 容器，算出等比缩放系数 k）。战斗画面恒为 1920×1080，整体 `transform: scale(k)` 适配窗口 —— 详见下方「设计画布」。 |
| `SpriteFx.tsx` | 序列帧播放器：把 `SpritePreset` 的所有帧堆叠为 `<img>`，用 `animation-delay` 逐帧错开播放。 |
| `vfxSprites.ts` | 序列帧图 URL 列表（如魔剑坠落 12 帧）+ `warmVfxSprites()` 预加载。 |
| `SkillCutInCard.tsx` | 出牌「亮相」卡面浮层：镜头聚焦后从左侧飞入 → 停留 → 往右飞出渐隐。挂在场景之外，不受相机影响。 |
| `HandCard.tsx` | 手牌单卡：发牌飞入、悬浮弹出、出鞘离场。 |
| `CardView.tsx` | 单张卡牌（编队/抽卡界面用）：消耗、普通/速攻标签、归属角色配色、名称与描述、可出/选中/已强化状态样式。 |
| `CardDetailPopup.tsx` | 悬浮手牌时跟随鼠标的卡牌详情浮窗。整体尺寸由 `styles.css` 里 `.card-popup` 的 `--popup-k`（当前 `1.5`）一个旋钮缩放——**必须放大真实布局尺寸而非 `transform: scale()`**，因为组件用 `offsetWidth/Height`（布局 px，不含 transform）算翻转/收拢边界，用 scale 会让它按未缩放尺寸判边界从而溢出画布。浮窗与 `.card-drawer` 共用 `.drawer-*` 类，故放大规则全部限定在 `.card-popup` 作用域内。 |
| `ManaCrystalIcon.tsx` | 「光」资源的水晶图标（SVG）。 |
| `cardArt.ts` | 卡牌 id → 卡面配图的查找表。 |
| `StatusPips.tsx` | 一排状态图标（emoji + 层数），悬停显示状态说明。 |
| `ExpRewardScreen.tsx` | **战后小结**：本场缴获的残片 + 每个上阵角色一行的经验入账、经验进度条、升级高亮徽章（LV x→y · 属性点 +N）。确认后回到探索牌桌；BOSS 战则进最终结算。标题栏显示本场吃到的危险度档位与倍率。 |
| `EndScreen.tsx` | 远征结算：**通关 / 撤退 / 团灭三种收场共用一页**（按 `runStore.lastResult` 切文案）。主角是**轨迹回顾**（复用 `TrailStrip`）——一趟远征结束时那一排卡就是完整的故事。另显示残片入账/遗失、城镇余额、最终危险度与步数，以及上阵角色的等级与个人卡组。 |

#### 设计画布（`stage.ts` + `styles.css`）

战斗画面是一块**固定 1920×1080 的设计画布**（`.screen.battle`），整体用 `transform: scale(k)` 等比缩放去适配窗口；`k = min(容器宽/1920, 容器高/1080)`，由 `useStageScale` 的 `ResizeObserver` 算出，经 `--stage-scale` 下发。16:9 与「最大 2560×1440、更大的显示器四周留黑边」仍然成立——前者由固定长宽保证，后者是 `STAGE.maxScale` 的上限。

**为什么**：改造前画布宽度是 `min(100vw, 2560px, …)`，尺寸随窗口在 ~1280×720 到 2560×1440 之间浮动，而画布内部全是固定 px。背景 `object-fit: cover` 等比缩放、立绘却不缩放 → `encounters.ts` 里调好的敌人站位只在「调它时的那个窗口尺寸」踩得住地面线，换分辨率就脱节。

**因此**：画布内的每个 px 都是**设计 px**，与玩家实际分辨率无关——站位 `dx/dy`、立绘尺寸、侧栏宽、字号在任何窗口下构图完全一致，站位一次调好即永久成立。

- ⚠ **画布内不要再写 `vw`/`vh`，也不要按窗口宽度加 `@media` 断点**——那会让构图重新随分辨率漂移，还会连带改变相机的取景安全区。历史上有三条这样的残留，现已全部删除：`@media (max-width:1100px)`（把战斗侧栏从 280px 压到 192px）、`(max-width:720px)` 与 `(max-width:900px)`（把 `.screen.battle` 重排成单列上下堆叠——窗口一窄整个战场构图就崩）。`styles.css` 里那两段断点现在只作用于非战斗界面。
- 布局盒仍是 1920×1080（`transform` 不改变布局），由 `.battle-viewport` 的 `place-items: center` 居中，`scale` 绕中心原点缩放，溢出部分由 viewport 的 `overflow: hidden` 裁掉 → 视觉正好居中。
- ⚠ **画布带 `transform` ⇒ 它成了内部 `position: fixed` 的包含块**：`.overlay`、`.end-turn-float` 等因此改为贴合画布而非窗口（顺带修掉了它们过去会浮到黑边上的毛病），并随画布一起缩放。
- 左侧手牌栏的两个构图旋钮写在 `.screen.battle` 上（`styles.css`）：`--hand-col-w`（栏宽，当前 `380px`）与 `--hand-shift-y`（整体下移量，当前 `324px` = 画布高 1080 的 30%）。下移用 `transform` 实现（布局盒不动，不影响卡牌右弹/飞入的水平位移），同时把 `.side` 高度收窄同样的量，保证手牌仍竖排在可视区内。
- ⚠ **`getBoundingClientRect()` 量到的是屏幕 px，画布内元素拿它定位前必须用 `toDesignBox()` 换算回设计 px**，否则会连同 `--stage-scale` 被再缩放一次。`CardDetailPopup` 即是一例：锚点在 `BattleScreen` 侧换算，边界从 `window.innerWidth/Height` 改为 `STAGE.width/height`。（元素自身的 `offsetWidth/Height` 是布局 px，本就不含 transform，可直接用。）

#### 分镜相机（`BattleScreen.tsx` + `animations.ts`）

每一步（玩家出牌 / 敌人行动）走同一套时序：施法者弹出 → 顿（全景）→ 镜头推近聚焦目标 →〔仅玩家出牌：卡面亮相〕→ 命中特效 + 飘字停留 → 镜头恢复归位 → 下一步。

相机是**一个世界 + 一个相机**的引擎模型，不是「把某个 div 放大」：

- **世界 = 1920×1080 的设计画布**。背景（`.battle-bg-video`）、氛围粒子与敌我单位（`.battle-stage`）同在 `.battle-scene` 内，由**唯一一份** `transform: translate(tx,ty) scale(s)` 驱动。⇒ **场景是刚体**：角色与它脚下的那块地面在任何缩放/平移/窗口尺寸下都不可能分离。这是本节唯一重要的一条——两层各自变换（哪怕只差一点视差）必然导致「角色从地面上滑走」。
- 相机与场景内容之间还夹着一层 **`.battle-world`**（`position: absolute; inset: 0`，与场景层几何完全重合）。它同样包住背景 + 氛围 + 舞台，故刚体性不变；存在的唯一理由是「场景层的 `transform` 已被相机占用」而**空闲漂移与震屏还需要落点**。三个变换属性各司其职、由浏览器按固定顺序合成互不覆盖：`transform`=漂移、`translate`=震屏位移、`scale`=冲击缩放。因为它与场景层几何重合且是 `.battle-stage` 的 `offsetParent`，`computeCamera` 读的取景安全区一个数都没变。
- **相机全程在世界坐标里算**（`computeCamera` 返回 `{s, tx, ty}`，单位是设计 px）。场景层与其父级之间没有别的变换，故「局部 px」恒等于「世界 px」——**不需要任何屏幕 px 换算，也没有 `/k`**。任何窗口尺寸下推镜结果逐 px 一致。
- **屏幕 → 世界的反投影**：目标包围盒仍靠 `getBoundingClientRect()`（这样才吃得到站位的 `--place-dx/dy/scale`），再经 `screenToWorld()` 换算。除数取**世界层**（`.battle-world`）当前的屏幕矩形，于是 `--stage-scale`、**当前相机变换**与**世界自身的空闲漂移**被一次性抵消，测得的永远是纯设计 px，与 `stage.offsetLeft/Top`（布局 px）同一坐标系 ⇒ **过渡进行到一半时测量同样成立**（旧实现要求「必须在全景态测量」的前提就此消失）。
- **取景安全区**用 `.battle-stage` 的**布局盒**（`offsetLeft/Top/Width/Height`，`offsetParent` 即 `.battle-scene`）：布局 px 天然就是世界 px、完全不含 transform，也免去在 TS 里重复 CSS 那三个常量。目标居中到这块区域 ⇒ 不会跑到左侧透明手牌栏底下。
- **不做边界钳制**：目标永远精确居中。相机推出世界之外时露出的区域由 `.battle-bg-spill` 填充——同一张背景的模糊放大副本（静态图直接复用同一 URL；视频从**已在播放的那个** `<video>` 抓一帧画进 64×36 的 canvas，反正会被 `blur(36px)` 糊掉，**不挂第二个 `<video>`**，避免双解码）。它在场景之外 ⇒ 不跟相机动。
  - 想改回「不露边、边缘目标略偏心」的引擎式钳制：在 `computeCamera` 的 `return` 前把 `tx` 夹到 `[STAGE.width*(1-s), 0]`、`ty` 夹到 `[STAGE.height*(1-s), 0]` 即可，两行。
- **裁切**统一在 `.screen.battle`（整个画布），场景内不再有第二个裁切边界。
- 放大上限 `CINEMA.scale`（1.55）与取景留白 `CINEMA.fit`（0.78，目标并集最多占安全区的比例）是仅有的两个构图旋钮。注意背景素材若小于 1920 宽（如 `霓虹城市.png` 是 1366×768），推近时会被进一步放大 —— 嫌糊就调小 `scale`。
- **层级**：`.battle-bg-spill`(0) → `.battle-scene`(0，DOM 在后) → `.screen.battle::before` 终端机框(1) / `.battle-grade` 屏幕调色(1) → `.side` 手牌栏(2) → 结束回合(18) / 胜负遮罩(20) / 亮相卡面(40)。机框、调色层与手牌栏属 HUD/镜头，**刻意不跟相机动**。
  世界**内部**的层序另算（`.battle-world` 自成层叠上下文）：背景(0) → 远景粒子(1) → 灯光闪烁(2) → 舞台(3) → 近景粒子(4)。

#### 场景动感（`ambience.ts` + `AmbienceLayer.tsx` + `animations.ts` + `styles.css`）

改造前画面是「静态背景图 + 静态立绘 + 静止相机」的三重叠加，观感很死。现在由四个互相独立、可各自关掉的模块撑起动感，基调是**细腻克制**（呼吸 2~4px、漂移 ≤2%、震屏 ≤6px）：

| 模块 | 落点 | 旋钮 |
| --- | --- | --- |
| **待机呼吸** | `.combatant-figure` 的 `transform`（`@keyframes idleBob`）+ `.combatant-stage::after` 椭圆落地阴影（反相脉冲，把角色钉在地上） | `enemyArt.ts` 每个敌人的 `idle` 段 |
| **偶发小动作** | `.combatant.twitch .combatant-stage` 的一次性抖动 | `useIdleTwitch.ts` 的 `MIN_GAP`/`MAX_GAP`/`TWITCH_MS` |
| **场景氛围** | 世界内的双 Canvas 粒子 + 灯光闪烁；世界外的暗角/色偏/扫描线 | `ambience.ts` 按地图登记 |
| **空闲镜头漂移** | `.battle-world` 的 `transform`（`@keyframes worldDrift`，22s 一圈的 Ken Burns） | `CINEMA.drift` |
| **打击感** | 命中瞬间顿帧（`.screen.battle.hitstop` 冻住世界的循环动画 + 粒子停更新）→ 解冻同刻震屏（`.battle-world` 的 `translate`/`scale`） | `CINEMA.hitstop` / `CINEMA.shake` + `ANIM[x].shake` 档位 |

几条**踩过的坑**，改这块前务必看：

- **待机呼吸只能挂 `.combatant-figure`**。`.enemy-sprite` 的 `animation-name` 由 `EnemySprite.tsx` 行内下发（拼条逐帧循环），挂那儿会被整条覆盖；`.combatant` / `.combatant-stage` 的 `transform` 与 `scale` 又分别被 hover/前冲/hitShake 与 `--place-scale` 占着。这个元素是仅剩的三个变换属性全空的落点。
- **`animation` 是简写，会互相抹掉**。`.combatant.targetable .combatant-figure` 必须把 `idleBob` 和 `pulseGlow` 两条一起写；`.battle-world.shake-a/b` 必须把 `worldDrift` 重复写一遍。
- **震屏靠交替类名重启，不靠 `key`**。`shake-a`/`shake-b` 是两个同内容不同名的 `@keyframes`，按 `seq` 奇偶切换——名字变了才重播，而列表第 0 位的 `worldDrift` 名字没变故继续播不重启。给 `.battle-world` 加 `key` 重挂载会连带重挂 `<video>` 背景触发二次解码。
- **相机推近期间暂停漂移**（`.battle-scene[data-focused] .battle-world`）：聚焦那 1 秒目标必须钉死在中心，不能被漂移缓慢带偏。`animation-play-state` 保留进度，回全景续播无跳变。
- **顿帧不能用 `*` 通配**去暂停动画——受击闪白 / 冲击环 / 飘字正是那一刻要播的东西。只冻 `.battle-world` / `.enemy-sprite` / `.combatant-figure` 三条持续循环。
- **调色层必须在场景之外**。它是「镜头」不是「场景」，跟着相机放大的话暗角会被推出画面而失效。
- **调色层里不要用 `mix-blend-mode`**（踩过）。`.battle-grade` 自带 `position + z-index`，本身就是层叠上下文，混合只能作用于「同一上下文内、它下面的东西」——而它下面只有父元素那层中心完全透明的暗角渐变。对透明背景做混合等于直接输出源色，色偏于是变成一整块深色幕布糊住画面（霓虹城市曾因此全屏发黑）。用低透明度的普通色罩即可。对照 `.battle-flicker` 的 `screen`：那个在 `.battle-world` 内、下方压着不透明背景，有真实 backdrop 可用，所以是安全的。
- **`prefers-reduced-motion` 的降级块必须放在 `styles.css` 末尾**：媒体查询**不增加特异性**，写在前面会被后面同特异性的规则按源码顺序直接盖掉（文件开头那个 `@media` 块只管过场，因为它要压的规则都在它前面）。粒子层不在降级块里——`AmbienceLayer` 在同一条件下**根本不挂载**，连 rAF 都不起。
- 想整块关掉：`CINEMA.hitstop = 0`（顿帧）、`ANIM[x].shake = 0`（震屏）、`CINEMA.drift.dur` 调大 / 幅度归零（漂移）、`ambience.ts` 里把 `emitters` 清空（粒子）。

#### 场景过场（`ScreenTransition.tsx` + `transitions.ts`）

界面切换不再瞬移，统一走：**旧界面出场 → 黑场停顿 → 新界面入场**。默认动效是淡出 240ms → 停 60ms → 淡入 240ms。

- **串行而非交叉淡化**：旧界面先卸载、新界面再挂载。两个界面同时挂载会导致 BattleScreen 双挂载、背景视频双解码、素材双预热、定时器串批。
- **配置优先级**：`ROUTE_FX['from>to']` > `SCREEN_FX[界面]` > `DEFAULT_TRANSITION`。出场归**来源**界面、入场归**目标**界面，二者各自独立可配 —— 这就是「拆分出场/入场特效」的落点。
- **关闭方式**：`TRANSITIONS_ENABLED = false` 即退回瞬移；另外自动尊重系统的「减少动态效果」（`resolveTransition` 短路返回零时长，CSS 侧 `@media (prefers-reduced-motion)` 兜底）。
- **默认动效刻意只用 `opacity`**：过场包裹层是 `.screen.battle` 的祖先，而 `transform` 会污染 `computeCamera` 的 `getBoundingClientRect()` 测量（见上）。`opacity` 不影响布局矩形，天然安全。带 transform 的备选特效（zoom/slide）用在 battle 入场上时需留意这条。
- **「黑场」不需要幕布层**：旧界面淡到 `opacity: 0` 后露出的就是页面本身的深色底。`.screen-curtain` 是留给自定义演出（闪白、拉幕）的可选层，默认不启用。
- 时长常量的唯一真相在 `transitions.ts`，通过内联 `animationDuration` 下发给 CSS —— 与 `CINEMA` 同一套惯例。

---

## 六、设计方案

### 1. 分层架构（关注点分离）

```
data （内容：卡/角色/敌人/遭遇战/探索卡/地图）
  │  声明式描述符
  ▼
engine （纯 TS 战斗规则）      explore （纯 TS 探索牌局规则）
  │  engine/index.ts            │  explore/session.ts
  │                             │  ↘ 危险度 → EncounterModifier ↘
  ▼                             ▼                                ▼
store （Zustand：克隆式不可变更新；runStore 编排两者的往返）
  │  订阅 / 派发
  ▼
ui （React：纯展示 + 交互，不含规则）
```

`engine/` 与 `explore/` 是**两个互不 import 的纯逻辑层**（只有 `explore/session.ts` 单向读 `engine` 的 rng 与 `EncounterModifier` 类型）。战斗引擎不认识「危险度」这个概念，只认识 `EncounterModifier` 这四条改造——日后任何「动态难度」来源都能复用同一个接口。

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

- `rules.ts` 汇总所有平衡旋钮（资源经济、手牌、时刻推进、护盾/虚弱/易伤系数、仇恨模式、升级倍率、**养成段 `progression`**）。引擎读取这些常量，**调平衡/改机制主要改这一个文件**。

### 6. 角色养成：属性点 + 个人卡组

- **升级只发点、不涨面板**：`grantExp` 连升循环里每级 +`levelUpPoints`（5）属性点，基础属性（characters.ts）永远不变；最终数值 = 基础值 + 已加点 × 每点收益，换算集中在 `townStore.deriveStats` 一处，编队 UI 与开战组队共用。
- **攻防加成在效果解释器注入**（而非开战时烘焙进卡牌数值）：出牌时 `resolveEffects` 的 `sourceId` 就是持有者 Ally，`applyEffect` 对我方来源的 DAMAGE/GAIN_BLOCK 分别加 `attack`/`defense`。好处：战斗内卡实例与城镇个人卡组数值一致、与卡牌强化（×1.4）互不纠缠、敌人共用解释器不受影响。
- **卡牌唯一来源是抽卡**：战斗胜利只给经验；花 `drawCost`（2）属性点从 `poolCardIds` 随机 `drawChoices`（3）张候选（允许重复）3 选 1。候选存在 `pendingDraw` 并随档案持久化——**属性点已消耗，刷新页面也必须选完**，杜绝「抽到不满意就刷新」。
- **战斗卡组 = 上阵角色个人卡组的集合**：`launchBattle` 把 `party` 中每人的 `deck` `structuredClone` 后 flat 合并，个人卡组归属清晰（`ownerCharId` 决定配色/禁用/加成），战斗改动不污染城镇资产。

### 7. 探索牌局：整个游戏只有一种交互语言

远征层刻意**不做地图/节点图**——那会引入第二套交互语言，学习成本与美术成本都要翻倍。做成牌局则可以复用 `HandCard` / 卡面 / 出牌动画那一整套，玩家零学习成本。完整设计见 **`探索模式设计.md`**。

**核心循环（发动机）：牌是资源，而抽牌权只能靠打仗换。**

```
手上有事件卡 ──打出──▶ 收益入袋 + 区域危险度↑
     ▲                          │
     │                     手牌打空
     │                          ▼
  抽 2 张 ◀──胜利──  打出「遭遇」卡，进入战斗
                     （难度与奖励按当前危险度）
```

节奏因此自动变成一个阶梯：刷一轮事件抬高危险度 → 打一仗续牌 → 再刷一轮。压力是**结构自带的**，不需要口粮、火把、回合限制等任何外挂计时器。玩家每一手真正在想的只有一句：**「这张事件卡，值不值得我为它把危险度再抬一档？」**

几条关键设计决定，改这块前务必看：

- **危险度是 BOSS 的燃料**：BOSS 的强度与掉落就是玩家这趟攒出来的危险度。于是危险度单调上升不再是缺陷——那条曲线正好就是高潮曲线；「苟着速通」也不需要专门惩罚（危险度低 → BOSS 瘦 → 打完没变强 → 下张图吃不消，玩家自己会算明白）。
- **血量跨战斗继承是地基**，不是可选项。没有它，「休整」没意义、「还打不打得动下一场」的判断不存在、撤退也不会有人考虑——整套设计会退化成一个好看的过场。落点是 `AllyInit.startHp` + `resolveBattle` 的回填。
- **经验即时入账，残片要活着回城才落袋**。这个不对称是「撤退」成为真选择的唯一原因：打赢的经验谁也拿不走，但你兜里的残片随时可能因为贪最后一张牌而全丢。
- **打出的卡不洗回牌库** ⇒ 牌库有限 ⇒ **`explorePool` 的长度 = 这张地图最多能玩多久**。这是调远征长度最直接的旋钮。
- **撤退也是一张卡**，和遭遇卡一样固定在手。于是「要不要撤」和「要不要刷事件」用的是同一种交互语言，不需要任何「确定要撤退吗？」弹窗——手牌里同时躺着〔BOSS〕和〔撤退〕，那种拉扯是自然产生的。
- **场地能力永远可用**（代价不足时置灰），三个按钮各自把一种东西换成另一种：危险度→牌（搜寻）、牌→血（休整）、牌→危险度下降（隐匿）。⇒「牌库空 + 手牌空」的死局不成立。
- **休整/隐匿的弃牌由玩家点选**，不做随机弃牌——「弃哪两张」本身就是决策，随机弃牌等于没有决策。
- **轨迹就是地图**：打出的卡不消失，横向排开构成这趟远征的可视历史。地图不用画，它自己长出来；远征结算页直接复用同一组件做回顾。

### 8. 可扩展点（后续方向）

- **内容替换**：`data/` 全部为占位默认，替换成正式卡牌/角色/敌人/遭遇战/地图即可。
- **城镇设施**：`TownScreen` 的 `LOCKED_FACILITIES` 是一排 disabled 占位；实现某个设施 = 加一个 `Screen` 成员 + `App.tsx` 加 case + 新建界面组件，并把它从占位表里挪走。持久资产统一放 `townStore`。
- **新探索卡**：`data/explore.ts` 加一条定义 + 把 id 登记进某张地图的 `explorePool`。若需要新的效果类型，则 `explore/types.ts` 的 `ExploreEffect` 加一个成员 + `session.ts` 的 `applyEffect` 加一个分支（与战斗层的 `EffectType` 同套路）。
- **地图性格**：卡池是唯一的性格来源。森林多采集与回血、城市多商人与情报、深渊多高危高收益 + 更多杂质——靠 `explorePool` 的构成表达，不需要任何新机制。
- **动态难度**：任何「改造一场遭遇战」的需求都走 `EncounterModifier`（追加敌人 / 全体开局状态 / `castTick` 调整 / HP 倍率），引擎侧无需再改。危险度只是它的第一个来源。
- **新机制**：加 `EffectType` + handler（效果）、加 `StatusDef`（状态）、加敌人招式/意图脚本。
- **过场演出**：新增一种过场特效 = `transitions.ts` 的 `FX` 加一项 + `styles.css` 加一段同名 `@keyframes screen-<name>`；改某条跳转的演出 = `ROUTE_FX` 加一行（如 `"town>battle": { exit: FX.zoomOut, hold: 220 }`）。新增界面无需改过场代码，自动走默认动效。
- **系统级扩展**：资源可扩成每角色独立池 / 结转 / 上限；调度可换轴制；`BattleState` 可序列化 → 易接入存档与回放。
