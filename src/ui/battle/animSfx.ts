// 动画音效时序表。提前量是「采样起音 → 视觉爆点」的对齐补偿；调整动画 impactMs 时无需改这里。

import type { CardAnim } from "@/engine";
import type { SfxId } from "@/ui/audio";
import { ANIM } from "./animations";

export interface AnimSfxCue {
  id: SfxId;
  leadMs: number;
}

type AnimSfxOverride = Partial<Record<"attack" | "impact", number>>;

const ANIM_SFX_OVERRIDES: Partial<Record<CardAnim, AnimSfxOverride>> = {
  "basic-slash": { attack: 80 },
};

export function attackSfxCue(anim: CardAnim): AnimSfxCue | null {
  if (ANIM[anim].kind !== "attack") return null;
  return {
    id: "cardPlay",
    leadMs: ANIM_SFX_OVERRIDES[anim]?.attack ?? 120,
  };
}

export function impactSfxCue(anim: CardAnim): AnimSfxCue | null {
  if (anim === "heal") {
    return { id: "heal", leadMs: 0 };
  }
  if (ANIM[anim].kind !== "attack") return null;
  return {
    id: "hit",
    leadMs: ANIM_SFX_OVERRIDES[anim]?.impact ?? 0,
  };
}