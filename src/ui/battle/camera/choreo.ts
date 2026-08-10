import type { BattleState, Card, CardAnim } from "@/engine";
import { ANIM } from "@/ui/battle/animations";
import { pickShot, type ShotPreset } from "./shots";

export interface ChoreoStep {
  actorId: string;
  anim: CardAnim;
  snapshot: BattleState;
  hits: { id: string; hpDelta: number }[];
  card?: Card;
}

export interface ShotPlan {
  step: ChoreoStep;
  preset: ShotPreset;
  targetIds: string[];
  keepCamera: boolean;
}

function killed(step: ChoreoStep, before: BattleState | undefined): boolean {
  if (!before) return false;
  return step.hits.some((hit) => before.combatants[hit.id]?.alive && !step.snapshot.combatants[hit.id]?.alive);
}

export function choreograph(steps: ChoreoStep[], initial: BattleState | undefined): ShotPlan[] {
  return steps.map((step, index) => {
    const targetIds = step.hits.length ? step.hits.map((hit) => hit.id) : [step.actorId];
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
      targetInStage: step.hits.length > 0,
    });
    const previous = index > 0 ? steps[index - 1] : undefined;
    const previousTargets = previous?.hits.map((hit) => hit.id) ?? [];
    const keepCamera = previousTargets.length === targetIds.length && previousTargets.every((id) => targetIds.includes(id));
    return { step, preset, targetIds, keepCamera };
  });
}
