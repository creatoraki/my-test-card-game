import type { BattleState, Card, CardAnim } from "@/engine";
import { ANIM } from "@/ui/battle/animations";
import { pickShot, type ShotPreset } from "./shots";

export interface ChoreoStep {
  actorId: string;
  anim: CardAnim;
  snapshot: BattleState;
  hits: { id: string; hpDelta: number; missed?: boolean }[];
  card?: Card;
}

export interface ShotPlan {
  step: ChoreoStep;
  preset: ShotPreset;
  targetIds: string[];
  focusIds: string[];
  keepCamera: boolean;
}

function killed(step: ChoreoStep, before: BattleState | undefined): boolean {
  if (!before) return false;
  return step.hits.some((hit) => before.combatants[hit.id]?.alive && !step.snapshot.combatants[hit.id]?.alive);
}

export function choreograph(steps: ChoreoStep[], initial: BattleState | undefined): ShotPlan[] {
  return steps.map((step, index) => {
    const targetIds = step.hits.length ? step.hits.map((hit) => hit.id) : [step.actorId];
    const stageFocusIds = step.hits
      .map((hit) => hit.id)
      .filter((id) => initial?.enemyIds.includes(id));
    const focusIds = stageFocusIds.length ? stageFocusIds : [step.actorId];
    const ratios = step.hits.map((hit) => {
      const target = initial?.combatants[hit.id] ?? step.snapshot.combatants[hit.id];
      return target?.maxHp ? hit.hpDelta / target.maxHp : 0;
    });
    const preset = pickShot({
      anim: step.anim,
      targetCount: targetIds.length,
      shake: ANIM[step.anim].shake,
      damageRatio: Math.max(0, ...ratios),
      isKill: killed(step, index === 0 ? initial : steps[index - 1]?.snapshot),
      targetInStage: stageFocusIds.length > 0,
      actorIsEnemy: initial?.enemyIds.includes(step.actorId) ?? false,
    });
    const previous = index > 0 ? steps[index - 1] : undefined;
    const previousFocusIds = previous
      ? previous.hits.map((hit) => hit.id).filter((id) => initial?.enemyIds.includes(id))
      : [];
    const previousFocus = previousFocusIds.length ? previousFocusIds : previous ? [previous.actorId] : [];
    const keepCamera = previousFocus.length === focusIds.length && previousFocus.every((id) => focusIds.includes(id));
    return { step, preset, targetIds, focusIds, keepCamera };
  });
}
