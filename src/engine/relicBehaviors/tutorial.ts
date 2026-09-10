import { ops } from "../ops";
import type { RelicBehavior } from "./types";

const dataOf = (behavior: Parameters<NonNullable<RelicBehavior["onRoundStart"]>>[0]) =>
  (behavior.relic.data ??= {});

export const TUTORIAL_RELIC_BEHAVIORS: Record<string, RelicBehavior> = {
  "relic-heart-mirror": {
    onAllyHpCrossedHalf: ({ state, relic }, targetId) => {
      const data = (relic.data ??= {});
      if (data.used) return;
      data.used = 1;
      ops.gainShield(state, undefined, targetId, 8);
    },
  },
  "relic-old-clockwork": {
    onRoundStart: ({ state }) => {
      if (state.round % 3 === 0) ops.draw(state, 1);
    },
  },
  "relic-light-feather": {
    onRoundStart: (ctx) => {
      const data = dataOf(ctx);
      if (ctx.state.round === 1) {
        ctx.state.squadMods.redraws += 2;
        data.applied = 1;
      } else if (ctx.state.round === 2 && data.applied) {
        ctx.state.squadMods.redraws -= 2;
        data.applied = 0;
      }
    },
  },
};
