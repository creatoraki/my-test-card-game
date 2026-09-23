# UI：顶层、美术、音频与通用 hooks

路径：`src/ui/app`、`ui/art`、`ui/audio`、`ui/hooks`、`ui/menu`、`ui/elevator`、`ui/result`。

## 顶层过场 `ui/app`

| 文件 | 作用 |
| --- | --- |
| [ScreenTransition/](../../src/ui/app/ScreenTransition/ScreenTransition.tsx) | 界面切换的编排：旧界面出场 → 黑场停顿 → 新界面入场。用 render 回调而不是 children，这样出场期间还能继续渲染旧界面。 |
| [transitions.ts](../../src/ui/app/transitions.ts) | 过场动效预设表，也是时长常量的唯一来源；视觉部分在 `ScreenTransition.module.css`。 |
| [transitionOrigin.ts](../../src/ui/app/transitionOrigin.ts) | 记录触发过场的点击坐标，只用一次，读取后立即清空。不进 store。 |
| [BattleTransitionCurtain/](../../src/ui/app/BattleTransitionCurtain/BattleTransitionCurtain.tsx) | 探索进入战斗时的涟漪幕布，分出场和入场两个阶段。 |
| [BattleEntryGrading/](../../src/ui/app/BattleEntryGrading/BattleEntryGrading.tsx) | 战斗落地时的余韵层，位于涟漪揭幕和战场出现之间。 |
| [StageCanvas/](../../src/ui/app/StageCanvas/StageCanvas.tsx) | 1920×1080 设计画布的容器组件（letterbox 加缩放）。 |
| [installGameCursor.ts](../../src/ui/app/installGameCursor.ts) | 全局光标：预加载三种状态，左键按下的反馈至少显示 120 毫秒。 |

## 美术登记表 `ui/art`

数据层不接触素材，“id → 图片”的对应关系全部登记在这里。新增素材只需在对应表里登记一次。

| 文件 | 作用 |
| --- | --- |
| [assetLoader.ts](../../src/ui/art/assetLoader.ts) / [assetPreloader.ts](../../src/ui/art/assetPreloader.ts) | 素材预加载：图片限 2 个并发并利用空闲时间加载，视频只等首帧；对外提供预加载进度快照。⚠ 要预加载的 URL 必须登记在下面的表中。 |
| [sceneArt.ts](../../src/ui/art/sceneArt.ts) | 主菜单背景视频、电梯视频、标题图。 |
| [cardArt.ts](../../src/ui/art/cardArt.ts) / [enemyArt.ts](../../src/ui/art/enemyArt.ts) / [itemArt.tsx](../../src/ui/art/itemArt.tsx) | 卡牌大图、敌人立绘（附带用 `alpha-bbox.mjs` 测出的内容框）、物品图标（没有美术的物品回退到内联线框 SVG）。 |
| [statusArt.ts](../../src/ui/art/statusArt.ts) / [statusAccent.ts](../../src/ui/art/statusAccent.ts) / [buffArt.ts](../../src/ui/art/buffArt.ts) | 战斗状态图标及其主题色；非战斗状态的徽记（培育、组装部件、药剂）。 |
| [battleBg.ts](../../src/ui/art/battleBg.ts) / [mapArt.ts](../../src/ui/art/mapArt.ts) | 按地图 id 登记的战斗背景和地图预览图。 |
| [corridorArt.ts](../../src/ui/art/corridorArt.ts) / [corridorPlayerArt.ts](../../src/ui/art/corridorPlayerArt.ts) / [corridorPlayerFrames.ts](../../src/ui/art/corridorPlayerFrames.ts) | 探索场景的道具缩放和素材、探索角色的逐帧动画。 |
| `ecoArk*.ts` | 生态方舟的建筑、敌人、道具和近景素材。 |
| [eventDossierArt.ts](../../src/ui/art/eventDossierArt.ts) / [eventArt.ts](../../src/ui/art/eventArt.ts) | 事件档案插图。⚠ `eventArt` 按旧节点事件类型登记，目前全部是占位图。 |
| [moduleGlyphs.tsx](../../src/ui/art/moduleGlyphs.tsx) + `moduleGlyphs*.tsx` | 每件模组专属的 SVG 徽记，按精算师、炼金术士、1 阶通用分文件维护。 |
| [shopArt.ts](../../src/ui/art/shopArt.ts) / [rarityArt.ts](../../src/ui/art/rarityArt.ts) / [techTreeArt.ts](../../src/ui/art/techTreeArt.ts) | 商店货位边框、稀有度水晶、科技节点的金属纹样。 |

## 音频 `ui/audio`

| 文件 | 作用 |
| --- | --- |
| [bgmTracks.ts](../../src/ui/audio/bgmTracks.ts) / [bgmPlayer.ts](../../src/ui/audio/bgmPlayer.ts) | BGM 曲目表（据点、探索、战斗、电梯）；播放器负责淡入淡出和音量。 |
| [audioPref.ts](../../src/ui/audio/audioPref.ts) | 音频偏好的存取：内存值 + localStorage + 订阅通知。只负责存储，不直接操作音频。 |
| [sfx/](../../src/ui/audio/sfx/index.ts) | 音效：`sfxSamples` 采样、`sfxSynth` 合成、`sfxRecipes` 合成配方、`sfxPlayer` 播放、`sfxDelegate` 给按钮和链接统一挂点击音效。 |

动画和音效的对齐表在 [battle/animSfx.ts](../../src/ui/battle/animSfx.ts)。

## 通用 hooks `ui/hooks`

| 文件 | 作用 |
| --- | --- |
| [stage.ts](../../src/ui/hooks/stage.ts) | 设计画布恒为 1920×1080，由 `--stage-scale` 等比缩放。所有 px 都是设计 px。 |
| [useBgm.ts](../../src/ui/hooks/useBgm.ts) / [useSfx.ts](../../src/ui/hooks/useSfx.ts) | 按当前界面切换 BGM；安装全局音效代理。 |
| [useGameAssetPreload.ts](../../src/ui/hooks/useGameAssetPreload.ts) | 订阅素材预加载的进度。 |
| [useCountUp.ts](../../src/ui/hooks/useCountUp.ts) / [useChangePulse.ts](../../src/ui/hooks/useChangePulse.ts) / [useTypewriter.ts](../../src/ui/hooks/useTypewriter.ts) | 数字从旧值滚动到新值、数值变化时的脉冲、逐字打字机效果。 |
| [useSwapTransition.ts](../../src/ui/hooks/useSwapTransition.ts) / [useIdleTwitch.ts](../../src/ui/hooks/useIdleTwitch.ts) | 内容切换时的离场和入场阶段；敌人待机时随机抖动。 |

## 页面

| 目录 | 作用 |
| --- | --- |
| [menu/MenuScreen](../../src/ui/menu/MenuScreen/MenuScreen.tsx) + [MenuStartButton](../../src/ui/menu/MenuStartButton/MenuStartButton.tsx) | 主菜单：显示预加载进度，就绪后进入据点。开始按钮用同一张 PNG 的透明通道做遮罩，叠三层特效。 |
| [elevator/ElevatorScene](../../src/ui/elevator/ElevatorScene/ElevatorScene.tsx) | 出击时的电梯下降视频过场，结束后调用 `runStore.finishRide`。环境变量 `isTest=true` 时跳过。 |
| [result/EndScreen](../../src/ui/result/EndScreen/EndScreen.tsx) | 远征结算页，通关、撤离、团灭共用。`endSummary.ts` 汇总远征记录，`endChoreo.ts` 负责演出时序；`parts/` 包括结论横幅、队伍名单、战利品、通关奖励、奖杯栏、事件掉落带。 |
