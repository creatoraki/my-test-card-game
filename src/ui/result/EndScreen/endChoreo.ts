import { prefersReducedMotion } from "@/ui/app/transitions";

export const END_CHOREO = {
  headerMs: 260,
  rosterStagger: 90,
  trophyStagger: 110,
  trophyCountMs: 520,
  feedStartMs: 420,
  dropStepMs: 170,
  rowH: 56,
  visibleRows: 10,
} as const;

const END_REDUCED = {
  headerMs: 0,
  rosterStagger: 0,
  trophyStagger: 0,
  trophyCountMs: 0,
  feedStartMs: 0,
  dropStepMs: 0,
} as const;

export function endTiming() {
  return prefersReducedMotion() ? { ...END_CHOREO, ...END_REDUCED } : END_CHOREO;
}