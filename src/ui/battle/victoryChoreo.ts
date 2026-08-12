import type { CSSProperties } from "react";
import { prefersReducedMotion } from "@/ui/app/transitions";

export const VICTORY_CHOREO = {
  ease: "cubic-bezier(0.22, 0.61, 0.36, 1)",
  easePop: "cubic-bezier(0.16, 1, 0.3, 1)",
  controlMs: 160,
  layerMs: 520,
  revealBarMs: 200,
  revealMs: 760,
  titleMs: 560,
  sectionMs: 520,
  sectionStaggerMs: 140,
  expMs: 520,
  staggerMs: 150,
  barMs: 1100,
  barDelayMs: 320,
  lootFlyMs: 480,
  lootCellInMs: 260,
  lootFlipMs: 180,
  lootBurstStaggerMs: 70,
  pickPulseMs: 420,
  continueReadyMs: 900,
  stateFadeMs: 160,
  contentDelayMs: 860,
  expFloatMs: 900,
  sweepMs: 900,
  continueNudgeMs: 180,
} as const;

export const VICTORY_REDUCED = {
  controlMs: 0,
  layerMs: 0,
  revealBarMs: 0,
  revealMs: 0,
  titleMs: 0,
  sectionMs: 0,
  sectionStaggerMs: 0,
  expMs: 0,
  staggerMs: 0,
  barMs: 0,
  barDelayMs: 0,
  lootFlyMs: 0,
  lootCellInMs: 0,
  lootFlipMs: 0,
  lootBurstStaggerMs: 0,
  pickPulseMs: 0,
  continueReadyMs: 0,
  stateFadeMs: 0,
  contentDelayMs: 0,
  staggerMs: 0,
  sectionStaggerMs: 0,
  expFloatMs: 0,
  sweepMs: 0,
  continueNudgeMs: 0,
} as const;

export function victoryTiming() {
  return prefersReducedMotion()
    ? { ...VICTORY_CHOREO, ...VICTORY_REDUCED }
    : VICTORY_CHOREO;
}

export function victoryChoreoVars(): CSSProperties {
  const timing = victoryTiming();
  return {
    "--vc-ease": timing.ease,
    "--vc-ease-pop": timing.easePop,
    "--vc-control-ms": `${timing.controlMs}ms`,
    "--vc-layer-ms": `${timing.layerMs}ms`,
    "--vc-reveal-bar-ms": `${timing.revealBarMs}ms`,
    "--vc-reveal-ms": `${timing.revealMs}ms`,
    "--vc-title-ms": `${timing.titleMs}ms`,
    "--vc-section-ms": `${timing.sectionMs}ms`,
    "--vc-exp-ms": `${timing.expMs}ms`,
    "--vc-fly-ms": `${timing.lootFlyMs}ms`,
    "--vc-loot-in-ms": `${timing.lootCellInMs}ms`,
    "--vc-flip-ms": `${timing.lootFlipMs}ms`,
    "--vc-continue-ready-ms": `${timing.continueReadyMs}ms`,
    "--vc-state-ms": `${timing.stateFadeMs}ms`,
    "--vc-bar-ms": `${timing.barMs}ms`,
    "--vc-bar-delay": `${timing.barDelayMs}ms`,
    "--vc-sweep-ms": `${timing.sweepMs}ms`,
    "--vc-nudge-ms": `${timing.continueNudgeMs}ms`,
  } as CSSProperties;
}

export function victoryStagger(index: number): string {
  return `${index * victoryTiming().staggerMs}ms`;
}

export function victorySectionStagger(index: number): string {
  return `${index * victoryTiming().sectionStaggerMs}ms`;
}
