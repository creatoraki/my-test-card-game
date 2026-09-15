import type { MechanicalCritterId } from "./critters";
import { critterFoods } from "./critters";
import type { CurioDecision, OfferingPart } from "./types";

export function exactItem(itemId: string, count: number): OfferingPart[] {
  return [{ match: { itemIds: [itemId] }, count }];
}

export function critterRecipe(id: MechanicalCritterId, count: number): OfferingPart[][] {
  return critterFoods(id).map((itemId) => exactItem(itemId, count));
}

export function offeringDecision(
  id: string,
  label: string,
  story: string,
  recipes: OfferingPart[][],
  effects: CurioDecision["effects"],
): CurioDecision {
  return { id, label, story, require: { kind: "offering", recipes }, effects };
}

export function jobDecision(
  id: string,
  label: string,
  story: string,
  charId: string,
  effects: CurioDecision["effects"],
): CurioDecision {
  return { id, label, story, require: { kind: "job", charId }, effects };
}
