import type { RelicBehavior } from "../../types";
import { relicData } from "../../shared";
import { ops } from "../../../core/ops";
import { RULES } from "../../../core/battleRules";
import { isPassive } from "../../../cards/passiveCards";
import { activeEffectsOf } from "../../../cards/cardEffects";
import { availableHand } from "../../../ecoArk/shared";
import { returnCardToHand } from "../../../deck/returnToHand";
import { queueRelicChoice } from "../../choices";

export const HAND_RELIC_BEHAVIORS: Record<string, RelicBehavior> = {
  "relic-shredder": {
    onCardDiscarded: (ctx) => {
      const data = relicData(ctx);
      if (data.round !== ctx.state.round) { data.round = ctx.state.round; data.discards = 0; }
      data.discards += 1;
      if (data.discards === 2) ops.draw(ctx.state, 1);
    },
  },
  "relic-paper-clip": {
    onRoundEnd: (ctx) => {
      const data = relicData(ctx);
      if ((data.used ?? 0) >= 2) return;
      const uid = availableHand(ctx.state).find((id) => isPassive(ctx.state.cards[id]));
      if (!uid) return;
      data.used = (data.used ?? 0) + 1;
      ops.discard(ctx.state, uid, "effect");
    },
  },
  "relic-blade-lanyard": {
    afterDamageDealt: (ctx, dmg) => {
      const { state } = ctx;
      const card = state.activeCardUid ? state.cards[state.activeCardUid] : undefined;
      if (!card || dmg.sourceId !== card.ownerCharId || !dmg.isAttack || dmg.hpLost <= 0 ||
        !activeEffectsOf(card).some((effect) => effect.type === "DAMAGE") ||
        (state.activeCardType !== "fast" && !state.hexPlay.asFast) ||
        state.combatants[dmg.targetId]?.team !== "enemy" || state.combatants[dmg.targetId]?.alive) return;
      const data = relicData(ctx);
      if (data.used) return;
      data.used = 1;
      const uid = state.discard.find((id) => {
        const candidate = state.cards[id];
        return candidate && candidate.cardType !== "fast" && !isPassive(candidate) &&
          activeEffectsOf(candidate).some((effect) => effect.type === "DAMAGE");
      });
      if (uid && returnCardToHand(state, state.cards[uid])) ops.log(state, `回刃挂绳：${state.cards[uid].name} 返回手牌`);
    },
  },
  "relic-cork-guard": {
    onCardPlayRecorded: (ctx, played) => {
      if (played.cardType !== "fast" || relicData(ctx).used) return;
      if (ctx.state.playedThisRound.filter((entry) => entry.cardType === "fast").length < 2) return;
      relicData(ctx).used = 1;
      queueRelicChoice(ctx.state, {
        kind: "pickHandCard", sourceCardUid: ctx.relic.id, ownerCharId: played.ownerCharId,
        action: "grantMindsEye", remaining: 1,
      });
    },
  },
  "relic-elastic-band": {
    onCardReturned: (ctx, info) => {
      const data = relicData(ctx);
      if (data.round === ctx.state.round) return;
      data.round = ctx.state.round;
      info.costDelta = 0;
    },
  },
  "relic-scale-weight": {
    beforeCardEffects: ({ state }, card) => {
      if ((state.activeCardCost ?? 0) <= card.cost || !state.combatants[card.ownerCharId]?.alive) return;
      for (const stat of ["attack", "healPower"] as const) {
        ops.applyStatMod(state, card.ownerCharId, stat, 30);
        state.playStatMods.push({ targetId: card.ownerCharId, stat, amount: 30, pct: false });
      }
    },
  },
  "relic-coin-pouch": {
    onCardPlayRecorded: (ctx, played) => {
      if (played.cost !== 0) return;
      const data = relicData(ctx);
      if (data.round !== ctx.state.round) { data.round = ctx.state.round; data.zeroPlays = 0; }
      data.zeroPlays += 1;
      if (data.zeroPlays === 2) ops.draw(ctx.state, 1);
    },
  },
  "relic-notepad": {
    afterCardPlay: (ctx, card) => {
      if (!card.temporary) return;
      const data = relicData(ctx);
      if (data.round === ctx.state.round) return;
      data.round = ctx.state.round;
      const resource = RULES.resource.name;
      ctx.state.resources[resource] = (ctx.state.resources[resource] ?? 0) + 1;
      ops.log(ctx.state, "便签本：返还 1 点法力");
    },
  },
};
