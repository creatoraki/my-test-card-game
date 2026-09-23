import { effectiveTargeting, type AnimFrame, type BattleState, type Card, type DiscardTriggerFx, type FxStep, type RelicTriggerFx, type TempoFx } from "@/engine";
import { getEnemyDef } from "@/data";
import { type ChoreoStep } from "@/ui/battle/camera";
import { cardAnim, moveAnim } from "@/ui/battle/animations";

function stepFromFrame(_battle: BattleState, frame: AnimFrame): ChoreoStep {
  const def = getEnemyDef(frame.enemyDefId);
  const move = def.moves.find((item) => item.id === frame.moveId) ?? def.moves[0];
  return { actorId: frame.actorId, anim: moveAnim(move), snapshot: frame.snapshot, hits: frame.hits };
}

function stepFromDiscard(battle: BattleState, trigger: DiscardTriggerFx): ChoreoStep {
  const card = trigger.snapshot.cards[trigger.cardUid] ?? battle.cards[trigger.cardUid];
  return {
    kind: trigger.reveal ? "reveal" : undefined,
    actorId: trigger.actorId,
    // 按定义表实时解析(同出牌): 实例上的 anim 可能来自旧存档, 改卡面动画后会过期。
    anim: card ? cardAnim(card) : trigger.anim ?? "slash",
    snapshot: trigger.snapshot,
    hits: trigger.hits,
    card,
    discardUid: trigger.cardUid,
  };
}

function stepFromTempo(_battle: BattleState, tempo: TempoFx): ChoreoStep {
  const hurt = tempo.hits.some((hit) => hit.hpDelta > 0);
  return {
    kind: "tempo",
    actorId: tempo.ownerId,
    anim: hurt ? "poison" : "heal",
    snapshot: tempo.snapshot,
    hits: tempo.hits,
  };
}

function stepFromRelic(_battle: BattleState, relic: RelicTriggerFx): ChoreoStep {
  return {
    kind: "relic",
    relicId: relic.relicId,
    actorId: relic.actorId,
    anim: "buff",
    snapshot: relic.snapshot,
    hits: relic.hits,
  };
}

export function stepFromFx(battle: BattleState, fx: FxStep): ChoreoStep {
  if (fx.kind === "enemy") return stepFromFrame(battle, fx);
  if (fx.kind === "relic") return stepFromRelic(battle, fx);
  if (fx.kind === "tempo") return stepFromTempo(battle, fx);
  if (fx.kind === "flee") {
    return { kind: "flee", actorId: fx.actorId, anim: "buff", snapshot: fx.snapshot, hits: [] };
  }
  return stepFromDiscard(battle, fx);
}

export function fxTargets(battle: BattleState, uid: string, primaryId?: string): string[] {
  const card: Card = battle.cards[uid];
  if (card.effects.some((effect) => effect.target === "allFoes")) {
    return battle.enemyIds.filter((id) => battle.combatants[id].alive);
  }
  if (card.effects.some((effect) => effect.target === "allAllies")) {
    return battle.playerIds.filter((id) => battle.combatants[id].alive);
  }
  switch (effectiveTargeting(card)) {
    case "foe":
    case "ally":
      return primaryId ? [primaryId] : [];
    case "self":
      return [card.ownerCharId];
    default:
      return [];
  }
}
