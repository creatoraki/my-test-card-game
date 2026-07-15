// ============================================================================
// 出牌动画预设表(纯 UI 表现层)。
// 每个 CardAnim 对应一套: 攻击/辅助分类 + 首击特效(emoji 或序列帧) + 主色 + 时间轴参数。
// 具体视觉(受击抖动/斩击/火爆/柔光…)在 styles.css 里按 .vfx-<anim> / 反馈类实现。
// ============================================================================

import type { Card, CardAnim } from "../engine";
import type { EnemyMove } from "../data";
import { SWORD_FALL_FRAMES } from "./vfxSprites";

// 序列帧特效参数。几何/时序集中在此(而非散落 CSS), 保证「登记一次」即可调。
// 由 ui/SpriteFx.tsx 行内下发给逐帧 <img>。
export interface SpritePreset {
  frames: readonly string[]; // 逐帧图 URL(按播放顺序)
  frameMs: number; // 每帧停留(ms); frames.length * frameMs 须 ≤ CINEMA.hitHold, 否则末尾帧会被卸载截断
  width: number; // 渲染宽(px)
  height: number; // 渲染高(px); 须与原图比例一致
  anchorTop: number; // .vfx 图层相对卡面顶边的下移量(px), 决定冲击点落在目标何处
  anchorY: number; // 冲击点在帧内的纵向位置(0~1), 用于把它对到锚点
  impactMs: number; // 挂载 → 真正砸中的偏移(ms), 用于同步受击抖动/冲击环
}

export interface AnimPreset {
  kind: "attack" | "support"; // attack: 目标受击特效; support: 目标柔和光效
  emoji?: string; // 首击特效图形(无 sprite 时使用)
  sprite?: SpritePreset; // 序列帧特效(存在时优先于 emoji)
  color: string; // 主色(用于闪光/冲击环/光晕/飘字着色)
  windup: number; // ms: 施法者前冲蓄力 → 命中时刻(伤害/特效在此刻触发)
  hold: number; // ms: 命中后特效(含飘字)完整播放所需时长
}

// ── 分镜运镜时间轴(ms)与相机参数 ──
// 每一步(玩家出牌 / 敌人行动)统一走这套电影化时序: 施法者弹出 → 顿(全景) →
// 镜头推近并把目标居中放大 → 命中特效+飘字停留 → 镜头恢复+归位 → 下一步。
//
// 相机是「整屏场景相机」而非某个元素的缩放: 前景(.battle-stage)与背景(.battle-bg-video)
// 接受同一个屏幕空间仿射变换, 背景按 bgParallax 衰减 → 推近时森林一起动, 且近快远慢有纵深。
// 换算细节见 BattleScreen.tsx 的 computeCamera。
export const CINEMA = {
  beat: 500, // 角色弹出后, 相机停在全景的"顿"时长
  zoomIn: 380, // 相机推近并把目标居中的过渡时长(前景/背景共用, 两者靠同一时序保持同步)
  hitHold: 1000, // 命中特效 + 伤害/治疗数字在聚焦镜头下的停留时长
  zoomOut: 380, // 相机恢复(退回全景)的过渡时长
  gap: 120, // 一步收尾到下一步之间的小间隔
  scale: 1.55, // 单目标聚焦时的前景放大倍数(多目标会按并集自适应收敛)
  // 背景视差系数: 0=背景完全不动(改造前的老行为), 1=与前景完全同步(等效摄影机"变焦")。
  // 取 0.35 = 摄影机"推轨(dolly)": 前景 1.55x 时背景约 1.19x, 有纵深且背景放大少、更清晰。
  bgParallax: 0.35,
  // ── 技能卡「亮相」演出(仅玩家出牌): 镜头聚焦目标后、命中特效前, 卡面从左侧飞入停留再飞出 ──
  cardIn: 280, // 卡面从屏幕左侧飞入 + 渐显
  cardHold: 700, // 卡面停在距左侧 200px 处停留
  cardOut: 320, // 卡面往右飞出 + 渐隐
} as const;

export const ANIM: Record<CardAnim, AnimPreset> = {
  // —— 攻击系 ——
  slash: { kind: "attack", emoji: "💥", color: "#ff6b6b", windup: 190, hold: 660 },
  shot: { kind: "attack", emoji: "🎯", color: "#ffd43b", windup: 150, hold: 640 },
  fire: { kind: "attack", emoji: "🔥", color: "#ff922b", windup: 210, hold: 720 },
  ice: { kind: "attack", emoji: "❄️", color: "#66d9e8", windup: 210, hold: 720 },
  lightning: { kind: "attack", emoji: "⚡", color: "#a5d8ff", windup: 130, hold: 600 },
  poison: { kind: "attack", emoji: "☠️", color: "#94d82d", windup: 190, hold: 720 },
  // 魔剑坠落(序列帧): 12 帧 × 70ms = 840ms, 在 hitHold(1000ms) 内播完, 不循环。
  // height 460 ≈ 4.8 倍身位; 帧上方约 247px(帧高 53.7%)是 00-02 的凝聚段(剑位于帧内
  // 5%~37%), 露出多少取决于敌人头顶的净空。裁切边界现在在 .screen.battle(整屏)而非
  // 舞台, 故凝聚段可向上越过舞台顶边、延伸到顶栏区域, 比改造前多露一截;
  // 要让它完整可见仍需加 styles.css 里 .enemy-row 的 padding-top(现 42px), 代价是
  // 敌人不再贴舞台顶 —— 目前维持现状, 属「不动布局换更大剑」的明确取舍, 非 bug。
  // 调 impactMs 时记得同步改 styles.css 里 swordFallRing 的百分比。
  "sword-fall": {
    kind: "attack",
    color: "#ff4d4d", // 与素材红色剑光同色系(供闪白/冲击环/飘字着色)
    sprite: {
      frames: SWORD_FALL_FRAMES,
      frameMs: 70,
      width: 192, // 243:583 原始比例
      height: 460,
      anchorTop: 88, // 立绘(96px)脚下 = 剑插地处; anchorY 是帧内比例, 故放大无需动此值
      anchorY: 0.82,
      impactMs: 210, // 约第 3 帧砸中
    },
    windup: 210,
    hold: 840,
  },
  // —— 辅助系(柔和光效) ——
  heal: { kind: "support", emoji: "💚", color: "#69db7c", windup: 200, hold: 720 },
  shield: { kind: "support", emoji: "🛡️", color: "#6ea8fe", windup: 200, hold: 700 },
  buff: { kind: "support", emoji: "✨", color: "#ffd43b", windup: 200, hold: 700 },
};

// 单个单位当前正在播放的受击/首击特效(由 BattleScreen 在命中时刻下发)。
export interface HitFx {
  anim: CardAnim;
  float?: { text: string; tone: "dmg" | "heal" }; // 飘字(伤害/治疗量), 可选
  seq: number; // 递增序号, 用于强制重放动画
}

// 卡牌 → 动画类型。优先卡牌显式声明的 anim, 否则按效果兜底推断。
export function cardAnim(card: Card): CardAnim {
  if (card.anim) return card.anim;
  const has = (t: string) => card.effects.some((e) => e.type === t);
  if (has("DAMAGE")) return "slash";
  if (has("HEAL")) return "heal";
  if (has("GAIN_BLOCK")) return "shield";
  return "buff";
}

// 敌人招式 → 动画类型。优先招式显式声明的 anim, 否则按效果兜底推断(与 cardAnim 同规则)。
export function moveAnim(move: EnemyMove): CardAnim {
  if (move.anim) return move.anim;
  const has = (t: string) => move.effects.some((e) => e.type === t);
  if (has("DAMAGE")) return "slash";
  if (has("HEAL")) return "heal";
  if (has("GAIN_BLOCK")) return "shield";
  return "buff";
}
