// ============================================================================
// 出牌动画预设表(纯 UI 表现层)。
// 每个 CardAnim 对应一套: 攻击/辅助分类 + 首击特效 emoji + 主色 + 时间轴参数。
// 具体视觉(受击抖动/斩击/火爆/柔光…)在 styles.css 里按 .vfx-<anim> / 反馈类实现。
// ============================================================================

import type { Card, CardAnim } from "../engine";
import type { EnemyMove } from "../data";

export interface AnimPreset {
  kind: "attack" | "support"; // attack: 目标受击特效; support: 目标柔和光效
  emoji: string; // 首击特效图形
  color: string; // 主色(用于闪光/冲击环/光晕/飘字着色)
  windup: number; // ms: 施法者前冲蓄力 → 命中时刻(伤害/特效在此刻触发)
  hold: number; // ms: 命中后特效(含飘字)完整播放所需时长
}

// ── 分镜运镜时间轴(ms)与相机缩放 ──
// 每一步(玩家出牌 / 敌人行动)统一走这套电影化时序: 施法者弹出 → 顿(全景) →
// 镜头推近并把目标居中放大 → 命中特效+飘字停留 → 镜头恢复+归位 → 下一步。
export const CINEMA = {
  beat: 500, // 角色弹出后, 相机停在全景的"顿"时长
  zoomIn: 380, // 相机推近并把目标居中的过渡时长
  hitHold: 1000, // 命中特效 + 伤害/治疗数字在聚焦镜头下的停留时长
  zoomOut: 380, // 相机恢复(退回全景)的过渡时长
  gap: 120, // 一步收尾到下一步之间的小间隔
  scale: 1.55, // 单目标聚焦时的相机放大倍数(多目标会按并集自适应收敛)
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
