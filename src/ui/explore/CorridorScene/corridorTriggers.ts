import type { CorridorState } from "@/explore/corridor/types";
import { EXPLORE_RULES } from "@/explore/rules";
import { checkCorridorAmbush, spendCorridorWalkEnergy } from "@/store/exploreCorridor";

export type CorridorTrigger = "ambush" | null;

export function createCorridorTriggers() {
  let walkMs = 0;
  // 行走距离累计: 满一段就扣 1 点净化粒子, 余数留到下一段。
  let walkPx = 0;

  return {
    step(corridor: CorridorState, x: number, facing: -1 | 1, movedMs: number, movedPx = 0): CorridorTrigger {
      if (movedPx > 0) {
        walkPx += movedPx;
        const { pxPerEnergy } = EXPLORE_RULES.walk;
        const spent = Math.floor(walkPx / pxPerEnergy);
        if (spent > 0) {
          walkPx -= spent * pxPerEnergy;
          spendCorridorWalkEnergy(spent);
        }
      }
      if (movedMs > 0) walkMs += movedMs;
      if (walkMs < EXPLORE_RULES.ambush.checkIntervalMs) return null;
      walkMs = 0;
      return checkCorridorAmbush(x, facing) ? "ambush" : null;
    },
  };
}
