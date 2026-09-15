import { bossGateNear } from "@/explore/corridor/session";
import type { CorridorState } from "@/explore/corridor/types";
import { EXPLORE_RULES } from "@/explore/rules";
import { checkCorridorAmbush } from "@/store/exploreCorridor";

export type CorridorTrigger = "gate" | "ambush" | null;

export function createCorridorTriggers(initialCorridor: CorridorState, initialX: number) {
  let walkMs = 0;
  let wasNearGate = bossGateNear(initialCorridor, initialX);

  return {
    step(corridor: CorridorState, x: number, facing: -1 | 1, movedMs: number): CorridorTrigger {
      const nearGate = bossGateNear(corridor, x);
      const enteredGateRange = nearGate && !wasNearGate;
      wasNearGate = nearGate;
      if (enteredGateRange) return "gate";

      if (movedMs > 0) walkMs += movedMs;
      if (walkMs < EXPLORE_RULES.ambush.checkIntervalMs) return null;
      walkMs = 0;
      return checkCorridorAmbush(x, facing) ? "ambush" : null;
    },
  };
}
