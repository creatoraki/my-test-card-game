import type { CardAnim } from "@/engine";
import { ANIM } from "@/ui/battle/animations";
import type { SpringTuning } from "./spring";

export type ShotKind = "none" | "light" | "normal" | "heavy" | "aoe" | "kill" | "iai" | "blade" | "tri" | "blood" | "neon" | "triple" | "foe" | "foeCast";

export interface ShotPreset {
  kind: ShotKind;
  scale: number;
  fit: number;
  yaw: number;
  pitch: number;
  roll: number;
  rig: Partial<RigTuning>;
  lead: number;
  hold: number;
  punch: number;
  // 命中冲量的幅度(世界 px 量级),沿 actor→target 轴注入 useCameraRig.impact;
  // 实际峰值约为该值的 0.6 倍,见 spring.ts 的 Impulse 包络。
  shake: number;
  creep: number;
  hitstop: number;
  slowmo?: { scale: number; ms: number };
}

export interface RigTuning {
  s: SpringTuning;
  dx: SpringTuning;
  dy: SpringTuning;
  yaw: SpringTuning;
  pitch: SpringTuning;
  roll: SpringTuning;
}

export interface ShotContext {
  anim: CardAnim;
  targetCount: number;
  shake: 0 | 1 | 2;
  damageRatio: number;
  isKill: boolean;
  targetInStage: boolean;
  actorIsEnemy: boolean;
}

const SOFT: SpringTuning = { stiffness: 100, damping: 20 };
const QUICK: SpringTuning = { stiffness: 180, damping: 22 };

export const SHOTS: Record<ShotKind, ShotPreset> = {
  none: { kind: "none", scale: 1, fit: 1, yaw: 0, pitch: 0, roll: 0, rig: {}, lead: 0, hold: 500, punch: 0, shake: 0, creep: 0, hitstop: 0 },
  light: { kind: "light", scale: 1.15, fit: 0.82, yaw: 2, pitch: 0, roll: 1, rig: { s: SOFT }, lead: 140, hold: 380, punch: 0.015, shake: 7, creep: 0, hitstop: 45 },
  normal: { kind: "normal", scale: 1.4, fit: 0.78, yaw: 4, pitch: 1, roll: 2, rig: { s: QUICK }, lead: 200, hold: 620, punch: 0.025, shake: 12, creep: 0, hitstop: 70 },
  foe: { kind: "foe", scale: 1.3, fit: 0.8, yaw: 3, pitch: 1, roll: 1, rig: { s: QUICK }, lead: 820, hold: 1250, punch: 0.05, shake: 20, creep: 0, hitstop: 150, slowmo: { scale: 0.35, ms: 400 } },
  // 与 foe 同档, 两者的分歧点只在 kind; 以后想单独调轻不必再拆。
  foeCast: { kind: "foeCast", scale: 1.3, fit: 0.8, yaw: 3, pitch: 1, roll: 1, rig: { s: QUICK }, lead: 820, hold: 1250, punch: 0.05, shake: 20, creep: 0, hitstop: 150, slowmo: { scale: 0.35, ms: 400 } },
  heavy: { kind: "heavy", scale: 1.7, fit: 0.72, yaw: 5, pitch: 5, roll: 5, rig: { s: QUICK, roll: { stiffness: 150, damping: 16 } }, lead: 280, hold: 980, punch: 0.06, shake: 22, creep: 0, hitstop: 90 },
  aoe: { kind: "aoe", scale: 1.1, fit: 0.72, yaw: 8, pitch: 0, roll: 3, rig: { s: SOFT, yaw: SOFT }, lead: 240, hold: 820, punch: 0.025, shake: 12, creep: 0, hitstop: 70 },
  // DEATH.drain + DEATH.vanish = 1520ms; 击杀镜头多留 40ms 覆盖完整消散段。
  kill: { kind: "kill", scale: 1.85, fit: 0.68, yaw: 6, pitch: 4, roll: 8, rig: { s: QUICK, roll: { stiffness: 190, damping: 16 } }, lead: 320, hold: 1560, punch: 0.08, shake: 28, creep: 20, hitstop: 140, slowmo: { scale: 0.25, ms: 320 } },
  iai: { kind: "iai", scale: 1.65, fit: 0.72, yaw: 5, pitch: 4, roll: 8, rig: { s: QUICK, roll: { stiffness: 210, damping: 15 } }, lead: 260, hold: 960, punch: 0.075, shake: 24, creep: 0, hitstop: 110 },
  // 刀光视觉时间轴约 1600ms; hold 1800ms 给刀痕消散尾段留 170ms 卸载余量。
  blade: { kind: "blade", scale: 1.5, fit: 0.74, yaw: 5, pitch: 3, roll: 5, rig: { s: QUICK }, lead: 240, hold: 1800, punch: 0.06, shake: 20, creep: 0, hitstop: 90 },
  // 三段斩击视觉时间轴约 2600ms; hold 2550ms 盖住演出的尾段(命中特效 hold 2500ms 后
  // 镜头多停 50ms 再弹回)。爆点 1.85s 延迟受击, 顿帧(hitstop 110)与重震(shake 22)都在那一刻。
  tri: { kind: "tri", scale: 1.5, fit: 0.74, yaw: 5, pitch: 3, roll: 5, rig: { s: QUICK }, lead: 240, hold: 2550, punch: 0.06, shake: 22, creep: 0, hitstop: 110 },
  // 血色刀光视觉时间轴 2800ms; 比三段斩击多停 300ms 覆盖疤痕消散, 血花爆点的重震更强。
  blood: { kind: "blood", scale: 1.5, fit: 0.74, yaw: 5, pitch: 3, roll: 5, rig: { s: QUICK }, lead: 240, hold: 2850, punch: 0.06, shake: 24, creep: 0, hitstop: 110 },
  // 霓虹交叉斩视觉 2200ms; hold 2350 覆盖像素碎片收尾, 爆点 1700ms 对齐重震与顿帧。
  neon: { kind: "neon", scale: 1.5, fit: 0.74, yaw: 5, pitch: 3, roll: 5, rig: { s: QUICK }, lead: 240, hold: 2350, punch: 0.06, shake: 22, creep: 0, hitstop: 100 },
  // 流光·三段斩视觉 2700ms; hold 2950 覆盖命中特效 2900ms, 爆点 2200ms 对齐重震与顿帧。
  triple: { kind: "triple", scale: 1.5, fit: 0.74, yaw: 5, pitch: 3, roll: 5, rig: { s: QUICK }, lead: 240, hold: 2950, punch: 0.06, shake: 22, creep: 0, hitstop: 110 },
};

/** 敌人自己的戏: 先把镜头聚焦到施法者、落位后再起蓄力(见 BattleScreen 的 focusLead)。 */
export const isFoeLedShot = (p: ShotPreset) => p.kind === "foe" || p.kind === "foeCast";

// 击杀冲击只覆盖打击感参数, 取景与节拍留给动画对应的 base 预设, 避免长特效被 kill 的 hold 截断。
function killShot(base: ShotPreset): ShotPreset {
  if (base.hold <= SHOTS.kill.hold) return SHOTS.kill;
  const { punch, shake, creep, hitstop, slowmo } = SHOTS.kill;
  return { ...base, kind: "kill", punch, shake, creep, hitstop, slowmo };
}

export function pickShot(ctx: ShotContext): ShotPreset {
  if (ANIM[ctx.anim].kind === "support") return ctx.actorIsEnemy ? SHOTS.foeCast : SHOTS.none;
  if (!ctx.targetInStage) return SHOTS.foe;
  const base =
    ctx.targetCount >= 2 ? SHOTS.aoe
      : ctx.anim === "iai-slash" ? SHOTS.iai
        : ctx.anim === "blade-slash" ? SHOTS.blade
          : ctx.anim === "tri-slash" ? SHOTS.tri
            : ctx.anim === "blood-slash" ? SHOTS.blood
              : ctx.anim === "neon-cross" ? SHOTS.neon
              : ctx.anim === "triple-strike" ? SHOTS.triple
              : ctx.anim === "sword-fall" || ctx.shake === 2 || ctx.damageRatio >= 0.35 ? SHOTS.heavy
                : ctx.shake === 1 && ctx.damageRatio < 0.15 ? SHOTS.light
                  : SHOTS.normal;
  return ctx.isKill ? killShot(base) : base;
}
