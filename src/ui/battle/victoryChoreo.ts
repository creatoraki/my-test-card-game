import type { CSSProperties } from "react";

export const VICTORY_CHOREO = {
  ease: "cubic-bezier(0.22, 0.61, 0.36, 1)",
  controlMs: 160,
  panelMs: 380,
  expMs: 700,
  staggerMs: 70,
  lootFlyMs: 430,
  contentDelayMs: 120,
  expFloatMs: 900,
  continueNudgeMs: 120,
} as const;

export const VICTORY_REDUCED = {
  panelMs: 0,
  expMs: 0,
  staggerMs: 0,
  lootFlyMs: 0,
  expFloatMs: 0,
} as const;

export function victoryChoreoVars(): CSSProperties {
  return {
    "--vc-ease": VICTORY_CHOREO.ease,
    "--vc-control-ms": `${VICTORY_CHOREO.controlMs}ms`,
    "--vc-panel-ms": `${VICTORY_CHOREO.panelMs}ms`,
    "--vc-exp-ms": `${VICTORY_CHOREO.expMs}ms`,
    "--vc-fly-ms": `${VICTORY_CHOREO.lootFlyMs}ms`,
  } as CSSProperties;
}

export function victoryStagger(index: number): string {
  return `${index * VICTORY_CHOREO.staggerMs}ms`;
}
