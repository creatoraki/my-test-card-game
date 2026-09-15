import type { CorridorState } from "@/explore/corridor/types";
import { EXPLORE_RULES } from "@/explore/rules";
import { checkCorridorAmbush } from "@/store/exploreCorridor";

export type CorridorTrigger = "ambush" | null;

export function createCorridorTriggers() {
  let walkMs = 0;

  return {
    step(corridor: CorridorState, x: number, facing: -1 | 1, movedMs: number): CorridorTrigger {
      if (movedMs > 0) walkMs += movedMs;
      if (walkMs < EXPLORE_RULES.ambush.checkIntervalMs) return null;
      walkMs = 0;
      return checkCorridorAmbush(x, facing) ? "ambush" : null;
    },
  };
}
