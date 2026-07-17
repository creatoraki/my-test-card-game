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
- **流程**：主菜单 →「开始游戏」→ **城镇**（常驻中枢，开放「远征」「编队」）→ **选择地图** → 连续打完该地图的全部遭遇战（每场胜利后经验结算）→ 结算回城镇。

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
   ├─ data/                # ★ 内容数据（占位默认，替换正式内容改这里）
   │  ├─ cards.ts          # 卡牌定义（声明式效果）：剑士初始卡 + 专属抽卡池
   │  ├─ characters.ts     # 角色定义（HP / 仇恨 / 初始卡 / 专属抽卡池）
   │  ├─ enemies.ts        # 敌人定义（招式 + 意图脚本）
   │  ├─ encounters.ts     # 遭遇战定义（每场的敌人组合 + 可选的手工站位）
   │  ├─ maps.ts           # ★ 地图定义（名称/难度/遭遇战序列）—— 一张地图 = 一次远征
   │  └─ index.ts          # 数据注册表：按 id 索引 + 卡牌实例化/升级
   │
   ├─ store/               # Zustand 状态层（连接引擎与 UI）
   │  ├─ battleStore.ts    # 单场战斗状态（包裹引擎，克隆式不可变更新）
   │  ├─ townStore.ts      # ★ 城镇档案：角色养成/编队/个人卡组（persist → localStorage）
   │  └─ runStore.ts       # 一次「远征」流程（地图/进度/经验结算/界面切换）
   │
   └─ ui/                  # React 视图层（纯展示 + 派发，不含规则）
      ├─ transitions.ts    # ★ 场景过场预设表：全局开关 + 特效登记 + 按路线/按界面配置
      ├─ ScreenTransition.tsx # 过场编排：出场 → 黑场停顿 → 入场（串行）
      ├─ MenuScreen.tsx    # 主菜单：队伍预览 + 开始游戏（→ 城镇）
      ├─ TownScreen.tsx    # 城镇：设施入口（「远征」「编队」开放，其余占位）+ 重置存档
      ├─ FormationScreen.tsx # ★ 编队：队伍编辑 / 角色详情 / 属性加点 / 抽卡改造个人卡组
      ├─ ExpeditionScreen.tsx # 远征：地图选择列表
      ├─ TerminalNav.tsx   # 非战斗界面共用的顶部终端导航条
      ├─ BattleScreen.tsx  # ★ 战斗主界面：敌我单位/手牌/胜负遮罩 + 分镜编排 + 场景相机
      ├─ animations.ts     # ★ 出牌动画预设表：CINEMA 分镜时间轴/相机参数 + ANIM 每种特效的预设
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
      ├─ ExpRewardScreen.tsx # 战后经验结算：各角色经验入账 / 升级提示
      └─ EndScreen.tsx     # 远征结算：胜/负 + 上阵角色个人卡组
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
| `App.tsx` | **顶层路由**：读取 `runStore.screen`，把「界面 → 组件」的映射抽成纯函数 `renderScreen`，交给 `<ScreenTransition>` 渲染。抽成函数是为了让过场期间能继续渲染**旧**界面。 |
| `styles.css` | 全局深色主题：CSS 变量、卡牌 / 单位 / 血条 / 意图 / 遮罩、城镇设施网格 / 地图卡片、**场景过场**等所有样式；战斗画面固定为 16:9、最大 2560×1440，超出画布的视口区域以黑色填充。 |

### `src/engine/`（纯 TS 战斗引擎）

引擎**完全独立于 React**，`BattleState` 无函数、可 `structuredClone`、可存档，且随机数种子在状态内 → **战斗可复现**。

| 文件 | 功能 |
| --- | --- |
| `types.ts` | 引擎与 UI 共享的**类型总集**：`Card` / `Combatant`（`Ally`/`Enemy`）/ `EffectDescriptor` / `StatusDef` / `BattleState` / `EngineOps` 等。只定义类型、不含逻辑、不 import 其他模块。 |
| `rules.ts` | **★ 集中的可配置规则常量**：资源经济、手牌上限、时刻推进量、护盾/虚弱/易伤系数、仇恨模式、升级倍率，以及**养成段 `progression`**（上阵上限 / 每级属性点 / 经验曲线 / 每点属性收益 / 抽卡消耗），另导出经验曲线函数 `expToNext`。调平衡主要改这里。 |
| `rng.ts` | mulberry32 可复现伪随机：`rngFloat/rngInt/rngPick` + Fisher–Yates `shuffle`；`rngState` 存在 `BattleState` 内。 |
| `ops.ts` | **引擎原语与结算落点**：伤害管线（力量→虚弱→易伤→护盾吸收→落定→荆棘反伤）、治疗、加护盾、施加状态、改仇恨、状态生命周期驱动（回合/时刻边界）、胜负判定。 |
| `statuses.ts` | **状态效果注册表**：中毒 / 灼烧 / 再生 / 力量 / 虚弱 / 易伤 / 荆棘 / 眩晕 / 洞察。其中眩晕与洞察是**纯显示定义**（无钩子），实际效果分别在 `ai.ts` 与 UI 层处理。其余状态带行为钩子（`onRoundStart` / `modifyOutgoingDamage` 等），通过 `ctx.ops` 调用原语——**不 import 引擎实现，避免循环依赖**。 |
| `effects.ts` | **效果解释器**：把声明式 `EffectDescriptor`（DAMAGE / GAIN_BLOCK / HEAL / APPLY_STATUS / DRAW / GAIN_RESOURCE / MODIFY_THREAT）翻译成 `ops` 原语调用，并解析每条效果的作用目标（primary / self / allFoes / randomFoe …）。**卡牌与敌人招式共用**这套。我方角色的**攻击/防御属性加成在此注入**：施放者是我方单位时，DAMAGE 效果 +attack、GAIN_BLOCK 效果 +defense（敌人招式不受影响）。 |
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
| `cards.ts` | 全部卡牌定义（`CardDef[]`）：归属角色、消耗、普通/速攻、目标类型、声明式 `effects`、稀有度等。当前为剑士 3 张初始卡 + 6 张专属抽卡池占位卡。 |
| `characters.ts` | 角色定义（当前仅剑士，占位）：HP、初始仇恨、配色、初始卡列表 `startingCardIds`、**专属抽卡池 `poolCardIds`**（编队里花属性点 3 选 1 获得）。 |
| `enemies.ts` | 敌人定义（当前有「怪异的鸟」「废品机器人」「电线杆机器人」「收音机机器人」，占位；后三者技能一致）：`castTick`（行动间隔）、`moves`（招式，复用效果系统）、`script`（循环意图脚本）。 |
| `encounters.ts` | 遭遇战定义（每场的敌人组合）。**编排顺序不在此**——见 `maps.ts`。`enemies` 的每个槽位可写成裸 `"id"`（默认居中排布）或 `{ id, dx, dy, scale }`（**手工站位**，让敌人贴合背景地面；两种写法可混用）。`dx/dy` 挪整个单位，`scale` **只放大立绘与命中特效**（血条 / BUFF / 意图 / 倒计时全场统一尺寸不跟着变），缩放中心是立绘底边中点，故改 `scale` 脚不离地、无需回头补 `dy`。`slotDefId`/`slotPlacement` 是配套取值器：引擎只取前者，站位不进 `BattleState`。 |
| `maps.ts` | **★ 地图定义**：`MapDef`（名称 / 描述 / 难度 1-5 / 占位 emoji / `sequence` 遭遇战序列）。**一张地图 = 一条线性的远征路线**（`sequence` 只写一个遭遇战 id 即「只有 1 关」，打完直接进结算页，无需改 `runStore`）；新增远征内容主要改这里。地图配图不在此登记（数据层不碰素材，与 `enemies.ts` 同约定）——**战斗背景按 id 登记在 `ui/battleBg.ts`**。 |
| `index.ts` | **数据注册表**：按 id 建索引 + `getXxx` getter（找不到抛错，含 `getMap`）；`makeCard`（实例化，深拷贝效果；**uid 用 `crypto.randomUUID` 生成**——卡组会持久化，不能用刷新即归零的内存计数器）与 `upgradeCard`（升级：数值按倍率提升、名称加 `+`）。 |

### `src/store/`（状态层，Zustand）

| 文件 | 功能 |
| --- | --- |
| `battleStore.ts` | 包裹纯 TS 引擎供 UI 订阅/派发。每次 `play/end` 都先 `structuredClone` 战斗状态再交给引擎修改，保证 React 持有对象不被就地改动（**克隆式不可变更新**）。 |
| `townStore.ts` | **★ 城镇档案**：跨远征持久的角色养成资产。每个角色一份 `CharacterState`（等级 / 经验 / 未分配属性点 / 四维已加点 `attrs` / 个人卡组 `deck` / 抽卡候选 `pendingDraw`）+ 上阵名单 `party`（1~3 人）。actions：`ensureProfile`（幂等建档）、`resetProfile`、`allocatePoint`（花 1 点加一维）、`startDraw`/`pickDraw`（花 2 点随机 3 选 1 抽卡，候选持久化 → 刷新逃不掉）、`toggleParty`、`grantExp`（发经验并处理连升，每级 +5 点）。另导出 `deriveStats`（基础值 + 加点 × 每点收益的唯一换算点）。**已接 zustand persist（localStorage，key `town-profile-v1`）**。 |
| `runStore.ts` | 管理一次「远征」的流程：当前地图 `mapId`、遭遇战进度 `index`、战后经验报告 `expReport`、界面切换。`launchBattle` 把**上阵角色个人卡组合并**（`structuredClone` 副本）为战斗卡组、用 `deriveStats` 生成我方单位数值；`resolveBattle` 判胜负、按敌人数发经验（**委托 `townStore.grantExp`**，胜利即发、含最终战、带幂等护栏）并推进到结算/胜利页；`confirmExpReport` 进入下一场。 |

### `src/ui/`（React 视图层）

视图只负责**展示与派发**，不含战斗规则。

| 文件 | 功能 |
| --- | --- |
| `transitions.ts` | **★ 场景过场预设表**：总开关 `TRANSITIONS_ENABLED`、特效登记表 `FX`（fadeOut/fadeIn/zoomIn/zoomOut/slideUp/none）、全局默认 `DEFAULT_TRANSITION`、按界面 `SCREEN_FX`、按路线 `ROUTE_FX`（键为 `` `${from}>${to}` ``），以及解析函数 `resolveTransition`。**调过场节奏与演出只改这里**。 |
| `ScreenTransition.tsx` | **过场编排**：界面切换时把「瞬移」拆成 出场 → 黑场停顿 → 入场，**串行**执行（旧界面先卸载、新界面再挂载，避免 BattleScreen 双挂载/视频双解码）。用 `render` 回调而非 children，才能在出场期间继续渲染旧界面。定时器带批次序号守卫，快速连点会作废旧批次。 |
| `MenuScreen.tsx` | 主菜单：队伍预览 + 玩法要点 + 「开始游戏」（→ 城镇）。仅在启动游戏时出现一次。 |
| `TownScreen.tsx` | **城镇**：远征之间的常驻中枢。设施网格中「远征」「编队」可点，其余（补给站 / 锻造台 / 酒馆 / 档案库）为 disabled 占位，逐个实现后从 `LOCKED_FACILITIES` 挪走。另有「重置存档」按钮与上阵人数/合计行动卡显示。 |
| `FormationScreen.tsx` | **★ 编队**：左栏角色列表（等级/属性点/上阵切换，至少 1 人、至多 3 人），右栏选中角色详情——四维属性加点（基础值 + 每点收益，即点即生效）、装备占位空槽（武器/护甲/饰品，未开放）、个人卡组网格、「抽取行动卡」（花 2 属性点）。抽卡后弹**无法关闭的 3 选 1 弹层**（候选在 `pendingDraw` 持久化，刷新也必须选完）。 |
| `ExpeditionScreen.tsx` | **远征选图**：把 `MAPS` 渲染成卡片（emoji / 名称 / 难度星级 / 描述 / 场次数），点击即 `startExpedition(map.id)` 开局。 |
| `TerminalNav.tsx` | 非战斗界面共用的顶部终端导航条（原为 `MenuScreen` 内的局部组件，多屏共用后提取）。除 `active` 外的条目仍是占位。 |
| `BattleScreen.tsx` | 战斗主界面：顶部信息条（回合/时刻/光/牌堆数）、敌我单位、目标选择交互、手牌区、结束回合按钮、胜负遮罩。敌人预计攻击的最高仇恨友军会被高亮，但该提示同样属于「意图信息」——**仅当场上有敌人被「洞察」时才显示**。另含**分镜编排**（`runSteps` 定时器队列）与**场景相机**（`computeCamera`）。背景层按当前 `runStore.mapId` 查 `battleBg.ts` 取素材，视频渲染 `<video>`、静态图渲染 `<img>`——两个分支共用同一份 `className`/`ref`/`style`（相机的前后景同步依赖这条共用 transition）。 |
| `animations.ts` | **★ 动画预设表**：`CINEMA`（分镜时间轴 + 相机缩放/视差系数）、`ANIM`（每种 `CardAnim` 的特效图形/主色/时序）、`cardAnim`/`moveAnim`（卡牌与敌人招式 → 动画类型）。调演出节奏主要改这里。 |
| `CombatantView.tsx` | **敌人**单位（我方走 `AllyBar.tsx`）：**无背景面板**，立绘直接浮在场景上，自上而下为〔施法倒计时；仅在敌人带「洞察」时额外显示意图徽章，见 `isIntentRevealed`〕→ 立绘（完整不裁切）→ 血条（名字嵌在左侧、HP 数值靠右）→ 护盾/BUFF-DEBUFF 一排。带 `data-cmb-id`（相机据此定位聚焦目标），并挂载 `HitFxLayer`。可选的 `placement` 会下发成 `--place-dx/dy/scale`，由 `styles.css` 的 `.combatant` 落到**独立的 `translate`/`scale` 属性**上——不能走 `transform`，那条已被 `:hover`/`.attacking` 前冲/`hitShake` 抖动占用。 |
| `AllyBar.tsx` | **★ 我方队伍头像栏**：舞台底部一条固定构图——高度 = 设计画布全高的 15%（162px），横向 10%/80%/10% 三段，左右两段是纯透明占位，中间 80% 由 `ALLY_SLOTS`(4) **固定均分**（与上阵上限 `progression.maxParty` 刻意解耦：人数变化不改格宽，空出的格子渲染成 `.empty` 空槽）。单格自上而下为：悬空外挂的徽章排（护盾/仇恨/BUFF-DEBUFF，绝对定位不占流）→ **黑色玻璃蒙板**（玻璃下透出立绘裁出的头部片段作头像）→ 与玻璃**一体化**的血条（贴底边，自身不带角，轮廓由玻璃的 `overflow`+`clip-path` 裁出）。槽位根节点**刻意仍带 `.combatant.player` 类名**——前冲/受击抖动/受益光晕/阵亡/特效层定位那套规则全部 scoped 在 `.combatant` 上，复用即可与敌人共享同一套演出。它仍在 `.battle-stage` 内 ⇒ **跟随分镜相机**，每格带 `data-cmb-id` 供 `computeCamera` 定位。 |
| `HitFxLayer.tsx` | 命中表现的**共用件**，敌人（`CombatantView`）与我方（`AllyBar`）共用以保证两边的特效着色/命中时序/飘字一致：`<HitFxLayer>` 渲染首击特效（序列帧/emoji，`key={hit.seq}` 重挂载重播）+ 伤害/治疗飘字；`hitFxVars(hit)` 导出挂在单位根节点上的受击反应类名（`hit-react`/`bless-react`）与 CSS 变量（`--vfx-color`/`--vfx-impact`）。两者都相对**最近的定位祖先**定位，故必须挂在 `.combatant` 内部。 |
| `CharacterPortrait.tsx` | 角色立绘：有配图用图，无图回退 emoji。`CHARACTER_ART` 登记表（**立绘只登记在 UI 层**，`data/characters.ts` 不碰素材路径）按 `CharacterDef.id` 索引，一份 def 同时承载**两套独立取景**的微调参数：`dx/dy` → 战斗半身像（`--portrait-dx/dy`），`head: { zoom, dx, dy }` → 头像栏的头部取景（`--head-zoom/dx/dy`）。两套的取景窗尺寸与裁法都不同、偏移量不通用，故刻意不复用。走哪套由 `className` 决定：无 → 半身像、`avatar-portrait` → 头部、`menu-portrait` → 全身。 |
| `EnemySprite.tsx` | 敌人待机立绘播放器：单张横向拼条图靠 `background-position` + `steps()` 无限循环。与 `SpriteFx` 并列的另一套机制——那套是逐帧独立图、播一次即停的命中特效。 |
| `enemyArt.ts` | 敌人 `EnemyDef.id` → 待机拼条立绘（`EnemySpriteDef`：帧数/每帧时长/渲染尺寸）的查找表 + `warmEnemyArt()` 预加载。未登记的敌人由 `CombatantView` 回退 emoji。**静态单帧立绘**按 `frames: 1` 登记即可（拼条机制在单帧下自然退化成不动的背景图，无需特判）。 |
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
| `ExpRewardScreen.tsx` | **战后经验结算**（取代旧的三选一选卡奖励）：每个上阵角色一行——经验入账、经验进度条、升级高亮徽章（LV x→y · 属性点 +N），确认后进入下一场。 |
| `EndScreen.tsx` | 远征结算：显示胜/负、地图名与进度、上阵角色的等级与个人卡组；通关时附「最终战经验已入账」提示，返回城镇。 |

#### 设计画布（`stage.ts` + `styles.css`）

战斗画面是一块**固定 1920×1080 的设计画布**（`.screen.battle`），整体用 `transform: scale(k)` 等比缩放去适配窗口；`k = min(容器宽/1920, 容器高/1080)`，由 `useStageScale` 的 `ResizeObserver` 算出，经 `--stage-scale` 下发。16:9 与「最大 2560×1440、更大的显示器四周留黑边」仍然成立——前者由固定长宽保证，后者是 `STAGE.maxScale` 的上限。

**为什么**：改造前画布宽度是 `min(100vw, 2560px, …)`，尺寸随窗口在 ~1280×720 到 2560×1440 之间浮动，而画布内部全是固定 px。背景 `object-fit: cover` 等比缩放、立绘却不缩放 → `encounters.ts` 里调好的敌人站位只在「调它时的那个窗口尺寸」踩得住地面线，换分辨率就脱节。

**因此**：画布内的每个 px 都是**设计 px**，与玩家实际分辨率无关——站位 `dx/dy`、立绘尺寸、侧栏宽、字号在任何窗口下构图完全一致，站位一次调好即永久成立。

- ⚠ **画布内不要再写 `vw`/`vh`，也不要按窗口宽度加 `@media` 断点**——那会让构图重新随分辨率漂移。（原先那条把战斗侧栏从 280px 压到 192px 的 `@media (max-width:1100px)` 已随此改造删除。）
- 布局盒仍是 1920×1080（`transform` 不改变布局），由 `.battle-viewport` 的 `place-items: center` 居中，`scale` 绕中心原点缩放，溢出部分由 viewport 的 `overflow: hidden` 裁掉 → 视觉正好居中。
- ⚠ **画布带 `transform` ⇒ 它成了内部 `position: fixed` 的包含块**：`.overlay`、`.end-turn-float` 等因此改为贴合画布而非窗口（顺带修掉了它们过去会浮到黑边上的毛病），并随画布一起缩放。
- 左侧手牌栏的两个构图旋钮写在 `.screen.battle` 上（`styles.css`）：`--hand-col-w`（栏宽，当前 `380px`）与 `--hand-shift-y`（整体下移量，当前 `324px` = 画布高 1080 的 30%）。下移用 `transform` 实现（布局盒不动，不影响卡牌右弹/飞入的水平位移），同时把 `.side` 高度收窄同样的量，保证手牌仍竖排在可视区内。
- ⚠ **`getBoundingClientRect()` 量到的是屏幕 px，画布内元素拿它定位前必须用 `toDesignBox()` 换算回设计 px**，否则会连同 `--stage-scale` 被再缩放一次。`CardDetailPopup` 即是一例：锚点在 `BattleScreen` 侧换算，边界从 `window.innerWidth/Height` 改为 `STAGE.width/height`。（元素自身的 `offsetWidth/Height` 是布局 px，本就不含 transform，可直接用。）

#### 分镜相机（`BattleScreen.tsx` + `animations.ts`）

每一步（玩家出牌 / 敌人行动）走同一套时序：施法者弹出 → 顿（全景）→ 镜头推近聚焦目标 →〔仅玩家出牌：卡面亮相〕→ 命中特效 + 飘字停留 → 镜头恢复归位 → 下一步。

相机是**整屏场景相机**，不是「把某个 div 放大」：

- 相机被建模为**一个屏幕空间仿射变换** `q → S·q + T`。前景（`.battle-stage`）与背景（`.battle-bg-video`）各自通过 `screenAffineToLocal` 换算到自身局部坐标系，因此严格同步 —— 推近时森林与角色一起动。
- **换算要除以设计画布的缩放 k**（见上「设计画布」）：`computeCamera` 内部全是屏幕空间里的自洽比值（包围盒 / `fit` / 背景钳制），祖先缩放会同比约掉；只有 `screenAffineToLocal` 这一步跨坐标系——缩放分量 `S` 不受 k 影响（标量可交换），但平移量是屏幕 px，必须 `/k` 换回设计 px。漏除会让小窗口下推镜偏移/过头。
- 背景按 `CINEMA.bgParallax`（0.35）**衰减跟随**：前景 1.55x 时背景约 1.19x，近快远慢 → 有纵深，且背景放大少、更清晰。系数取 0 即退回「背景不动」的老行为，取 1 则与前景完全同步。
- **画框**用舞台矩形（目标居中到清晰可见区，不会跑到左侧透明手牌栏底下）；**裁切**统一在 `.screen.battle`（整屏），前景与背景共用同一个边界 —— 若各自裁切，角色被裁在舞台内而背景铺满整屏，边界对不上就会脱节。
- 背景视频精确覆盖固定的游戏画布，保持媒体原始宽高比；配合 `computeCamera` 里的边缘钳制，视差平移时不露黑边。
- ⚠ 所有测量都必须在**全景态**（`camera === null` → `transform: none`）进行，否则 `getBoundingClientRect()` 量到的是变换后的矩形。

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
data （内容：卡/角色/敌人/遭遇战/地图）
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

- `rules.ts` 汇总所有平衡旋钮（资源经济、手牌、时刻推进、护盾/虚弱/易伤系数、仇恨模式、升级倍率、**养成段 `progression`**）。引擎读取这些常量，**调平衡/改机制主要改这一个文件**。

### 6. 角色养成：属性点 + 个人卡组

- **升级只发点、不涨面板**：`grantExp` 连升循环里每级 +`levelUpPoints`（5）属性点，基础属性（characters.ts）永远不变；最终数值 = 基础值 + 已加点 × 每点收益，换算集中在 `townStore.deriveStats` 一处，编队 UI 与开战组队共用。
- **攻防加成在效果解释器注入**（而非开战时烘焙进卡牌数值）：出牌时 `resolveEffects` 的 `sourceId` 就是持有者 Ally，`applyEffect` 对我方来源的 DAMAGE/GAIN_BLOCK 分别加 `attack`/`defense`。好处：战斗内卡实例与城镇个人卡组数值一致、与卡牌强化（×1.4）互不纠缠、敌人共用解释器不受影响。
- **卡牌唯一来源是抽卡**：战斗胜利只给经验；花 `drawCost`（2）属性点从 `poolCardIds` 随机 `drawChoices`（3）张候选（允许重复）3 选 1。候选存在 `pendingDraw` 并随档案持久化——**属性点已消耗，刷新页面也必须选完**，杜绝「抽到不满意就刷新」。
- **战斗卡组 = 上阵角色个人卡组的集合**：`launchBattle` 把 `party` 中每人的 `deck` `structuredClone` 后 flat 合并，个人卡组归属清晰（`ownerCharId` 决定配色/禁用/加成），战斗改动不污染城镇资产。

### 7. 可扩展点（后续方向）

- **内容替换**：`data/` 全部为占位默认，替换成正式卡牌/角色/敌人/遭遇战/地图即可。
- **城镇设施**：`TownScreen` 的 `LOCKED_FACILITIES` 是一排 disabled 占位；实现某个设施 = 加一个 `Screen` 成员 + `App.tsx` 加 case + 新建界面组件，并把它从占位表里挪走。持久资产统一放 `townStore`。
- **地图形态**：目前 `MapDef.sequence` 是线性数组。若要做成《杀戮尖塔》式的分支节点图，只需把它换成节点结构 + 新增一个路径选择界面，`runStore.index` 改为 `currentNodeId`——耦合面集中在 `runStore` 的 `launchBattle` / `advance` / `resolveBattle` 三处。
- **新机制**：加 `EffectType` + handler（效果）、加 `StatusDef`（状态）、加敌人招式/意图脚本。
- **过场演出**：新增一种过场特效 = `transitions.ts` 的 `FX` 加一项 + `styles.css` 加一段同名 `@keyframes screen-<name>`；改某条跳转的演出 = `ROUTE_FX` 加一行（如 `"town>battle": { exit: FX.zoomOut, hold: 220 }`）。新增界面无需改过场代码，自动走默认动效。
- **系统级扩展**：资源可扩成每角色独立池 / 结转 / 上限；调度可换轴制；`BattleState` 可序列化 → 易接入存档与回放。
