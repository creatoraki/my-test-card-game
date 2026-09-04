// ============================================================================
// 命中表现的展开 —— 把引擎的 AnimHit[](含逐段明细)翻译成:
//   ① 每个单位的飘字序列(多段伤害 = 多个数字, 原地依次弹出)
//   ② HIT / heal 音效的排期(多段逐段响, AOE 每个目标都响)
//
// 从 BattleScreen.runSteps 里拆出来的纯函数模块: 那边已经 1100+ 行, 而这段逻辑
// 只依赖入参、不碰任何 React 状态, 单独放这里便于调参与复用。
// ============================================================================

import type { AnimHit, CardAnim } from "@/engine";
import { ANIM, type FloatText, type HitFx } from "./animations";
import type { AnimSfxCue } from "./animSfx";

// 多段之间的节奏。飘字比音效慢一拍: 数字要看得清, 音效要连成"哒哒哒"。
export const HIT_STAGGER = {
  float: 280, // 同一目标的相邻两段飘字间隔(ms)上限
  sfx: 120, // 相邻两声命中音间隔(ms)。必须 > playSfx 的 30ms 节流, 否则后面几声被丢弃
  // 单次命中最多排多少条飘字/多少声音效。超出部分丢弃 —— 十几段的攻击再逐条排,
  // 尾巴会拖过特效的 hold 被硬卸载, 听觉上也糊成一片。
  maxFloats: 8,
  maxSfx: 10,
} as const;

// 第 2 声起逐次衰减的音量系数, 收敛到 MIN_GAIN。
// AOE 打 4 个敌人时若每声等响, 4 条同采样几乎同时叠加会顶到压缩器, 听感是一团轰鸣。
const SFX_GAIN_FALLOFF = 0.82;
const SFX_MIN_GAIN = 0.55;
const FLOAT_STAGGER_MIN = 70;
const FLOAT_SAFE_MARGIN = 40;

function gainAt(index: number): number {
  return Math.max(SFX_MIN_GAIN, SFX_GAIN_FALLOFF ** index);
}

function floatStagger(anim: CardAnim, count: number): number {
  if (count <= 1) return 0;
  const preset = ANIM[anim];
  const budget = preset.hold - (preset.proc?.impactMs ?? 0) - (preset.proc?.floatMs ?? 0) - FLOAT_SAFE_MARGIN;
  return Math.max(FLOAT_STAGGER_MIN, Math.min(HIT_STAGGER.float, budget / (count - 1)));
}

// 把一个目标的命中拆成飘字序列。
// 攻击: 每段一个 -N(该段闪避则 MISS); 辅助: 每段一个 +N。
// 没有 parts(旧路径/兜底目标)时退化为单条, 与改造前逐帧一致。
function floatsOf(hit: AnimHit, anim: CardAnim): FloatText[] {
  const kind = ANIM[anim].kind;
  const parts = hit.parts ?? [{ hpDelta: hit.hpDelta, missed: hit.missed }];
  const floats: FloatText[] = [];
  for (const part of parts) {
    if (floats.length >= HIT_STAGGER.maxFloats) break;
    let text: string | null = null;
    let tone: FloatText["tone"] = "dmg";
    if (part.missed) {
      text = "MISS";
      tone = "miss";
    } else if (kind === "attack" && part.hpDelta > 0) {
      text = part.crit ? `-${part.hpDelta}!` : `-${part.hpDelta}`;
    } else if (kind === "support" && part.hpDelta < 0) {
      text = `+${-part.hpDelta}`;
      tone = "heal";
    }
    // hpDelta 为 0 且未闪避 = 只吃了护盾/状态, 照旧只闪特效不飘字。
    if (text != null) floats.push({ text, tone, delayMs: 0, crit: part.crit });
  }
  const stagger = floatStagger(anim, floats.length);
  floats.forEach((float, index) => {
    float.delayMs = index * stagger;
    if (floats.length > 1) float.dx = index % 2 === 0 ? -40 : 40;
  });
  return floats;
}

// 构建本次命中的「单位 → 特效」表, 直接交给 setHits。
export function buildHitFx(hits: readonly AnimHit[], anim: CardAnim, seq: number): Record<string, HitFx> {
  const map: Record<string, HitFx> = {};
  for (const hit of hits) map[hit.id] = { anim, seq, floats: floatsOf(hit, anim) };
  return map;
}

export interface SfxTick {
  delayMs: number; // 相对命中爆点的延迟
  damage: number; // 供 playSfx 按伤害量抬音高(治疗恒为 0)
  volume: number;
}

// 命中音的排期: 每个目标 × 每段各一声。
//
// 排序刻意「先横向后纵向」——先把所有目标的第 1 段排完, 再排各目标的第 2 段,
// 与引擎 effects.ts 里「段外层 × 目标内层」的结算顺序一致: 三段 AOE 听起来是
// 三轮扫射, 而不是逐个敌人挨个打完。
export function impactSfxPlan(hits: readonly AnimHit[], cue: AnimSfxCue, anim: CardAnim): SfxTick[] {
  const kind = ANIM[anim].kind;
  // 每个目标的有效段数: 闪避的段不出声(视觉上是 MISS, 配一声受击音会很怪)。
  const rows = hits.map((hit) => (hit.parts ?? [{ hpDelta: hit.hpDelta, missed: hit.missed }]).filter((part) => !part.missed));
  const maxRound = Math.max(0, ...rows.map((row) => row.length));
  const ticks: SfxTick[] = [];
  for (let round = 0; round < maxRound; round++) {
    for (const row of rows) {
      const part = row[round];
      if (!part) continue;
      // 治疗的 hpDelta 是负数, 传 0 让 heal 音高不受量值影响(与改造前一致)。
      const damage = kind === "attack" ? Math.max(0, part.hpDelta) : 0;
      ticks.push({ delayMs: 0, damage, volume: (cue.volume ?? 1) * gainAt(ticks.length) });
      if (ticks.length >= HIT_STAGGER.maxSfx) return stagger(ticks);
    }
  }
  return stagger(ticks);
}

function stagger(ticks: SfxTick[]): SfxTick[] {
  return ticks.map((tick, index) => ({ ...tick, delayMs: index * HIT_STAGGER.sfx }));
}
