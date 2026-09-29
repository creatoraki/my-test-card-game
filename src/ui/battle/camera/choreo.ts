import type { BattleState, Card, CardAnim } from "@/engine";
import { ANIM } from "@/ui/battle/choreo/animations";
import { pickShot, SHOTS, type ShotPreset } from "./shots";

export interface ChoreoStep {
  actorId: string;
  anim: CardAnim;
  snapshot: BattleState;
  hits: { id: string; hpDelta: number; missed?: boolean; guard?: boolean }[];
  card?: Card;
  discardUid?: string;
  kind?: "tempo" | "reveal" | "flee" | "relic"; // 遗物只演图标触发与目标反馈
  relicId?: string;
}

export interface ShotPlan {
  step: ChoreoStep;
  preset: ShotPreset;
  targetIds: string[];
  focusIds: string[];
  keepCamera: boolean;
  // 本帧新倒下的单位(敌我都算, 逃跑不算)。按快照比对而非只看 hits: 反伤、遗物、翻牌结算
  // 打死的单位不在 hits 里, 也必须给足死亡停留, 否则下一帧开演会把消散演出切掉。
  deathIds: string[];
}

function killed(step: ChoreoStep, before: BattleState | undefined): boolean {
  if (!before) return false;
  return step.hits.some((hit) => before.combatants[hit.id]?.alive && !step.snapshot.combatants[hit.id]?.alive);
}

function deathIdsOf(step: ChoreoStep, before: BattleState | undefined): string[] {
  if (!before) return [];
  return Object.keys(step.snapshot.combatants).filter((id) => {
    const after = step.snapshot.combatants[id];
    return before.combatants[id]?.alive && !after.alive && !("fled" in after && after.fled);
  });
}

function focusIdsOf(step: ChoreoStep, initial: BattleState | undefined): string[] {
  const enemyFocusIds = step.hits
    .map((hit) => hit.id)
    .filter((id) => initial?.enemyIds.includes(id));
  if (enemyFocusIds.length) return enemyFocusIds;
  if (step.kind === "tempo") return step.hits.map((hit) => hit.id);
  return [step.actorId];
}

export function choreograph(steps: ChoreoStep[], initial: BattleState | undefined): ShotPlan[] {
  return steps.map((step, index) => {
    const before = index === 0 ? initial : steps[index - 1]?.snapshot;
    const deathIds = deathIdsOf(step, before);
    if (step.kind === "reveal") {
      return { step, preset: SHOTS.none, targetIds: [], focusIds: [], keepCamera: true, deathIds };
    }
    // 护航代挡的单位只演护盾抵挡, 不算本次攻击的受击目标(不影响单体 / 群体镜头判定)。
    const struck = step.hits.filter((hit) => !hit.guard);
    const targetIds = struck.length ? struck.map((hit) => hit.id) : [step.actorId];
    const stageFocusIds = step.hits
      .map((hit) => hit.id)
      .filter((id) => initial?.enemyIds.includes(id));
    const focusIds = focusIdsOf(step, initial);
    const ratios = step.hits.map((hit) => {
      const target = initial?.combatants[hit.id] ?? step.snapshot.combatants[hit.id];
      return target?.maxHp ? hit.hpDelta / target.maxHp : 0;
    });
    const preset = pickShot({
      anim: step.anim,
      targetCount: targetIds.length,
      shake: ANIM[step.anim].shake,
      damageRatio: Math.max(0, ...ratios),
      isKill: killed(step, before),
      targetInStage: stageFocusIds.length > 0,
      actorIsEnemy: initial?.enemyIds.includes(step.actorId) ?? false,
    });
    const previous = index > 0 ? steps[index - 1] : undefined;
    const previousFocus = previous ? focusIdsOf(previous, initial) : [];
    const keepCamera = previousFocus.length === focusIds.length && previousFocus.every((id) => focusIds.includes(id));
    return { step, preset, targetIds, focusIds, keepCamera, deathIds };
  });
}
