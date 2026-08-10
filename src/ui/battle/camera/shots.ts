import type { CardAnim } from "@/engine";
import { ANIM } from "@/ui/battle/animations";
import type { SpringTuning } from "./spring";

export type ShotKind = "none" | "light" | "normal" | "heavy" | "aoe" | "kill" | "iai";

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
}

const SOFT: SpringTuning = { stiffness: 100, damping: 20 };
const QUICK: SpringTuning = { stiffness: 180, damping: 22 };

export const SHOTS: Record<ShotKind, ShotPreset> = {
  none: { kind: "none", scale: 1, fit: 1, yaw: 0, pitch: 0, roll: 0, rig: {}, lead: 0, hold: 500, punch: 0, creep: 0, hitstop: 0 },
  light: { kind: "light", scale: 1.15, fit: 0.82, yaw: 2, pitch: 0, roll: 1, rig: { s: SOFT }, lead: 140, hold: 380, punch: 0.015, creep: 0, hitstop: 45 },
  normal: { kind: "normal", scale: 1.4, fit: 0.78, yaw: 4, pitch: 1, roll: 2, rig: { s: QUICK }, lead: 200, hold: 620, punch: 0.025, creep: 0, hitstop: 70 },
  heavy: { kind: "heavy", scale: 1.7, fit: 0.72, yaw: 5, pitch: 5, roll: 5, rig: { s: QUICK, roll: { stiffness: 150, damping: 16 } }, lead: 280, hold: 980, punch: 0.06, creep: 0, hitstop: 90 },
  aoe: { kind: "aoe", scale: 1.1, fit: 0.72, yaw: 8, pitch: 0, roll: 3, rig: { s: SOFT, yaw: SOFT }, lead: 240, hold: 820, punch: 0.025, creep: 0, hitstop: 70 },
  kill: { kind: "kill", scale: 1.85, fit: 0.68, yaw: 6, pitch: 4, roll: 8, rig: { s: QUICK, roll: { stiffness: 190, damping: 16 } }, lead: 320, hold: 1300, punch: 0.08, creep: 20, hitstop: 140, slowmo: { scale: 0.25, ms: 320 } },
  iai: { kind: "iai", scale: 1.65, fit: 0.72, yaw: 5, pitch: 4, roll: 8, rig: { s: QUICK, roll: { stiffness: 210, damping: 15 } }, lead: 260, hold: 960, punch: 0.075, creep: 0, hitstop: 110 },
};

export function pickShot(ctx: ShotContext): ShotPreset {
  if (!ctx.targetInStage || ANIM[ctx.anim].kind === "support") return SHOTS.none;
  if (ctx.isKill) return SHOTS.kill;
  if (ctx.targetCount >= 2) return SHOTS.aoe;
  if (ctx.anim === "iai-slash") return SHOTS.iai;
  if (ctx.anim === "sword-fall" || ctx.shake === 2 || ctx.damageRatio >= 0.35) return SHOTS.heavy;
  if (ctx.shake === 1 && ctx.damageRatio < 0.15) return SHOTS.light;
  return SHOTS.normal;
}
