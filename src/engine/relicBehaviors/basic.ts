import type { Card, DamageCtx } from "../types";
import { ops } from "../ops";
import { STATUS_DEFS } from "../statuses";
import { rngInt } from "../rng";
import { RULES } from "../rules";
import { playableHandUids, isPassive } from "../passiveCards";
import { activeEffectsOf } from "../cardEffects";
import type { RelicBehavior, RelicBehaviorContext } from "./types";

function relicData(ctx: RelicBehaviorContext): Record<string, number> {
  return (ctx.relic.data ??= {});
}

function ownerOf(state: RelicBehaviorContext["state"], card: Card) {
  return state.combatants[card.ownerCharId];
}

function addPlayStatBonus(ctx: RelicBehaviorContext, card: Card, stat: "attack" | "healPower", amount: number): void {
  const owner = ownerOf(ctx, card);
  if (!owner?.alive) return;
  ops.applyStatMod(ctx.state, owner.id, stat, amount);
  ctx.state.playStatMods.push({ targetId: owner.id, stat, amount, pct: false });
}

// 磨刀石: 只读判断, 修正钩子与消耗钩子共用同一口径。
function isSharpenedPlayerAttack(ctx: RelicBehaviorContext, dmg: Readonly<DamageCtx>): boolean {
  const source = dmg.sourceId ? ctx.state.combatants[dmg.sourceId] : undefined;
  return Boolean(ctx.relic.data?.sharpen) && dmg.isAttack && source?.team === "player";
}

function hasAttackEffect(card: Card): boolean {
  return activeEffectsOf(card).some((effect) => effect.type === "DAMAGE");
}

function hasDebuff(state: RelicBehaviorContext["state"], targetId: string): boolean {
  const target = state.combatants[targetId];
  return Boolean(target?.statuses.some((status) => STATUS_DEFS[status.id]?.kind === "debuff"));
}

export const BASIC_RELIC_BEHAVIORS: Record<string, RelicBehavior> = {
  "relic-warm-match": {
    beforeCardEffects: (ctx, card) => {
      if (playableHandUids(ctx.state).length > 0) return;
      addPlayStatBonus(ctx, card, "attack", 30);
      addPlayStatBonus(ctx, card, "healPower", 30);
    },
  },
  "relic-whetstone": {
    beforeCardEffects: (ctx, card) => {
      if (!hasAttackEffect(card)) return;
      const data = relicData(ctx);
      if (!data.sharpen) data.sharpen = 1;
    },
    modifyOutgoingDamage: (ctx, dmg, mods) => {
      if (isSharpenedPlayerAttack(ctx, dmg)) mods.addFlat(3);
    },
    afterDamageModified: (ctx, dmg) => {
      if (isSharpenedPlayerAttack(ctx, dmg)) relicData(ctx).sharpen = 0;
    },
    afterCardPlay: (ctx) => {
      relicData(ctx).sharpen = 0;
    },
  },
  "relic-hunter-eye": {
    onRoundStart: ({ state }) => {
      if (state.round !== 1) return;
      const enemies = state.enemyIds.filter((id) => state.combatants[id]?.alive);
      if (!enemies.length) return;
      const targetId = enemies[rngInt(state, enemies.length)];
      if (targetId) ops.applyStatus(state, targetId, "hunterMark", 1);
    },
    onRoundEnd: ({ state }) => {
      if (state.round !== 1) return;
      for (const id of state.enemyIds) {
        const enemy = state.combatants[id];
        if (enemy) enemy.statuses = enemy.statuses.filter((status) => status.id !== "hunterMark");
      }
    },
  },
  "relic-tin-whistle": {
    onRoundStart: ({ state }) => {
      if (state.round !== 1) return;
      const target = state.playerIds
        .map((id) => state.combatants[id])
        .filter((ally) => ally?.alive)
        .sort((a, b) => b.hp - a.hp)[0];
      if (target) ops.applyStatus(state, target.id, "taunt", 1, 1);
    },
  },
  "relic-stopwatch": {
    onWait: (ctx) => {
      const data = relicData(ctx);
      data.waits = (data.waits ?? 0) + 1;
      if (data.waits !== 2 || data.done) return;
      data.done = 1;
      for (const id of ctx.state.playerIds) {
        if (ctx.state.combatants[id]?.alive) ops.applyStatus(ctx.state, id, "sharp", 1, 2);
      }
    },
  },
  "relic-wormwood-drops": {
    modifyStatusApply: (ctx, info) => {
      const target = ctx.state.combatants[info.targetId];
      if (
        target?.team === "enemy" &&
        (info.statusId === "poison" || info.statusId === "burn") &&
        info.stacks > 0 &&
        !hasDebuff(ctx.state, target.id)
      )
        info.stacks += 3;
    },
  },
  "relic-energy-crystal": {
    onRoundEnd: (ctx) => {
      if ((ctx.state.resources[RULES.resource.name] ?? 0) > 0) relicData(ctx).charged = 1;
    },
    beforeCardEffects: (ctx, card) => {
      const data = relicData(ctx);
      if (!data.charged) return;
      addPlayStatBonus(ctx, card, "attack", 40);
      addPlayStatBonus(ctx, card, "healPower", 40);
      data.charged = 0;
    },
  },
  "relic-pendulum": {
    onShuffle: ({ state }) => {
      ops.draw(state, 1);
    },
  },
  "relic-lucky-button": {
    onCrit: (ctx, dmg) => {
      const source = dmg.sourceId ? ctx.state.combatants[dmg.sourceId] : undefined;
      if (source?.team !== "player") return;
      const data = relicData(ctx);
      if (data.used) return;
      data.used = 1;
      ops.draw(ctx.state, 1);
    },
  },
  "relic-magnet-charm": {
    onCardDrawn: (ctx, cardUid) => {
      const data = relicData(ctx);
      const card = ctx.state.cards[cardUid];
      if (data.used || !card || !isPassive(card)) return;
      data.used = 1;
      card.holdRounds = 1;
    },
  },
  "relic-black-iron-nail": {
    modifyOutgoingDamage: (ctx, dmg, mods) => {
      const source = dmg.sourceId ? ctx.state.combatants[dmg.sourceId] : undefined;
      const target = ctx.state.combatants[dmg.targetId];
      if (dmg.isAttack && source?.team === "player" && target?.team === "enemy" && hasDebuff(ctx.state, target.id))
        mods.addFlat(3);
    },
  },
  "relic-heat-stone": {
    onRoundEnd: (ctx) => {
      if (ctx.state.attackedThisRound.length === 0) relicData(ctx).charged = 1;
    },
    beforeCardEffects: (ctx, card) => {
      const data = relicData(ctx);
      if (!data.charged) return;
      addPlayStatBonus(ctx, card, "attack", 40);
      addPlayStatBonus(ctx, card, "healPower", 40);
      data.charged = 0;
    },
  },
};
