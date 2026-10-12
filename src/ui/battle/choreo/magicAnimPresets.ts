// ============================================================================
// 魔法系出牌动画预设(预言家 / 咒术师), 由 animations.ts 的 ANIM 展开。
//   · impactMs / 总长与 fx/MagicFx/magicFxTimeline.ts 同源; hold = max(总长, 爆点 + 飘字) + 100,
//     多留的 100ms 给多段伤害的飘字错拍;
//   · 全场级两种(星幕 / 怨灵潮)置 stage: 只由 ScreenFxLayer 挂一份 MagicStageFx;
//   · 压暗与闪光都画在着色器内(只罩目标周围), 不配 screenFx; 震屏/顿帧归相机按 shake 选档。
//   · 施咒卡(不造成伤害)同样走这里, kind 仍为 attack: 目标演受击反应, 与 debuff 的约定一致。
// ============================================================================

import { MAGIC_TIMELINE, type MagicFxKind } from "@/ui/battle/fx/MagicFx/magicFxTimeline";
import type { AnimPreset } from "./animations";

const PROPHET_COLOR = "#b28cff"; // 星紫, 与角色主题色同源
const HEXER_COLOR = "#59cbbb"; // 咒青, 与角色主题色同源
const FLOAT_MS = 520;
const STAGE_FLOAT_MS = 600;

function magic(kind: MagicFxKind, color: string, shake: 1 | 2, stage = false): AnimPreset {
  const { impact, total } = MAGIC_TIMELINE[kind];
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

export const MAGIC_ANIM: Record<MagicFxKind, AnimPreset> = {
  // —— 预言家 ——
  // 碎星矢: 星矢疾射 → 六边晶环 + 晶片迸散。低费单体主力, 轻一档。
  "star-shard": magic("star-shard", PROPHET_COLOR, 1),
  // 双星轨: 一金一紫互绕逼近 → 撞合双轨道环。
  "twin-orbit": magic("twin-orbit", PROPHET_COLOR, 1),
  // 星陨: 准星锁定 → 陨星斜坠 → 五芒星光爆。
  "meteor-fall": magic("meteor-fall", PROPHET_COLOR, 2),
  // 星盘裁决: 星盘展开坍缩 → 天光柱劈落 → 六芒星冲击。
  "astral-verdict": magic("astral-verdict", PROPHET_COLOR, 2),
  // 引力透镜: 黑核 + 吸积盘 + 螺旋星臂 → 坍缩爆环。
  "gravity-lens": magic("gravity-lens", PROPHET_COLOR, 2),
  // 星幕(全场级): 极光星幕 + 流星雨, 每个目标各挨一颗主陨星。
  "star-curtain": magic("star-curtain", PROPHET_COLOR, 2, true),
  // —— 咒术师 ——
  // 咒钉: 秽气方印 → 咒钉钉入 → 裂纹 + 厄运之眼。
  "curse-nail": magic("curse-nail", HEXER_COLOR, 1),
  // 符咒: 黄符拍身 → 方印锁链 → 青火焚符。
  "talisman-seal": magic("talisman-seal", HEXER_COLOR, 1),
  // 缠丝怨咒: 怨丝环勒紧 → 咒眼睁开 → 崩丝。
  "binding-hex": magic("binding-hex", HEXER_COLOR, 1),
  // 死兆钟盘: 双针归子时 → 盘面炸碎 + 三重钟鸣。
  "doom-clock": magic("doom-clock", HEXER_COLOR, 2),
  // 魂魄抽离: 采样立绘的魂影被扯离 → 魂丝崩断 → 残片卷入漩涡。
  "soul-rend": magic("soul-rend", HEXER_COLOR, 2),
  // 怨灵潮(全场级): 怨灵群横扫 → 每个目标被大怨灵扑中撕开爪痕。
  "spirit-tide": magic("spirit-tide", HEXER_COLOR, 2, true),
};

/** 是否魔法系动画: 出牌指定了专属魔法特效时, 痛楚提前结算不再改用通用痛楚表现。 */
export function isMagicAnim(anim: string): anim is MagicFxKind {
  return anim in MAGIC_ANIM;
}
