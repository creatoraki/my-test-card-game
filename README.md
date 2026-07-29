# 《霓虹都市》· 原型（my-test-card-game）

> 已定的游戏背景与机制依据见 **`游戏设定.md`**。代码内仍有占位命名，后续按确认后的设定逐步替换。

一个类《超时空方舟》的**网页版卡牌 Roguelite** 原型：以「**时刻制（tick）战斗**」为核心机制，配合「**角色养成（等级/属性点）+ 个人卡组改造**」的闭环。

> 目前是**可玩原型**：数据（卡牌 / 角色 / 敌人 / 遭遇战）与规则均为占位默认值，代码结构已按「引擎 / 数据 / 状态 / UI」四层解耦，方便后续替换成正式内容和调整平衡。

---

## 一、核心玩法概览

- **时刻（tick）**：每回合从第 1 时刻开始。打出**普通牌**推进 1 时刻，打出**速攻牌**不推进时刻。
- **敌人排程**：每个敌人有行动间隔 `castTick`，头顶显示**施法倒计时**；当时刻推进到其倒计时归零时行动。**攻击意图默认不可见**——你知道敌人「何时」动手，但不知道「要做什么」；意图数据引擎里照常生成，需靠「洞察」标记揭示（后续会做对应卡牌能力）。回合结束时，本回合还没行动过的敌人会各补一次行动（保证每回合至少被打一次）。
- **资源（光）**：全队每回合共享一个「光」池用于出牌（默认每回合 3 点，不结转）。
- **仇恨（aggro）**：无站位。敌人按仇恨值选择攻击目标，可用「嘲讽」拉仇恨改变敌人目标。
- **养成闭环**：每个角色**独立拥有一个个人卡组**，战斗实际卡组 = 上阵角色个人卡组的集合。战斗胜利**不掉卡**，只给上阵角色发经验；**升级不涨基础属性，只获得 5 属性点**。属性点在城镇「编队」里二选一花法：加四维属性（生命/攻击/防御/仇恨），或花 2 点从角色**专属卡池**随机 3 选 1 抽一张新卡（抽卡不可取消）。养成进度是**城镇的持久资产**（localStorage）——跨远征持续，胜败都保留。
- **探索路由**：进入地图后**不是直接战斗**，而是接入一场由 $5\sim7$ 段（首图 6 段）阿弥陀签式线路组成的「失真路由图」。每段都会公开 5 个终点事件并短暂显示完整线路（约 0.9-1.2 秒，越深越短）；线路随即隐去，玩家选择 A-E 入口后，信号自动下行、遇横线强制换线，抵达一个事件。**抵达 ≠ 结算**：任何终点（含普通战 / 精英 / BOSS / 撤离升降机）都会先弹出落点浮层，给出**两条分支**（如「迎战」/「绕行 −8 粒子」、「开门 污染+1 积分+46」/「不碰」），玩家选定后才真正扣能量、跑效果、进战斗或推进下一段——落点是运气，怎么处理是决策。**净化粒子**是唯一的难度与时限轴（只降不升——每段固定 −10，事件另有增减；能量越低敌人越强、我方污染越重、掉落越好），第 5 段起终点池开始出现 **BOSS 接入点**与**撤离升降机**。详见 `探索模式设计.md`。
  > 代码已按设计文档 **P0** 落地（5 线路由 + 6 段推进 + 5 档净化粒子 + 事件结算 + 普通战斗/BOSS/撤退/团灭闭环）。⚠ **P1 未做**：产出暂时记为**城市居民积分**而非占格实物，32 格背包与负重、探索指令（拓扑扫描 / 信号锚点 / 并行探针）、挑战词条与统一掉落系数 K 均只在 HUD 上留了置灰占位。
- **流程**：主菜单 →「开始游戏」→ **据点**（常驻中枢）→ **控制终端 → 下降舱 → 选择地图** → **探索路由**（观察线路 / 选择入口 / 走线 / 落点浮层选分支 / 结算事件 / 进入战斗或撤退）→ 击杀 BOSS 或撤退 → 结算回据点。
  > ⚠ **据点页正在改造中**：现已换成「大厅场景 + 冬眠仓 / 训练室 / 控制终端三个毛玻璃入口」，点击这三个入口会播一段**进设施运镜**（镜头以「拿起 → 对焦 → 放大」的节奏推进，前两处短停；界面元素逐个飞出，背景交叉淡入设施场景）。**目前控制终端与冬眠仓有真实内容**：`ui/ControlTerminalScene.tsx`（下降舱 → 场景内浮层选地图 → 出击；委托 → 三条示例工单的灰化占位，工单系统未接入）与 `ui/CryoScene.tsx`（右下三块入口砖 → 编队 / 队员档案 / 冬眠唤醒 三个浮层）；**训练室**进去仍只有背景与「返回据点」。**顶部导航条与「回主菜单」的路仍未恢复**（角落只剩「重置存档」），但**据点已不再是死路** —— 下降舱接的就是 `runStore.startExpedition`，编队则在冬眠仓里。⚠ 旧的 `ExpeditionScreen`（远征选图页）已随探索重做一并删除；`FormationScreen`（旧编队页）仍在但不可达：冬眠仓是设施内 UI，没走那条路由。

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
├─ 探索模式设计.md         # ★ 阿弥陀签式「失真路由图」探索设计：5-7 段线路决策、净化粒子（唯一难度轴）、掉落系数与挑战词条、实物战利品与背包、首图「废弃楼层」事件池（P0 已实现；背包/指令/词条属 P1，危险度与残片已废弃）
├─ 事件设计.md             # ★ 探索终点事件设计：基础规则、先手/污染/场景特殊卡牌规则与废弃楼层战斗事件
├─ 角色养成设计.md         # ★ 角色养成设计文档（设计定稿，待实现：12 周战役 + 特性/卡组/装备 + 传承积分）
├─ 物品设计.md             # ★ 物品与装备设计：三装备槽、稀有度、随机羁绊、羁绊饰品与重铸规则
└─ src/
   ├─ main.tsx             # React 入口，渲染 <App/>；★ 第一行 import "./styles/index.css"（必须排在所有 import 之前）
   ├─ App.tsx              # 顶层路由：按 runStore.screen 选界面，交给 ScreenTransition 编排过场
   │
   ├─ styles/              # ★ 公共样式层（只由 main.tsx 单点引入，必然先于所有组件 CSS 注入）
   │  ├─ index.css         # 只做 @import，固定公共层内部顺序：tokens → base → layout → widgets
   │  ├─ tokens.css        # :root 设计令牌（配色 / 边框 / 圆角等 CSS 变量）
   │  ├─ base.css          # reset、html/body/#root、body 底纹、button 全家桶、input/code
   │  ├─ layout.css        # 屏幕骨架：.screen / .terminal-screen / .title / .row / .overlay(-card)
   │  └─ widgets.css       # 跨界面复用的小部件：奖励三选一 / 卡组摘要 / 战利品 chip / 经验条
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
   ├─ explore/             # ★ 纯 TS 探索引擎（与 engine/ 平行的第二个纯逻辑层）
   │  ├─ types.ts          # 探索层类型总集（路由图 / 终点事件 / 队伍快照 / 净化粒子档位 / 会话状态）
   │  ├─ rules.ts          # ★ 可配置探索规则常量 + 5 档净化粒子表（调探索平衡改这里）
   │  ├─ route.ts          # ★ 阿弥陀签的生成与求解：generateCrossbars / traceRoute / solveMapping（入口→终点必为双射）
   │  ├─ session.ts        # ★ 会话逻辑：建局 / 分段生成（事件保底）/ 选入口 / **落点（landed，只落点不结算）** / 分支选择 chooseOption（真正扣能量、跑效果、决定去战斗还是结算）/ 战斗回填 / 能量换算
   │  ├─ route.test.ts     # 路由图单元测试（合法性 / 双射 / 同种子可复现）
   │  └─ session.test.ts   # 探索会话单元测试（阶段机 / 事件保底 / 档位 / 血量继承）
   │
   ├─ data/                # ★ 内容数据（占位默认，替换正式内容改这里）
   │  ├─ cards.ts          # 卡牌定义（声明式效果）：剑士初始卡 + 专属抽卡池
   │  ├─ characters.ts     # 角色定义（HP / 仇恨 / 初始卡 / 专属抽卡池）
   │  ├─ enemies.ts        # 敌人定义（招式 + 意图脚本）
   │  ├─ encounters.ts     # 遭遇战定义（每场的敌人组合 + 可选的手工站位）
   │  ├─ exploreEvents.ts  # ★ 终点事件池（首图「废弃楼层」，按生存/成长/战斗/经济/路由/能量/风险/终局八类分组；P0 未实现的条目标 disabled 不参与抽取）
   │  ├─ maps.ts           # ★ 地图定义（路由段数 / BOSS 接入段 / 事件池 id / 起始净化粒子 / 高档位填充敌人）
   │  └─ index.ts          # 数据注册表：按 id 索引 + 卡牌实例化/升级 + 事件池查找
   │
   ├─ store/               # Zustand 状态层（连接引擎与 UI）
   │  ├─ battleStore.ts    # 单场战斗状态（包裹引擎，克隆式不可变更新）
   │  ├─ exploreStore.ts   # ★ 探索会话状态（包裹 explore/session，克隆式不可变更新）
   │  ├─ townStore.ts      # ★ 城镇档案：角色养成/编队/个人卡组/居民积分（persist → localStorage）
   │  └─ runStore.ts       # 一次「远征」流程编排（界面路由 + 路由图与战斗的往返 + 终局结算）
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
      ├─ TownScreen.tsx    # 据点大厅：1920×1080 设计画布（复用 stage.ts，恒 16:9、四周黑边）+ 大厅.png 固定背景 + 右下 718×350 的 bento 毛玻璃面板（6 块形状各异的半透明玻璃砖拼成规则矩形：冬眠仓/训练室/控制终端 3 个真入口 + 3 个未开放占位，图标为内联线框 SVG）+ 角落的重置存档；★ 点真入口播「进设施」演出（3s「拿起→对焦→放大」运镜，前两处短停 + 界面元素逐个错峰飞出 + 背景交叉淡入设施场景，参数见 facilityScenes.ts）；★ 设施内容走模块级 FACILITY_CONTENT 登记表（目前 worklog → ControlTerminalScene、cryo → CryoScene）；⚠ 训练室仍是空场景
      ├─ facilityScenes.ts # ★ 进设施演出预设表：设施 id → 背景图/推镜焦点/倍数 + 相机换算 + 时间轴与飞出参数（据点专用，无 .css）；已登记 cryo/training/worklog 三处
      ├─ ControlTerminalScene.tsx # ★ 控制终端（设施 worklog）的设施内 UI：亮色玻璃基调（白底场景专用的 --term-* 一套，不复用 .bento-glass）+ 右侧两条**抽屉式入口**（常态半隐在画布右缘外，悬浮哪条哪条向左弹出）→「下降舱」浮层（地图列表/预览图/队伍摘要 → startExpedition 出击）与「委托」浮层（3 条示例工单全灰化，工单系统未接入）；浮层**无全局遮罩**，背板是白色毛玻璃，顶边左右各 34% 处垂两根**吊绳**（.term-modal 的伪元素，靠 PANEL_SIZE 传来的 --panel-w/h 定位），开合是 600ms 的「连绳带板从天花板滑下 / 收回」
      ├─ CryoScene.tsx     # ★ 冬眠仓（设施 cryo）的设施内 UI：与 ControlTerminalScene **完全同构**（右侧三条**抽屉式入口** + **无遮罩吊绳浮层**，场景上只有标题 + 读数 + 抽屉，点入口才弹浮层），只把亮玻璃的强调色从深青换成**深紫罗兰 #7c4dbe**（冬眠仓.png 是紫粉白的浅色场景，--cryo-* 一套）。三条抽屉 → 三个浮层：①「编队」= partySize 个出战槽（所见即所得，空槽画虚线 ＋）+ 待命名册，互相编入/撤出；②「队员档案」= 左名册 + 右**只读**详情（立绘/经验条/四维/个人卡组）；③「冬眠唤醒」= 舱位阵列（已解封 / 密封 / 无信号三态，至少 `POD_SLOTS`=6 格）+ 右侧舱位详情 +「解封唤醒 −awakenCost 残片」→ `townStore.awaken`。⚠ 属性加点与抽卡刻意**不**在这里（按 `游戏设定.md` 的设施分工归训练室）
      ├─ mapArt.ts         # 地图 id → 场景图的查找表 + warmMapArt() 预热（与 battleBg.ts 同约定；那边是战斗背景，这边同时供下降舱的选层预览与探索页的全屏底图）
      ├─ FormationScreen.tsx # ★ 编队：队伍编辑 / 角色详情 / 属性加点 / 抽卡改造个人卡组（⚠ 已被冬眠仓内的编队浮层取代，当前不可达）
      ├─ ExploreScreen.tsx # ★ 探索主界面：1920×1080 设计画布（复用 stage.ts）+ 废弃楼层背景全屏铺满 + 中央失真路由图面板；四角 HUD —— 左上区域/段号/阶段提示、右上读数（净化粒子表 / 污染层数 / 居民积分 / 负重占位）、左下队伍血条（复用 HpBar）、右下探索指令（置灰占位）+ 背包（`session.canOpenBackpack` 的结论）+ 撤离；★ 落点走**两段式无遮罩浮层**（landed 选分支 → resolving 看结算，照控制终端的吊绳语言从上方滑入），战斗/BOSS/撤离一律先弹浮层再执行；聚焦靠四角 HUD 的 `.is-recede`（只压叶子元素）与落点升起的光柱 `.expl-beam`；⚠ 舞台与玻璃砖的祖先链上禁挂 animation/opacity/transform/filter
      ├─ RouteBoard.tsx    # ★ 失真路由图本体（一张 SVG 打四个阶段）：revealing 全显横线 + 顶部倒计时条 → choosing 横线**只改 opacity 不卸载**、入口 A-E 可点（blockedLanes 置灰）→ routing 沿 traceRoute() 的折线走线（dash 点亮 + 亮头尾迹 + 拐点扩散环 + animateMotion 信号点，约 0.75 设计 px/ms）→ landed/resolving 落点卡被「撞」一下并高亮、其余终点压暗；★ 入口是**悬挂灯箱**（吊索 + 切角箱体 + 底沿灯管，常态缓慢摆动、悬停停摆下压并把所属竖线整条点亮，封锁态断一根吊索歪挂）；底部 5 张常驻终点卡按 kind 用不同强调色与 48×48 内联线框 SVG 图标（不用 emoji），悬停在卡下方展开完整描述与两条分支的代价；⛔ 全页禁止闪烁型明暗变化
      ├─ EnergyMeter.tsx   # ★ 净化粒子仪表（取代旧 DangerMeter）：5 格档位条 + 数值 + 档名 + 「本段结束后将跌入〈告急〉」的跨档预警（档位真相点在 explore/session.energyTier）
      ├─ TerminalNav.tsx   # 非战斗界面共用的顶部终端导航条（探索页走全屏场景，不挂它）
      ├─ BattleScreen.tsx  # ★ 战斗主界面：敌我单位/手牌/胜负遮罩 + 分镜编排 + 场景相机（世界坐标）
      ├─ animations.ts     # ★ 出牌动画预设表：CINEMA 分镜时间轴/相机参数/顿帧震屏/空闲漂移 + ANIM 每种特效的预设
      ├─ ambience.ts       # ★ 场景氛围预设表：地图 id → Canvas 粒子发射器 + 灯光闪烁 + 屏幕调色
      ├─ AmbienceLayer.tsx # 氛围层：双 Canvas（远/近景粒子，单 rAF 驱动）+ 屏幕空间调色层
      ├─ useIdleTwitch.ts  # 待机小动作：每隔几秒随机让一个存活敌人抖一下
      ├─ CombatantView.tsx # 敌人单位（无框立绘 + 下方血条/状态 + 倒计时/意图 + 受击特效挂载点）
      ├─ AllyBar.tsx       # ★ 我方队伍卡：底部 HUD 左段，固定 3 格描边立绘卡（血条/护盾条 + 角标；悬停/选中手牌时归属槽位变宽点亮）
      ├─ HpBar.tsx         # ★ 血条共用件（敌我共用）：血量分档配色 + 流光带/端头火花/掉血迸溅粒子
      ├─ TickRuler.tsx     # ★ 顶端信息条右端的时刻标尺（当前时刻高亮；敌人行动标记开关预留）
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
      ├─ HandCard.tsx      # 手牌单卡（发牌飞入 / 出鞘离场 / 机能边框：左上角 3D 水晶费用 + 双线框 + 巡游流光）
      ├─ CardView.tsx      # 单张卡牌（奖励/结算界面用）
      ├─ CardInfoPanel.tsx # 手牌右侧的固定卡牌说明面板（1:2 竖版：上半 1:1 大卡面 + 下半信息；无卡时科幻待机占位）
      ├─ ManaCrystalIcon.tsx # 「光」资源水晶图标（内联 3D SVG 宝石，中央桌面留给费用数字）
      ├─ cardArt.ts        # 卡面配图查找表
      ├─ StatusPips.tsx    # 状态图标一排（emoji + 层数）
      ├─ ExpRewardScreen.tsx # 战后小结：净化粒子档位与产出倍率 + 本场居民积分 + 各角色经验入账 / 升级提示
      └─ EndScreen.tsx     # 远征结算：通关/撤退/团灭三种收场 + 「远征记录」（session.history 逐段列出入口/落点事件/能量）+ 居民积分落袋
```


# 操作事项
如需要查看某个文件的具体功能，可查看 F:\new\my-test-card-game\各文件功能明细.md