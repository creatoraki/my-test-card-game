import type { StatModifier } from "./types";

export type QuirkId = "fatigue" | "rickets" | "sloth";

export interface QuirkDef {
  id: QuirkId;
  name: string;
  emoji: string;
  desc: string;
  mod: StatModifier;
}

export const POLLUTION_RULES = {
  threshold: 100,
  perCard: 2,
  maxQuirks: 5,
} as const;

export const SICK_MOD: StatModifier = {
  pct: {
    attack: -10,
    defense: -10,
    initiative: -10,
  },
};

export const QUIRK_IDS: QuirkId[] = ["fatigue", "rickets", "sloth"];

export const QUIRK_DEFS: Record<QuirkId, QuirkDef> = {
  fatigue: {
    id: "fatigue",
    name: "乏力",
    emoji: "🥱",
    desc: "攻击力降低 20%。",
    mod: { pct: { attack: -20 } },
  },
  rickets: {
    id: "rickets",
    name: "佝偻病",
    emoji: "🦴",
    desc: "最大生命降低 20%。",
    mod: { pct: { maxHp: -20 } },
  },
  sloth: {
    id: "sloth",
    name: "树懒",
    emoji: "🦥",
    desc: "先手降低 20%。",
    mod: { pct: { initiative: -20 } },
  },
};

export function getQuirkDef(id: string): QuirkDef | undefined {
  return QUIRK_DEFS[id as QuirkId];
}