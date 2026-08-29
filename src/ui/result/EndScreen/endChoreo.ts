import { prefersReducedMotion } from "@/ui/app/transitions";

export const END_CHOREO = {
  bgMs: 2400,
  verdictMs: 320,
  headerMs: 900,
  trophyStagger: 110,
  trophyCountMs: 520,
  rosterStartMs: 1500,
  rosterStagger: 140,
  haulStartMs: 2050,
  bandStartMs: 2400,
  feedStartMs: 2750,
  actionMs: 3200,
  sliceDropMs: 300,
  sliceHoldMs: 420,
  sliceH: 152,
  visibleSlices: 7,
} as const;

const END_REDUCED = {
  bgMs: 0,
  verdictMs: 0,
  headerMs: 0,
  rosterStartMs: 0,
  rosterStagger: 0,
  trophyStagger: 0,
  trophyCountMs: 0,
  haulStartMs: 0,
  bandStartMs: 0,
  feedStartMs: 0,
  actionMs: 0,
  sliceDropMs: 0,
  sliceHoldMs: 0,
} as const;

const END_EXIT = {
  actionOut: 0,
  bandOut: 80,
  haulOut: 200,
  rosterOut: 320,
  rosterOutStagger: 60,
  trophyOut: 480,
  trophyOutStagger: 50,
  verdictOut: 700,
  bgOut: 800,
} as const;

const END_EXIT_REDUCED = {
  actionOut: 0,
  bandOut: 0,
  haulOut: 0,
  rosterOut: 0,
  rosterOutStagger: 0,
  trophyOut: 0,
  trophyOutStagger: 0,
  verdictOut: 0,
  bgOut: 0,
} as const;

export const END_EXIT_MS = 1150;

export function endTiming() {
  return prefersReducedMotion() ? { ...END_CHOREO, ...END_REDUCED } : END_CHOREO;
}

export function endExitTiming() {
  return prefersReducedMotion() ? END_EXIT_REDUCED : END_EXIT;
}

export function endStepMs(total: number) {
  const timing = endTiming();
  const fullStepMs = timing.sliceDropMs + timing.sliceHoldMs;
  if (!total || !fullStepMs) return 0;

  return Math.max(480, Math.min(fullStepMs, fullStepMs * Math.min(1, 8 / total)));
}