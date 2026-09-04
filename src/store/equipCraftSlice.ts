import {
  REFORGE_COST,
  getItemDef,
  nextEquipDef,
  reforgeCheck,
  upgradeCheck,
  upgradeRecipe,
} from "@/data";
import { consumeItems } from "@/items/inventory";
import { rollEquipment, upgradeEquipment } from "@/items/equipRoll";
import type { EquipRoll, EquipSlot, ItemStack } from "@/items/types";
import { shiftVitals } from "./characterStats";
import type { TownStore } from "./townStore";

export type EquipTarget =
  | { kind: "storage"; uid: string }
  | { kind: "equipped"; charId: string; slot: EquipSlot };

export interface PendingReforge {
  target: EquipTarget;
  roll: EquipRoll;
}

export interface EquipCraftSlice {
  pendingReforge: PendingReforge | null;
  upgradeEquip: (target: EquipTarget) => void;
  rollReforge: (target: EquipTarget) => void;
  applyReforge: (keepNew: boolean) => void;
}

function readEquip(state: TownStore, target: EquipTarget): ItemStack | null {
  if (target.kind === "storage") {
    return state.storage.find((stack) => stack.uid === target.uid) ?? null;
  }
  return state.characters[target.charId]?.equipped?.[target.slot] ?? null;
}

function writeEquip(
  state: TownStore,
  target: EquipTarget,
  next: ItemStack,
): Partial<TownStore> {
  if (target.kind === "storage") {
    return {
      storage: state.storage.map((stack) => (stack.uid === target.uid ? next : stack)),
    };
  }
  const character = state.characters[target.charId];
  if (!character) return {};
  return {
    characters: {
      ...state.characters,
      [target.charId]: shiftVitals(character, {
        ...character,
        equipped: { ...character.equipped, [target.slot]: next },
      }),
    },
  };
}

const randomPick = (size: number) => Math.floor(Math.random() * size);

export function createEquipCraftSlice(
  set: (partial: Partial<TownStore> | ((state: TownStore) => Partial<TownStore>)) => void,
  get: () => TownStore,
): EquipCraftSlice {
  return {
    pendingReforge: null,

    upgradeEquip: (target) => {
      const state = get();
      const stack = readEquip(state, target);
      if (!stack?.roll) return;
      const currentDef = getItemDef(stack.itemId);
      if (currentDef.category !== "equipment") return;
      const nextDef = nextEquipDef(currentDef);
      if (!nextDef?.model || !nextDef.slot) return;

      const check = upgradeCheck(nextDef, state.loot, state.storage);
      const recipe = upgradeRecipe(nextDef.slot, nextDef.rarity);
      if (!recipe || !check.ok) return;

      const nextRoll = upgradeEquipment(stack.roll, nextDef, randomPick);
      const nextStorage = recipe.materials.reduce(
        (storage, material) => consumeItems(storage, material.itemId, material.count),
        state.storage,
      );
      const nextStack = { ...stack, itemId: nextDef.id, roll: nextRoll };
      set({
        ...writeEquip({ ...state, storage: nextStorage }, target, nextStack),
        loot: state.loot - recipe.loot,
      });
    },

    rollReforge: (target) => {
      const state = get();
      if (state.pendingReforge) return;
      const stack = readEquip(state, target);
      if (!stack) return;
      const def = getItemDef(stack.itemId);
      if (def.category !== "equipment" || !def.model) return;

      const check = reforgeCheck(state.storage);
      if (!check.ok) return;
      const roll = rollEquipment(def, randomPick);
      if (!roll) return;

      set({
        storage: consumeItems(state.storage, REFORGE_COST.itemId, REFORGE_COST.count),
        pendingReforge: { target, roll },
      });
    },

    applyReforge: (keepNew) => {
      const state = get();
      const pending = state.pendingReforge;
      if (!pending) return;
      if (!keepNew) {
        set({ pendingReforge: null });
        return;
      }
      const stack = readEquip(state, pending.target);
      if (!stack) {
        set({ pendingReforge: null });
        return;
      }
      set({
        ...writeEquip(state, pending.target, { ...stack, roll: pending.roll }),
        pendingReforge: null,
      });
    },
  };
}