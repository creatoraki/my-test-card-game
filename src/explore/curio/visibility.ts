import { CORRIDOR_CURIOS } from "@/data/curios";
import type { CurioDef, CurioDecision, OfferingPart } from "@/data/curios/types";
import { matchOffering, partCanMatch } from "./offering";
import type { ExploreState } from "../types";
import { allowsCardRemoval } from "@/data/curios/growthBalance";

function activeObject(s: ExploreState) {
  const id = s.corridor?.activeObjectId;
  return id ? s.corridor?.objects.find((object) => object.id === id) : undefined;
}

function hasJob(s: ExploreState, charId: string): boolean {
  return s.party.some((member) => member.alive && member.charId === charId);
}

export function visibleDecisions(s: ExploreState, def: CurioDef): CurioDecision[] {
  return def.decisions.filter((decision) => {
    if (!allowsCardRemoval(s) && decision.effects.some(effect => effect.type === "FORGE_REMOVE")) return false;
    if (!decision.require) return true;
    if (decision.require.kind === "job") return hasJob(s, decision.require.charId);
    return false;
  });
}

export function canOfferAny(s: ExploreState, def: CurioDef): boolean {
  const stacks = s.backpack;
  return visibleDecisions(s, def).some((decision) =>
    decision.require?.kind === "offering" && decision.require.recipes.some((recipe) => recipeCanMatch(recipe, stacks)),
  );
}

function recipeCanMatch(recipe: OfferingPart[], stacks: ExploreState["backpack"]): boolean {
  const total = recipe.reduce((sum, part) => sum + Math.max(0, part.count), 0);
  const candidates = stacks.filter((stack) => recipe.some((part) => partCanMatch(part, stack)));
  const walk = (index: number, picked: ExploreState["backpack"], amount: number): boolean => {
    if (amount === total) return matchOffering([recipe], picked);
    if (amount > total || index >= candidates.length) return false;
    if (walk(index + 1, picked, amount)) return true;
    const stack = candidates[index];
    const max = Math.min(stack.count, total - amount);
    for (let count = 1; count <= max; count += 1) {
      if (walk(index + 1, [...picked, { ...stack, count }], amount + count)) return true;
    }
    return false;
  };
  return total > 0 && walk(0, [], 0);
}

export function activeCurioDef(s: ExploreState): CurioDef | null {
  const object = activeObject(s);
  return object ? CORRIDOR_CURIOS[object.kind] ?? null : null;
}
