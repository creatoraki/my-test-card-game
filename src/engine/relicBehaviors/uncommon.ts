import { rngInt } from "../rng";
import { ops } from "../ops";
import { RULES } from "../rules";
import type { RelicBehavior, RelicBehaviorContext } from "./types";

function relicData(ctx: RelicBehaviorContext): Record<string, number> {
  return (ctx.relic.data ??= {});
}

export const UNCOMMON_RELIC_BEHAVIORS: Record<string, RelicBehavior> = {
  "relic-stun-hammer": {
    onShuffle: ({ state }) => {
      const allies = state.playerIds.filter((id) => state.combatants[id]?.alive);
      const ownerId = allies[rngInt(state, allies.length)];
      if (ownerId) ops.addCardToHand(state, "temp-stun-hammer", ownerId);
    },
  },
  "relic-insurance-contract": {
    onDownedFatal: (ctx, dmg) => {
      const data = relicData(ctx);
      if (data.used) return;
      data.used = 1;
      dmg.fatal = false;
    },
  },
  "relic-entropy-battery": {
    onRoundEnd: (ctx) => {
      relicData(ctx).carry = Math.min(2, ctx.state.resources[RULES.resource.name] ?? 0);
    },
    onRoundStart: (ctx) => {
      const data = relicData(ctx);
      if (!data.carry) return;
      const resource = RULES.resource.name;
      ctx.state.resources[resource] = (ctx.state.resources[resource] ?? 0) + data.carry;
      data.carry = 0;
    },
  },
};
