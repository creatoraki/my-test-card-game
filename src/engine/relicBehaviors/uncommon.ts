import { rngInt } from "../rng";
import { ops } from "../ops";
import type { RelicBehavior } from "./types";

export const UNCOMMON_RELIC_BEHAVIORS: Record<string, RelicBehavior> = {
  "relic-stun-hammer": {
    onShuffle: ({ state }) => {
      const allies = state.playerIds.filter((id) => state.combatants[id]?.alive);
      const ownerId = allies[rngInt(state, allies.length)];
      if (ownerId) ops.addCardToHand(state, "temp-stun-hammer", ownerId);
    },
  },
};
