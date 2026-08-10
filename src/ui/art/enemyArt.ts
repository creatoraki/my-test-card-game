// 敌人立绘素材集中登记处(与 cardArt.ts 同思路: 静态 import + 登记表)。
// 新增敌人立绘时只需在此登记一次, 按 EnemyDef.id 作键。
import scrapBotIdle from "@/assets/敌人立绘/废品机器人/idle-cut.png";
import poleBotIdle from "@/assets/敌人立绘/电线杆机器人/idle-cut.png";
import radioBotIdle from "@/assets/敌人立绘/收音机机器人/idle-cut.png";
import { preloadImage } from "@/ui/art/assetLoader";

// 横向拼条(strip)待机图。几何/时序集中在此(而非散落 CSS), 由 ui/EnemySprite.tsx 行内下发。
// 注意这与 animations.ts 的 SpritePreset 是两套并列机制: 那套是逐帧独立图、播一次即停的
// 命中特效; 这套是单张拼条 + background-position 无限循环的待机(可按 skipFrames 挑帧)。
export interface EnemySpriteDef {
  src: string;
  frames: number; // 拼条内的物理帧数(须能整除原图宽度); 与是否跳帧无关
  frameMs: number; // 每帧停留(ms)
  width: number; // 单帧渲染宽(px)
  height: number; // 单帧渲染高(px); 须与原图单帧比例一致
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
  // 废品机器人: 静态单帧立绘(idle-cut.png 604×552, 由 scripts/chroma-cut.mjs 抠自 idle.png)。
  // frames: 1 是刻意的而非漏填 —— 拼条机制在单帧下自然退化成一张不动的背景图, 无需特判;
  // 此时 frameMs 只决定那条空转动画的时长, 不影响观感。
  // 渲染 164×150 —— 高度撑满 .combatant-figure(150px), 宽度按 604/552 等比得 164。
  "scrap-bot": {
    src: scrapBotIdle,
    frames: 1,
    frameMs: 1000,
    width: 164,
    height: 150,
    // 机械微颤: 上下 3px + 0.6° 侧倾, 像内部还有个马达在转
    idle: { bob: 3, tilt: 0.6, dur: 2600 },
  },
  // 电线杆机器人: 静态单帧立绘(idle-cut.png 431×905, 细高型)。同 scrap-bot 单帧写法。
  // 渲染 71×150 —— 高度撑满 .combatant-figure(150px), 宽度按 431/905 等比得 71。
  // 体型"高"的观感靠 encounters.ts 的 scale 旋钮拉大, 立绘表只管一帧的几何。
  "pole-bot": {
    src: poleBotIdle,
    frames: 1,
    frameMs: 1000,
    width: 71,
    height: 150,
    // 细高型: 不上下颠(会像在蹦), 改成左右轻摆 + 1.2° 倾, 像被风吹的电线杆
    idle: { bob: 0, sway: 2, tilt: 1.2, dur: 3400, delay: -900 },
  },
  // 收音机机器人: 静态单帧立绘(idle-cut.png 719×767, 近方形)。同 scrap-bot 单帧写法。
  // 渲染 141×150 —— 高度撑满 .combatant-figure(150px), 宽度按 719/767 等比得 141。
  "radio-bot": {
    src: radioBotIdle,
    frames: 1,
    frameMs: 1000,
    width: 141,
    height: 150,
    // 与 scrap-bot 同为机械微颤, 但错开相位与周期 —— 同场两台不该整齐划一地喘
    idle: { bob: 2.5, tilt: 0.5, dur: 3000, delay: -1400 },
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
