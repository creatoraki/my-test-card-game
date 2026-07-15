// 敌人立绘素材集中登记处(与 cardArt.ts 同思路: 静态 import + 登记表)。
// 新增敌人立绘时只需在此登记一次, 按 EnemyDef.id 作键。
import birdIdleStrip from "../assets/敌人立绘/怪异的鸟/idle-strip.png";

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
}

// 怪异的鸟: idle-strip.png 3060×212 = 12 帧 × 255×212。第 8、9 帧姿势不佳, 跳过后实播
// 1-7 + 10-12 共 10 帧, 一圈 10×120 = 1200ms。
// 渲染 180×150 —— 高度撑满 .combatant-figure(150px), 宽度按比例得 180, 比 .combatant 的
// 156px 宽出一截会向两侧溢出; 布局本就不裁切(留给特效溢出), 视觉上属预期内。
const ENEMY_ART: Record<string, EnemySpriteDef> = {
  "weird-bird": {
    src: birdIdleStrip,
    frames: 12,
    frameMs: 120,
    width: 180,
    height: 150,
    skipFrames: [8, 9],
  },
};

// 未登记立绘的敌人返回 undefined, 由 CombatantView 退回 emoji 渲染。
export function enemyArt(defId: string): EnemySpriteDef | undefined {
  return ENEMY_ART[defId];
}

const held: HTMLImageElement[] = []; // 持有引用, 避免解码结果被 GC
let warmed = false;

// 预热: strip 单文件约 640KB, 远超 Vite 4KB 内联阈值 → 独立请求, 不预热则进战斗首帧空白。
// 幂等, StrictMode 下 effect 双调用也安全(与 vfxSprites.ts warmVfxSprites 同写法)。
export function warmEnemyArt(): void {
  if (warmed) return;
  warmed = true;
  for (const def of Object.values(ENEMY_ART)) {
    const img = new Image();
    img.src = def.src;
    void img.decode().catch(() => {}); // 解码失败不阻断渲染
    held.push(img);
  }
}
