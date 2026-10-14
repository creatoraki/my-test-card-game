import type { RelicBehavior } from "../../types";
import { relicData, aliveAllyIds } from "../../shared";
import { ops } from "../../../core/ops";
import { isPassive } from "../../../cards/passiveCards";
import { releaseSquadBuff } from "../../../effects/effectsAssemble";
import { resolveEffects } from "../../../effects/effects";
import { ASSEMBLE_IDS, type AssembleId } from "../../../combat/squadBuff";
import { queueRelicChoice } from "../../choices";

export const ASSEMBLY_PROPHECY_RELIC_BEHAVIORS: Record<string, RelicBehavior> = {
  "relic-scrap-box": {
    onDuplicateAssembly: (ctx, info) => {
      const { componentId, sourceId: actorId } = info;
      const data = relicData(ctx);
      const sourceId = actorId && ctx.state.combatants[actorId]?.alive ? actorId : aliveAllyIds(ctx.state)[0];
      if (data.used || !sourceId || !ASSEMBLE_IDS.includes(componentId as AssembleId)) return;
      data.used = 1;
      info.released = true;
      releaseSquadBuff(ctx.state, componentId as AssembleId, 1, sourceId, resolveEffects);
    },
  },
  "relic-porcelain-tray": {
    onAssemblyReward: (_ctx, card) => {
      if (!isPassive(card)) card.nextPlayCostReduction = (card.nextPlayCostReduction ?? 0) + 1;
    },
  },
  "relic-resonant-copper": {
    afterCardPlay: (ctx, card) => {
      if ((ctx.state.activeCardCost ?? 0) < 2) return;
      const data = relicData(ctx);
      if ((data.used ?? 0) >= 2) return;
      data.used = (data.used ?? 0) + 1;
      resolveEffects(ctx.state, [{ type: "RESONATE", amount: 1, resonatePick: "handAll" }], card.ownerCharId, undefined);
    },
  },
  "relic-fulfilled-bookmark": {
    onProphecySettled: (ctx, fulfilled, ownerId) => {
      if (!fulfilled || relicData(ctx).used) return;
      relicData(ctx).used = 1;
      queueRelicChoice(ctx.state, {
        kind: "pickFromDraw", sourceCardUid: ctx.relic.id, options: ctx.state.draw.slice(0, 2), restToBottom: true,
      });
      ops.log(ctx.state, `${ctx.state.combatants[ownerId]?.name ?? "预言家"} 的预言触发应验书签`);
    },
  },
  "relic-wish-slip": {
    onProphecySettled: ({ state }, fulfilled) => { if (!fulfilled) ops.draw(state, 1); },
  },
};
