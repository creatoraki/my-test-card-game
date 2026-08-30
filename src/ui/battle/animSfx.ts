// 动画音效时序表。提前量是「采样起音 → 视觉爆点」的对齐补偿；调整动画 impactMs 时无需改这里。

import type { CardAnim } from "@/engine";
import type { SfxId } from "@/ui/audio";
import { ANIM } from "./animations";

export interface AnimSfxCue {
  id: SfxId;
  leadMs: number;
  pitch?: number;
  volume?: number;
}

interface AnimSfxOverride {
  attack?: AnimSfxCue | null;
  impact?: AnimSfxCue | null;
}

const ANIM_SFX_OVERRIDES: Partial<Record<CardAnim, AnimSfxOverride>> = {
  "basic-slash": { attack: { id: "cardPlay", leadMs: 80 } },
  // 锐利刀锋斩整段就是这条采样: 挂载瞬间起播, 采样自带的 470ms 撞击峰经 pitch 1.4 后
  // 恰好落在 336ms 的视觉爆点上(leadMs = KEEN_PLAY.impact ⇒ BattleScreen 排到 hitAt + 0)。
  // 采样已含撞击峰与金属余鸣, 故不再叠 cardPlay(出刀) 与 hit(受击)。
  "keen-edge": {
    attack: { id: "keenEdge", leadMs: 336, pitch: 1.4, volume: 0.9 },
    impact: null,
  },
};

export function attackSfxCue(anim: CardAnim): AnimSfxCue | null {
  if (ANIM[anim].kind !== "attack") return null;
  const override = ANIM_SFX_OVERRIDES[anim];
  if (override && "attack" in override) return override.attack;
  return {
    id: "cardPlay",
    leadMs: 120,
  };
}

export function impactSfxCue(anim: CardAnim): AnimSfxCue | null {
  if (anim === "heal") {
    return { id: "heal", leadMs: 0 };
  }
  if (anim === "shield") {
    return { id: "shield", leadMs: 0 };
  }
  if (ANIM[anim].kind !== "attack") return null;
  const override = ANIM_SFX_OVERRIDES[anim];
  if (override && "impact" in override) return override.impact;
  return {
    id: "hit",
    leadMs: 0,
  };
}