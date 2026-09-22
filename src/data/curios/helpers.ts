import type { MechanicalCritterId } from "./critters";
import type {
  CurioDecision,
  CurioEffect,
  CurioFailure,
  CurioMitigation,
  ItemMatch,
} from "./types";

type MitigationOptions = Omit<CurioMitigation, "when">;

/** 隐藏失败：基础概率、失败文案、惩罚，以及可压低或转化它的门槛。 */
export function fail(
  chance: number,
  story: string,
  effects: CurioEffect[],
  ...mitigations: CurioMitigation[]
): CurioFailure {
  return { chance, story, effects, mitigations: mitigations.length ? mitigations : undefined };
}

/** 执行者是指定职业时生效。 */
export function byJob(charId: string, options: MitigationOptions): CurioMitigation {
  return { when: { kind: "job", charId }, ...options };
}

/** 背包里有指定物品时自动生效，生效时消耗 1 个。 */
export function withItem(match: ItemMatch | string, options: MitigationOptions): CurioMitigation {
  const itemMatch = typeof match === "string" ? { itemIds: [match] } : match;
  return { when: { kind: "item", match: itemMatch }, ...options };
}

/** 喂养机械小生物：背包里有同一种对应食物 count 份时额外出现的选项。 */
export function feedDecision(
  id: string,
  label: string,
  story: string,
  critter: MechanicalCritterId,
  count: number,
  effects: CurioEffect[],
  failure?: CurioFailure,
): CurioDecision {
  return { id, label, story, feed: { critter, count }, effects, failure };
}
