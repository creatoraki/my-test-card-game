import type { Card, CardDef } from "@/engine/types";
import { getCardDef } from "./index";

export interface CardModuleDef {
  itemId: string;
  canEquip: (def: CardDef) => boolean;
  patch: Partial<Pick<CardDef, "cardType">>;
}

export const CARD_MODULES: CardModuleDef[] = [
  {
    itemId: "rush-module",
    canEquip: (def) => def.cardType === "normal",
    patch: { cardType: "fast" },
  },
];

export function getCardModule(itemId: string): CardModuleDef | undefined {
  return CARD_MODULES.find((module) => module.itemId === itemId);
}

export function canEquipModule(card: Card, itemId: string): boolean {
  const module = getCardModule(itemId);
  if (!module) return false;
  return module.canEquip(getCardDef(card.id));
}

export function recomputeCardModule(card: Card): void {
  const base = getCardDef(card.id);
  const module = card.cardModule ? getCardModule(card.cardModule.itemId) : undefined;
  const patchKeys = new Set<keyof CardModuleDef["patch"]>();
  for (const definition of CARD_MODULES) {
    for (const key of Object.keys(definition.patch) as Array<keyof CardModuleDef["patch"]>) {
      patchKeys.add(key);
    }
  }

  for (const key of patchKeys) {
    Object.assign(card, { [key]: base[key] });
  }
  for (const [key, value] of Object.entries(module?.patch ?? {})) {
    if (value !== undefined) Object.assign(card, { [key]: value });
  }
}