import type { CharacterState } from "@/store/townStore";
import type { EquipTarget } from "@/store/equipCraftSlice";
import { getCharacter, getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";

export interface EquipTargetEntry {
  target: EquipTarget;
  stack: ItemStack;
  ownerName?: string;
}

export function equipTargetKey(target: EquipTarget): string {
  return target.kind === "storage"
    ? `storage:${target.uid}`
    : `equipped:${target.charId}:${target.slot}`;
}

export function equipStackOf(
  storage: ItemStack[],
  characters: Record<string, CharacterState>,
  target: EquipTarget | null,
): ItemStack | null {
  if (!target) return null;
  if (target.kind === "storage") return storage.find((stack) => stack.uid === target.uid) ?? null;
  return characters[target.charId]?.equipped?.[target.slot] ?? null;
}

export function buildEquipTargets(
  storage: ItemStack[],
  characters: Record<string, CharacterState>,
): EquipTargetEntry[] {
  const stored = storage
    .filter((stack) => getItemDef(stack.itemId).category === "equipment")
    .map((stack) => ({ target: { kind: "storage", uid: stack.uid } as EquipTarget, stack }));
  const equipped = Object.values(characters).flatMap((character) =>
    (["weapon", "armor", "trinket"] as const).flatMap((slot) => {
      const stack = character.equipped?.[slot];
      if (!stack) return [];
      return [{
        target: { kind: "equipped", charId: character.charId, slot } as EquipTarget,
        stack,
        ownerName: getCharacter(character.charId).name,
      }];
    }),
  );
  return [...stored, ...equipped];
}
