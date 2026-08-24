// 敌人立绘素材集中登记处(与 cardArt.ts 同思路: 静态 import + 登记表)。
// 新增敌人立绘时只需跑 scripts/alpha-bbox.mjs 并把 sheet/body 粘贴到这里。
import scrapBotIdle from "@/assets/敌人立绘/废品机器人/idle.png";
import poleBotIdle from "@/assets/敌人立绘/电线杆机器人/idle.png";
import radioBotIdle from "@/assets/敌人立绘/收音机机器人/idle.png";
import sweepDroneIdle from "@/assets/敌人立绘/清扫机器人/idle.png";
import scrapMountainGuardianIdle from "@/assets/敌人立绘/垃圾山的守护者/idle.png";
import maintenanceSpiderIdle from "@/assets/敌人立绘/维修蜘蛛/idle.png";
import trafficLightBotIdle from "@/assets/敌人立绘/红绿灯机器人/idle.png";
import { preloadImage } from "@/ui/art/assetLoader";

// 横向拼条(strip)待机图。几何/时序集中在此(而非散落 CSS), 由 ui/EnemySprite.tsx 行内下发。
// 注意这与 animations.ts 的 SpritePreset 是两套并列机制: 那套是逐帧独立图、播一次即停的
// 命中特效; 这套是单张拼条 + background-position 无限循环的待机(可按 skipFrames 挑帧)。
export interface EnemySpriteDef {
  src: string;
  frames: number; // 拼条内的物理帧数(须能整除原图宽度); 与是否跳帧无关
  frameMs: number; // 每帧停留(ms)
  sheet: { w: number; h: number }; // 源图总尺寸
  // 展示框: 实际绘制到屏幕的源图矩形。省略=整帧; 拼条多帧时 w 通常是帧宽。
  view?: { x: number; y: number; w: number; h: number };
  // 主体框: 首帧 alpha 包围盒, 只用于归一化和定位, 不裁切展示构图。
  body: { x: number; y: number; w: number; h: number };
  skipFrames?: number[]; // 循环中要跳过的帧号(1-based, 即看图软件里的"第几张"); 省略=全播
  idle?: IdleDef; // 待机呼吸(见下); 省略则取 DEFAULT_IDLE
}

// 待机呼吸: 立绘本身之外再叠一层极缓的位移/倾斜循环, 专治 frames:1 的静态立绘"完全不动"。
// 由 ui/CombatantView.tsx 下发成 --idle-* 变量, 落在 ui/CombatantView.css 的 @keyframes idleBob 上。
//
// ⚠ 它挂在 .combatant-figure 的 transform 上, 不能挂 .enemy-sprite —— 后者的 animationName
// 由 EnemySprite.tsx 行内下发(拼条逐帧循环), 会把这条整个覆盖掉。
export interface IdleDef {
  bob?: number; // 上下浮动幅度(px)
  sway?: number; // 左右摆动幅度(px)
  tilt?: number; // 倾斜幅度(deg)
  dur?: number; // 一圈时长(ms)
  delay?: number; // 起始相位(ms, 负值=从中途开始)。逐个错开, 避免全场同频"齐步走"
}

// 未登记 idle 的敌人取这套最轻的默认值 —— 任何立绘都不会是死的。
const DEFAULT_IDLE: Required<Omit<IdleDef, "delay">> & { delay: number } = {
  bob: 3,
  sway: 0,
  tilt: 0,
  dur: 2800,
  delay: 0,
};

export function enemyIdle(def: EnemySpriteDef | undefined): typeof DEFAULT_IDLE {
  return { ...DEFAULT_IDLE, ...(def?.idle ?? {}) };
}

const ENEMY_ART: Record<string, EnemySpriteDef> = {
  // 9:16 与 1:1 素材都走同一模型: view 决定展示构图, body 决定主体高度归一。
  // 电线杆机器人已换成专属 9:16 立绘, 主体 1024×1546(瘦高), 体型差异由 encounters.ts 的 scale 承担。
  // 废品机器人使用 1:1 立绘, 主体 1719×1860; view 省略即整帧展示。
  // view 省略即整帧展示; body 仍由 alpha 包围盒提供脚线和体型基准。
  // frames: 1 是刻意的而非漏填 —— 拼条机制在单帧下自然退化成一张不动的背景图, 无需特判;
  // 此时 frameMs 只决定那条空转动画的时长, 不影响观感。
  "scrap-bot": {
    src: scrapBotIdle,
    frames: 1,
    frameMs: 1000,
    sheet: { w: 2048, h: 2048 },
    // 立绘换过图, body 按当前 idle.png 重新量过(scripts/alpha-bbox.mjs): 主体 1719×1860。
    body: { x: 165, y: 95, w: 1719, h: 1860 },
    // 机械微颤: 上下 3px + 0.6° 侧倾, 像内部还有个马达在转
    idle: { bob: 3, tilt: 0.6, dur: 2600 },
  },
  // 电线杆机器人: 已换成专属 9:16 立绘, 主体 1024×1546(瘦高), 体型差异由 encounters.ts 的 scale 承担。
  "pole-bot": {
    src: poleBotIdle,
    frames: 1,
    frameMs: 1000,
    sheet: { w: 1152, h: 2048 },
    body: { x: 63, y: 255, w: 1024, h: 1546 },
    // 这是为电线杆体型预留的呼吸手感, 与专属立绘匹配。
    idle: { bob: 0, sway: 2, tilt: 1.2, dur: 3400, delay: -900 },
  },
  // 收音机机器人: 1:1 素材完整展示; body 是 alpha 包围盒, 仅用于主体归一和脚线定位。
  "radio-bot": {
    src: radioBotIdle,
    frames: 1,
    frameMs: 1000,
    sheet: { w: 2048, h: 2048 },
    body: { x: 175, y: 186, w: 1809, h: 1619 },
    // 与 scrap-bot 同为机械微颤, 但错开相位与周期 —— 同场两台不该整齐划一地喘
    idle: { bob: 2.5, tilt: 0.5, dur: 3000, delay: -1400 },
  },
  // 清扫无人机: 先按项目现有单帧 2048×2048 素材约定登记, 主体框暂取整帧。
  "sweep-drone": {
    src: sweepDroneIdle,
    frames: 1,
    frameMs: 1000,
    sheet: { w: 2048, h: 2048 },
    body: { x: 0, y: 0, w: 2048, h: 2048 },
    idle: { bob: 4, sway: 2, tilt: 1, dur: 2200, delay: -500 },
  },
  // 维修蜘蛛: 1:1 素材整帧展示, 主体 1362×1222(横宽的爬行体型)。
  "maintenance-spider": {
    src: maintenanceSpiderIdle,
    frames: 1,
    frameMs: 1000,
    sheet: { w: 1536, h: 1536 },
    body: { x: 92, y: 191, w: 1362, h: 1222 },
    // 八足支撑: 上下几乎不动, 靠左右微摆 + 轻微侧倾模拟腿部调整重心
    idle: { bob: 1.5, sway: 3, tilt: 0.8, dur: 2400, delay: -600 },
  },
  // 红绿灯机器人: 1:1 素材整帧展示, 主体 1250×996; 底部留白 301px 由 body 归一自动吃掉。
  "traffic-light-bot": {
    src: trafficLightBotIdle,
    frames: 1,
    frameMs: 1000,
    sheet: { w: 1536, h: 1536 },
    body: { x: 181, y: 239, w: 1250, h: 996 },
    // 信号机: 立柱式单位, 只做极缓的左右摆, 像悬挂的灯箱被风带着晃
    idle: { bob: 2, sway: 2.5, tilt: 0.9, dur: 3600, delay: -1800 },
  },
  "scrap-mountain-guardian": {
    src: scrapMountainGuardianIdle,
    frames: 1,
    frameMs: 1000,
    sheet: { w: 768, h: 768 },
    body: { x: 0, y: 0, w: 768, h: 768 },
    idle: { bob: 2, sway: 1, tilt: 0.5, dur: 3200, delay: -700 },
  },
};

// 未登记立绘的敌人返回 undefined, 由 CombatantView 退回 emoji 渲染。
export function enemyArt(defId: string): EnemySpriteDef | undefined {
  return ENEMY_ART[defId];
}

export const ENEMY_ART_SOURCES: readonly string[] = [...new Set(
  Object.values(ENEMY_ART).map((def) => def.src),
)];

let warmed = false;

// 预热: strip 单文件约 640KB, 远超 Vite 4KB 内联阈值 → 独立请求, 不预热则进战斗首帧空白。
// 幂等, StrictMode 下 effect 双调用也安全(与 vfxSprites.ts warmVfxSprites 同写法)。
export function warmEnemyArt(): void {
  if (warmed) return;
  warmed = true;
  for (const src of ENEMY_ART_SOURCES) void preloadImage(src).catch(() => {});
}
