import {
  QUIRK_DEFS,
  SICK_MOD,
  addStats,
  quirkIdsOf,
} from "../engine";
import { getBondDef, getCharacter, getItemDef } from "../data";
import { rollToFlat } from "../items/equipRoll";
import type { EquipSlot } from "../items/types";
import type { CharacterState } from "./townStore";
import type { StatBlock } from "../engine/types";

export interface EquipmentMods {
  flat?: Partial<StatBlock>;
  pct?: Partial<StatBlock>;
}

export const EQUIP_SLOTS: EquipSlot[] = ["weapon", "armor", "trinket"];

export function equipModsOf(cs: CharacterState): EquipmentMods {
  const flat: EquipmentMods["flat"] = {};
  const pct: EquipmentMods["pct"] = {};
  for (const slot of EQUIP_SLOTS) {
    const st = cs.equipped?.[slot];
    if (!st) continue;
    const def = getItemDef(st.itemId);
    const flatMods = st.roll ? rollToFlat(st.roll) : def.mods?.flat;
    if (flatMods) for (const [key, value] of Object.entries(flatMods)) {
      const stat = key as keyof NonNullable<EquipmentMods["flat"]>;
      flat[stat] = (flat[stat] ?? 0) + value;
    }
    for (const [key, value] of Object.entries(def.mods?.pct ?? {})) {
      const stat = key as keyof NonNullable<EquipmentMods["pct"]>;
      pct[stat] = (pct[stat] ?? 0) + value;
    }
  }
  return { flat, pct };
}

export function bondCountsOf(
  characters: Record<string, CharacterState>,
  party: string[],
): Record<string, number> {
  const out: Record<string, number> = {};
  const bump = (id: string | undefined) => {
    if (id && getBondDef(id)) out[id] = (out[id] ?? 0) + 1;
  };
  for (const charId of party) {
    const cs = characters[charId];
    if (!cs) continue;
    for (const slot of EQUIP_SLOTS) {
      const st = cs.equipped?.[slot];
      if (!st) continue;
      bump(getItemDef(st.itemId).affinity);
      bump(st.affinity);
    }
  }
  return out;
}

export function deriveStats(cs: CharacterState): StatBlock {
  const base = getCharacter(cs.charId).base;
  const eq = equipModsOf(cs);
  const flat = addStats(base, eq.flat ?? {});
  const pct: Partial<StatBlock> = { ...(eq.pct ?? {}) };
  const addPct = (mod: Partial<StatBlock> | undefined) => {
    for (const [key, value] of Object.entries(mod ?? {})) {
      const stat = key as keyof typeof pct;
      pct[stat] = (pct[stat] ?? 0) + value;
    }
  };
  if (cs.sick) addPct(SICK_MOD.pct);
  for (const quirkId of quirkIdsOf(cs.quirks)) addPct(QUIRK_DEFS[quirkId].mod.pct);
  const out = { ...flat };
  for (const key of Object.keys(out) as (keyof typeof out)[]) {
    out[key] = flat[key] * (1 + (pct[key] ?? 0) / 100);
  }
  out.maxHp = Math.max(1, out.maxHp);
  return out;
}

export function vitalsOf(cs: CharacterState): { hp: number; hpLimit: number; maxHp: number } {
  const maxHp = Math.max(1, Math.round(deriveStats(cs).maxHp));
  const hpLimit = Math.max(1, Math.min(maxHp, Math.round(cs.hpLimit ?? maxHp)));
  const hp = Math.max(1, Math.min(hpLimit, Math.round(cs.hp ?? hpLimit)));
  return { hp, hpLimit, maxHp };
}

export function shiftVitals(before: CharacterState, after: CharacterState): CharacterState {
  const prev = vitalsOf(before);
  const nextMax = Math.max(1, Math.round(deriveStats(after).maxHp));
  const hpLimit = Math.max(1, Math.min(nextMax, prev.hpLimit + (nextMax - prev.maxHp)));
  return { ...after, hpLimit, hp: Math.max(1, Math.min(hpLimit, prev.hp)) };
}