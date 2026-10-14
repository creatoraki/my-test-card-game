import type { RelicBehavior } from "../../types";
import { relicData } from "../../shared";
import { getStatus, ops } from "../../../core/ops";
import { settleTorment, TORMENT_STATUS } from "../../../hexer/hexTorment";
import { syncSegments } from "../../../statuses/stacking";

export const COMBAT_RELIC_BEHAVIORS: Record<string, RelicBehavior> = {
  "relic-nail-gun": {
    onCardAttackStarted: (ctx, cardUid, hits) => {
      const data = relicData(ctx);
      if (data.round === ctx.state.round || hits < 2) return;
      data.round = ctx.state.round;
      ctx.relic.activeCardUid = cardUid;
    },
    onCardAttackHit: (ctx, cardUid, targetId) => {
      if (ctx.relic.activeCardUid === cardUid && relicData(ctx).round === ctx.state.round &&
        ctx.state.combatants[targetId]?.team === "enemy")
        ops.applyStatus(ctx.state, targetId, "pierce", 1, undefined, undefined, ctx.state.cards[cardUid]?.ownerCharId);
    },
    afterCardPlay: (ctx, card) => { if (ctx.relic.activeCardUid === card.uid) delete ctx.relic.activeCardUid; },
  },
  "relic-tape-measure": {
    onPierceRemoved: (ctx, targetId, stacks) => {
      if (stacks < 4 || ctx.state.combatants[targetId]?.team !== "enemy") return;
      const data = relicData(ctx);
      if (data.round === ctx.state.round) return;
      data.round = ctx.state.round;
      ops.draw(ctx.state, 1);
    },
  },
  "relic-fire-hook": {
    onIncinerated: ({ state }, targetId) => ops.applyStatus(state, targetId, "poison", 3, 2),
  },
  "relic-dropper": {
    onPoisonTriggered: (ctx, targetId) => {
      const data = relicData(ctx);
      if (data.round === ctx.state.round) return;
      data.round = ctx.state.round;
      const target = ctx.state.combatants[targetId];
      const poison = target?.alive ? getStatus(target, "poison") : undefined;
      if (!poison) return;
      if (poison.segments) {
        for (const segment of poison.segments) if (segment.duration != null) segment.duration += 1;
        syncSegments(poison);
      } else if (poison.duration != null) poison.duration += 1;
    },
  },
  "relic-warning-vest": {
    afterStatusApplied: ({ state }, info) => {
      if (info.statusId === "taunt" && state.combatants[info.targetId]?.team === "player")
        ops.applyStatus(state, info.targetId, "insurance", 6, 2, undefined, info.sourceId);
    },
  },
  "relic-receipt": {
    afterInsuranceClaim: ({ state }, targetId, healed) => {
      if (state.combatants[targetId]?.team === "player" && healed > 0)
        ops.gainShield(state, undefined, targetId, Math.floor(healed * 0.25));
    },
  },
  "relic-straw-knot": {
    afterDamageDealt: ({ state }, dmg) => {
      const target = state.combatants[dmg.targetId];
      if (!dmg.crit || dmg.hpLost <= 0 || !target?.alive || target.team !== "enemy" ||
        !dmg.sourceId || state.combatants[dmg.sourceId]?.team !== "player" ||
        !getStatus(target, "doom") || !getStatus(target, TORMENT_STATUS)) return;
      settleTorment(state, { type: "SETTLE_TORMENT", amount: 1 }, dmg.sourceId, [target.id]);
    },
  },
  "relic-thimble": {
    beforeTormentSettle: (ctx, info) => {
      const data = relicData(ctx);
      if (data.round === ctx.state.round) return;
      data.round = ctx.state.round;
      info.beats += 1;
    },
  },
  "relic-door-stop": {
    onEnemyActDelayed: ({ state }, targetId) => ops.applyStatus(state, targetId, "pierce", 2),
  },
};
