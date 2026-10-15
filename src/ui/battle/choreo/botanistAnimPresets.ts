// ============================================================================
// 植物学家出牌动画预设(GLSL, fx/BotanistFx), 由 animations.ts 的 ANIM 展开。
//   · impactMs / 总长与 fx/BotanistFx/botanistFxTimeline.ts 同源; hold = max(总长, 爆点 + 飘字) + 100,
//     多留的 100ms 给多段伤害的飘字错拍;
//   · 藤蔓缠绕为全场级, 置 stage: 只由 ScreenFxLayer 挂一份;
//   · 压暗与闪光都画在着色器内, 不配 screenFx; 震屏/顿帧归相机按 shake 选档。
// ============================================================================

import { BOTANIST_TIMELINE, type BotanistFxKind } from "@/ui/battle/fx/BotanistFx/botanistFxTimeline";
import type { AnimPreset } from "./animations";

const FLOAT_MS = 520;
const STAGE_FLOAT_MS = 600;

function botanist(kind: BotanistFxKind, color: string, shake: 1 | 2, stage = false): AnimPreset {
  const { impact, total } = BOTANIST_TIMELINE[kind];
  const floatMs = stage ? STAGE_FLOAT_MS : FLOAT_MS;
  return {
    kind: "attack",
    color,
    proc: { impactMs: impact, floatMs, damageAtImpact: true },
    stage: stage || undefined,
    windup: 190,
    hold: Math.max(total, impact + floatMs) + 100,
    shake,
  };
}

export const BOTANIST_ANIM: Record<BotanistFxKind, AnimPreset> = {
  // 棘藤箭: 藤箭疾射 → 钉入后棘刺炸开 + 飞叶。弓系低费单体主力, 轻一档。
  "thorn-arrow": botanist("thorn-arrow", "#8fd45a", 1),
  // 荆棘鞭笞: 荆鞭抽打 → 刺痕撕开。
  "thorn-whip": botanist("thorn-whip", "#b8e04c", 1),
  // 食人花噬咬: 獠牙花冠张开 → 光圈式合口 + 咀嚼。
  "flytrap-bite": botanist("flytrap-bite", "#e8506e", 2),
  // 毒孢菌爆: 菌褶盘绽开 → 盘裂喷流 + 毒云毒泡。
  "spore-bloom": botanist("spore-bloom", "#b07ae8", 2),
  // 藤蔓缠绕(全场级): 种子法阵 + 根脉 → 每个目标三道荆棘藤环 + 六瓣封印花。
  "vine-tide": botanist("vine-tide", "#5fd27c", 2, true),
};
