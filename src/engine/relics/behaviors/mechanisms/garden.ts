import type { RelicBehavior } from "../../types";
import { relicData } from "../../shared";
import { ops } from "../../../core/ops";
import { rngPick } from "../../../core/rng";
import { availableHand } from "../../../ecoArk/shared";
import { advanceCultivate, cultivateCanAdvance } from "../../../deck/cultivate";
import { WITHERED_FRUIT_ID } from "../../../deck/deck";

export const GARDEN_RELIC_BEHAVIORS: Record<string, RelicBehavior> = {
  "relic-pruning-shears": {
    onMatureCardPlayed: (ctx, card) => {
      const data = relicData(ctx);
      if ((data.used ?? 0) >= 2) return;
      data.used = (data.used ?? 0) + 1;
      const candidates = availableHand(ctx.state).filter((uid) => uid !== card.uid && cultivateCanAdvance(ctx.state.cards[uid]));
      if (!candidates.length) return;
      const target = ctx.state.cards[rngPick(ctx.state, candidates)];
      advanceCultivate(ctx.state, target, 1);
      ops.log(ctx.state, `修枝剪：${target.name} 的培育推进 1 层`);
    },
  },
  "relic-leaf-mold": {
    onCultivateWithered: ({ state }, card) => ops.addCardToHand(state, WITHERED_FRUIT_ID, card.ownerCharId),
  },
};
