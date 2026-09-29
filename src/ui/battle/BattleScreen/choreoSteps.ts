import { effectiveTargeting, type AnimFrame, type BattleState, type Card, type CardAnim, type DiscardTriggerFx, type FxStep, type RelicTriggerFx, type TempoFx } from "@/engine";
import { getEnemyDef } from "@/data";
import type { ChoicePlan } from "@/store/battle/battleStore";
import { type ChoreoStep } from "@/ui/battle/camera";
import { cardAnim, moveAnim } from "@/ui/battle/choreo/animations";

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

// 拍点掉血按伤害标签挑特效: 灼烧占多数演火焰, 否则(中毒/无标签)演毒雾。
// 一帧只能有一个 anim, 灼烧与中毒同拍结算时按掉血量取主导的那种。
function tempoHurtAnim(hits: TempoFx["hits"]): CardAnim {
  let burn = 0;
  let other = 0;
  for (const part of hits.flatMap((hit) => hit.parts ?? [])) {
    if (part.hpDelta <= 0) continue;
    if (part.flags?.includes("burn")) burn += part.hpDelta;
    else other += part.hpDelta;
  }
  return burn > other ? "fire" : "poison";
}

function stepFromTempo(_battle: BattleState, tempo: TempoFx): ChoreoStep {
  const hurt = tempo.hits.some((hit) => hit.hpDelta > 0);
  return {
    kind: "tempo",
    actorId: tempo.ownerId,
    anim: hurt ? tempoHurtAnim(tempo.hits) : "heal",
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

// 待选结算的分镜: 选牌后续效果先演一帧出牌动作(打到敌人用卡面动画, 否则按护盾 / 增益演),
// 再接补推进时刻触发的敌人行动。
export function choiceSteps(battle: BattleState, plan: ChoicePlan): ChoreoStep[] {
  const steps: ChoreoStep[] = [];
  if (plan.actorId && plan.cardHits?.length) {
    const card = plan.sourceCardUid
      ? plan.cardSnapshot.cards[plan.sourceCardUid] ?? battle.cards[plan.sourceCardUid]
      : undefined;
    const hitsFoe = plan.cardHits.some((hit) => battle.enemyIds.includes(hit.id));
    const shieldOnly = plan.cardHits.every((hit) => hit.hpDelta === 0 && !hit.missed);
    steps.push({
      actorId: plan.actorId,
      anim: hitsFoe && card ? cardAnim(card) : shieldOnly ? "shield" : "buff",
      snapshot: plan.cardSnapshot,
      hits: plan.cardHits,
    });
  }
  steps.push(...plan.steps.map((step) => stepFromFx(battle, step)));
  return steps;
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
