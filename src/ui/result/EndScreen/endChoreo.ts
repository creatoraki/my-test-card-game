import { prefersReducedMotion } from "@/ui/app/transitions";

export const END_CHOREO = {
  headerMs: 260,
  rosterStagger: 90,
  trophyStagger: 110,
  trophyCountMs: 520,
  feedStartMs: 420,
  sliceDropMs: 300,
  sliceHoldMs: 420,
  sliceH: 96,
  visibleSlices: 9,
} as const;

const END_REDUCED = {
  headerMs: 0,
  rosterStagger: 0,
  trophyStagger: 0,
  trophyCountMs: 0,
  feedStartMs: 0,
  sliceDropMs: 0,
  sliceHoldMs: 0,
} as const;

export function endTiming() {
  return prefersReducedMotion() ? { ...END_CHOREO, ...END_REDUCED } : END_CHOREO;
}

export function endStepMs(total: number) {
  const timing = endTiming();
  const fullStepMs = timing.sliceDropMs + timing.sliceHoldMs;
  if (!total || !fullStepMs) return 0;

  return Math.max(480, Math.min(fullStepMs, fullStepMs * Math.min(1, 12 / total)));
}