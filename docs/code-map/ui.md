# React 视图层

路径：`src/ui/`。组件只负责展示、交互和派发 action，不承载战斗、探索、物品或养成规则。图片素材只通过 UI 查表引用，`data/` 不直接引用素材路径。

## 页面与流程

| 文件 | 作用 |
| --- | --- |
| [MenuScreen.tsx](../../src/ui/MenuScreen.tsx) | 主菜单开屏。与战斗共用 1920×1080 设计画布，视频铺底，标题和开始按钮用设计 px 定位。 |
| [TownScreen.tsx](../../src/ui/TownScreen.tsx) | 据点大厅和设施入口。用 bento 砖块表达设施面积（8 块，商店独占第三行）；设施内容通过 `FACILITY_CONTENT` 登记表挂载，内容和返回按钮延迟到离场阶段再卸载。状态条的生存天数订阅 `townStore.day`。 |
| [ControlTerminalScene.tsx](../../src/ui/ControlTerminalScene.tsx) | 控制终端：下降舱地图选择、队伍预览、远征启动，以及委托占位。抽屉入口和浮层均在据点画布内完成，不新增路由。 |
| [CryoScene.tsx](../../src/ui/CryoScene.tsx) | 冬眠仓：编队、队员档案和唤醒浮层；属性面板、卡组、舱位状态和角色切换演出都在这里展示。 |
| [StorageScene.tsx](../../src/ui/StorageScene.tsx) | 物资中转仓：库存、三槽装备和回收台；穿戴后通过 `deriveStats` 现算面板，出售后清理失效勾选。 |
| [ShopScene.tsx](../../src/ui/ShopScene.tsx) | 商店：进入设施后直接打开靠右的常驻货架面板，通过装备/材料 tab 切换商品，支持采购与花积分刷新。货架状态与隔日重置都在 `townStore`，本组件只读状态派发 action，不自己判日期。 |
| [FormationScreen.tsx](../../src/ui/FormationScreen.tsx) | 编队/角色相关独立视图入口，复用角色立绘和卡组显示。若流程从设施内进入，路由编排仍由 store 决定。 |
| [CharacterDetailScreen.tsx](../../src/ui/CharacterDetailScreen.tsx) | 角色详情视图，展示角色面板、装备和个人卡组。 |
| [ExpeditionScreen.tsx](../../src/ui/ExpeditionScreen.tsx) | 地图选择页，将 `MAPS` 渲染为可进入的远征入口。 |
| [ExploreScreen.tsx](../../src/ui/ExploreScreen.tsx) | 探索主界面：固定设计画布、路由图、节点侧栏、粒子/积分/负重读数、节点分支、战斗签入口、背包和撤离。状态机判断留在 `explore/session`。 |
| [ExpRewardScreen.tsx](../../src/ui/ExpRewardScreen.tsx) | 战后小结：显示实物掉落、角色经验入账、净化粒子档位和返回牌桌/结算操作。战斗胜利不直接产生居民积分。 |
| [EndScreen.tsx](../../src/ui/EndScreen.tsx) | 远征结算：通关、撤退和团灭共用；复用轨迹回顾并展示积分、带回据点的 `shipped`/`backpack` 实物和角色卡组。 |

## 探索与战斗组件

| 文件 | 作用 |
| --- | --- |
| [RouteBoard.tsx](../../src/ui/RouteBoard.tsx) | SVG 等距路由图。统一由 `sx()` / `sy()` 投影，阶段依次展示生成、封存、桥接揭示、入口选择、走线、落点和路径披露；隐藏桥接时不能读取引擎求解结果。 |
| [SlotReels.tsx](../../src/ui/SlotReels.tsx) | 战斗签老虎机：全屏三列卡带和停止摇杆，使用独立 `.slot-stage`，不复用普通探索浮层。 |
| [ExploreCardView.tsx](../../src/ui/ExploreCardView.tsx) | 探索卡卡面，与战斗卡的内容结构分离；显示危险度/收益/去向或绑定的遭遇战。 |
| [DangerMeter.tsx](../../src/ui/DangerMeter.tsx) | 旧探索牌局危险度展示；新路由图流程以净化粒子和能量档位为主，修改时先确认调用方仍使用该组件。 |
| [TrailStrip.tsx](../../src/ui/TrailStrip.tsx) | 横向轨迹，远征中记录过程，结算页复用作历史回顾。 |
| [BackpackPanel.tsx](../../src/ui/BackpackPanel.tsx) | 探索背包浮层：常规、满包替换、投递口寄件三种模式共用一块面板；容量与开放时机只读取会话结论。 |
| [BattleScreen.tsx](../../src/ui/BattleScreen.tsx) | 战斗画布、顶端信息条、战场、底部 HUD、目标交互、分镜队列和相机。手牌上限读取 `partyHandLimit`，敌人目标不做仇恨高亮。 |
| [CombatantView.tsx](../../src/ui/CombatantView.tsx) | 敌方单位：倒计时、意图、立绘、血条、护盾/状态和命中特效；站位通过独立 `translate` / `scale` 属性传入，避免覆盖演出 `transform`。 |
| [AllyBar.tsx](../../src/ui/AllyBar.tsx) | 底部队伍卡，最多 3 个槽位；归属手牌聚焦时改变槽位宽度，生命/护盾和状态采用共用组件。位于战场之外，因此不参与相机推近。 |
| [HandCard.tsx](../../src/ui/HandCard.tsx) | 手牌竖卡：费用/名称、1:1 配图和定高说明区；靠下方飞入、上浮聚焦、向上出鞘离场。离场清理依赖 `transform` 过渡事件，不要换成其他属性。 |
| [CardView.tsx](../../src/ui/CardView.tsx) | 编队/抽卡界面的单卡视图，展示费用、标签、归属、描述和选择状态。 |
| [CardInfoPanel.tsx](../../src/ui/CardInfoPanel.tsx) | 战斗 HUD 右侧固定卡牌说明面板，宽高比锁死 1:2，无配图也保留稳定尺寸的占位。 |
| [TickRuler.tsx](../../src/ui/TickRuler.tsx) | 顶端信息条的全局时刻标尺；敌人行动标记默认关闭。 |

## 共用组件与素材查表

| 文件 | 作用 |
| --- | --- |
| [ItemSlot.tsx](../../src/ui/ItemSlot.tsx) | 背包、仓库、战后小结和远征结算共用的物品格；五档稀有度只由局部变量驱动，装备真实跨 2 格，并导出排布所需的 `EmptySlot`。 |
| [ItemTabs.tsx](../../src/ui/ItemTabs.tsx) | 物品一级/二级分类 tab；稀有度颜色留给格子，不给 tab 叠色。 |
| [ItemDetail.tsx](../../src/ui/ItemDetail.tsx) | 物品名称、稀有度、类别、占格、描述、属性和售价；操作按钮由调用方通过 children 注入。 |
| [itemFilters.ts](../../src/ui/itemFilters.ts) | 物品分类定义、匹配和计数纯函数。 |
| [HpBar.tsx](../../src/ui/HpBar.tsx) | 敌人和我方共用血条；按剩余血量分三档，流光、端头辉光和掉血火花保持固定池。 |
| [HitFxLayer.tsx](../../src/ui/HitFxLayer.tsx) | 敌我共用命中特效和飘字；以 `hit.seq` 重挂载重播。 |
| [CharacterPortrait.tsx](../../src/ui/CharacterPortrait.tsx) | 角色立绘查表和取景变体，缺素材时回退 emoji。 |
| [EnemySprite.tsx](../../src/ui/EnemySprite.tsx) | 横向拼条待机立绘播放器。单帧也走同一套播放器，待机呼吸另由 `enemyArt` 的 idle 参数控制。 |
| [ManaCrystalIcon.tsx](../../src/ui/ManaCrystalIcon.tsx) | 光资源 3D SVG 图标，使用 `useId()` 隔离多个渐变实例。 |
| [StatusPips.tsx](../../src/ui/StatusPips.tsx) | 状态图标和层数展示。 |
| [SpriteFx.tsx](../../src/ui/SpriteFx.tsx) | 一次性序列帧播放器。 |
| [IaiSlashFx.tsx](../../src/ui/IaiSlashFx.tsx) | `iai-slash` 居合斩程序化特效；`impactMs` 需与 CSS 关键帧同步。 |
| [SkillCutInCard.tsx](../../src/ui/SkillCutInCard.tsx) | 出牌亮相卡面，挂在场景外，不受相机变换。 |
| [battleBg.ts](../../src/ui/battleBg.ts) | 地图 id 到战斗背景素材的查表和静态图预热。 |
| [mapArt.ts](../../src/ui/mapArt.ts) | 地图 id 到选层预览素材的查表和预热；与战斗背景表分离。 |
| [enemyArt.ts](../../src/ui/enemyArt.ts) | 敌人 id 到待机拼条、尺寸和 idle 参数的查表与预热。 |
| [cardArt.ts](../../src/ui/cardArt.ts) | 战斗卡 id 到卡面配图的查表。 |
| [eventArt.ts](../../src/ui/eventArt.ts) | 探索事件素材查表。 |
| [slotArt.ts](../../src/ui/slotArt.ts) | 战斗签符号卡面查表。 |
| [vfxSprites.ts](../../src/ui/vfxSprites.ts) | 命中特效序列帧 URL 列表和预热。 |

## 过场、动画与舞台

| 文件 | 作用 |
| --- | --- |
| [transitions.ts](../../src/ui/transitions.ts) | 过场预设、默认时长、按界面/路线解析；探索到战斗的裂纹涟漪时长只在这里配置。 |
| [transitionOrigin.ts](../../src/ui/transitionOrigin.ts) | 一次性缓存点击坐标，仅用于视觉过场，不进入 Zustand。 |
| [ScreenTransition.tsx](../../src/ui/ScreenTransition.tsx) | 串行执行旧界面出场 → 黑场停顿 → 新界面入场；避免两套 BattleScreen 同时挂载和视频双解码。快速切换由批次号使旧定时器失效。 |
| [BattleTransitionCurtain.tsx](../../src/ui/BattleTransitionCurtain.tsx) | 探索到战斗的裂纹 Canvas、主环和 View Transition 显现；幕布层固定且不向祖先施加 transform/filter。 |
| [stage.ts](../../src/ui/stage.ts) | 1920×1080 设计画布和等比 letterbox 缩放。画布内不使用 `vw` / `vh` 或窗口断点。 |
| [animations.ts](../../src/ui/animations.ts) | 战斗分镜、相机、顿帧/震屏、卡牌与招式动画预设。调演出节奏优先改这里。 |
| [ambience.ts](../../src/ui/ambience.ts) | 按地图登记粒子发射器、灯光闪烁和屏幕调色。 |
| [AmbienceLayer.tsx](../../src/ui/AmbienceLayer.tsx) | 双 Canvas 粒子和氛围层；隐藏页面暂停 rAF，减少动态效果时不挂载，调色层在场景外。 |
| [useCountUp.ts](../../src/ui/useCountUp.ts) | rAF 数值滚动；起点走 ref，避免每帧重启，减少动态效果下直接使用终值。 |
| [useIdleTwitch.ts](../../src/ui/useIdleTwitch.ts) | 低频随机敌人待机小动作，只存在于 UI 局部状态。 |
| [useTypewriter.ts](../../src/ui/useTypewriter.ts) | 探索事件文本逐字演出。 |
| [handFocusStore.ts](../../src/ui/handFocusStore.ts) | 手牌悬停/聚焦状态，独立于 `BattleScreen`，避免鼠标状态和战斗状态互相污染。 |
| [sharedPortrait.ts](../../src/ui/sharedPortrait.ts) | 编队与角色详情之间共享立绘元素的 View Transition 标识。 |

组件旁的同名 CSS 属于该组件；跨组件公共规则放在 `src/styles/`。涉及动画时要同时检查对应 `.css`，尤其是 `prefers-reduced-motion`、`transform` 占用和关键帧时长。

## 战斗设计画布与相机边界

战斗、主菜单和据点画布恒为 1920×1080，由 `useStageScale` 以 `k = min(容器宽/1920, 容器高/1080)` 等比缩放，超出部分留黑边。战斗舞台和底部 HUD 是兄弟矩形；`--hud-h` 直接决定敌人可见地面线，调整前必须复核站位。

战斗世界使用一个相机：背景、氛围和单位都在 `.battle-world` 内作为刚体一起变换。`transform` 负责空闲漂移，独立 `translate` 负责震屏，独立 `scale` 负责冲击缩放；不要让背景和单位分别套变换。相机全程使用设计 px，`getBoundingClientRect()` 得到屏幕 px 时，普通定位先经 `toDesignBox()` 换算；相机反投影则通过世界层矩形抵消画布缩放、当前相机和漂移。

我方队伍卡在 `.battle-hud` 外于战场世界之外，因此不参与推镜；攻击自身或友军时保持全景，只播放特效和震屏。调色层、HUD 和过场幕布是镜头/界面层，不应跟着场景相机移动。
