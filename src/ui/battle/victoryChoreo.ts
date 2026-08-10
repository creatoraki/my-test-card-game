import type { CSSProperties } from "react";

export const VICTORY_CHOREO = {
  ease: "cubic-bezier(0.22, 0.61, 0.36, 1)",
  easePop: "cubic-bezier(0.16, 1, 0.3, 1)",
  controlMs: 160,
  panelMs: 420,
  titleMs: 420,
  sectionMs: 360,
  sectionStaggerMs: 60,
  expMs: 700,
  staggerMs: 70,
  barMs: 760,
  barDelayMs: 240,
  lootFlyMs: 480,
  contentDelayMs: 140,
  expFloatMs: 900,
  continueNudgeMs: 180,
} as const;

export const VICTORY_REDUCED = {
  panelMs: 0,
  titleMs: 0,
  sectionMs: 0,
  sectionStaggerMs: 0,
  expMs: 0,
  staggerMs: 0,
  barMs: 0,
  barDelayMs: 0,
  lootFlyMs: 0,
  expFloatMs: 0,
} as const;

export function victoryChoreoVars(): CSSProperties {
  return {
    "--vc-ease": VICTORY_CHOREO.ease,
    "--vc-ease-pop": VICTORY_CHOREO.easePop,
    "--vc-control-ms": `${VICTORY_CHOREO.controlMs}ms`,
    "--vc-panel-ms": `${VICTORY_CHOREO.panelMs}ms`,
    "--vc-title-ms": `${VICTORY_CHOREO.titleMs}ms`,
    "--vc-section-ms": `${VICTORY_CHOREO.sectionMs}ms`,
    "--vc-exp-ms": `${VICTORY_CHOREO.expMs}ms`,
    "--vc-fly-ms": `${VICTORY_CHOREO.lootFlyMs}ms`,
    "--vc-bar-ms": `${VICTORY_CHOREO.barMs}ms`,
    "--vc-bar-delay": `${VICTORY_CHOREO.barDelayMs}ms`,
    "--vc-nudge-ms": `${VICTORY_CHOREO.continueNudgeMs}ms`,
  } as CSSProperties;
}

export function victoryStagger(index: number): string {
  return `${index * VICTORY_CHOREO.staggerMs}ms`;
}

export function victorySectionStagger(index: number): string {
  return `${index * VICTORY_CHOREO.sectionStaggerMs}ms`;
}
