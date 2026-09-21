import type { EnemyDef } from "../types";
import { COMMON_BASE, generalDrop, LOW_BOONS } from "./shared";

export const GLASS_JELLY: EnemyDef = {
  id: "glass-jelly",
  name: "玻璃水母",
  emoji: "🎐",
  maxHp: 46,
  exp: 13,
  stats: { attack: 50, defense: 0, dodgeRate: 15, initiative: 23, critDamage: 150 },
  moves: [
    {
      id: "jelly-sting",
      name: "触须电刺",
      emoji: "⚡",
      delay: 2,
      kind: "attack",
      targeting: "foe",
      weight: 2,
      anim: "lightning",
      effects: [
        { type: "DAMAGE", multiplier: 0.7, target: "primary" },
        { type: "APPLY_STATUS", status: "static", stacks: 1, target: "primary" },
      ],
    },
    {
      id: "jelly-repair",
      name: "荧光修复",
      emoji: "💚",
      delay: 4,
      kind: "buff",
      targeting: "allAllies",
      weight: 1,
      bias: [{ when: "anyAllyHpBelowPct", value: 70, multiplier: 2.5 }],
      anim: "heal",
      effects: [
        { type: "HEAL", amount: 10, target: "allAllies" },
        { type: "APPLY_STATUS", status: "regen", stacks: 2, duration: 3, target: "allAllies" },
      ],
    },
    {
      id: "jelly-film",
      name: "导电薄膜",
      emoji: "🔌",
      delay: 4,
      kind: "buff",
      targeting: "ally",
      targetPick: "escortAlly",
      weight: 1,
      bias: [{ when: "allyCountBelow", value: 2, multiplier: 0 }],
      anim: "buff",
      effects: [
        { type: "GAIN_SHIELD", amount: 14, target: "primary" },
        { type: "APPLY_STATUS", status: "conductiveFilm", stacks: 1, target: "primary" },
      ],
    },
    {
      id: "jelly-pulse",
      name: "电荷脉冲",
      emoji: "⚡",
      delay: 5,
      kind: "attack",
      targeting: "allFoes",
      weight: 0.8,
      anim: "lightning",
      effects: [
        { type: "DAMAGE", multiplier: 0.3, target: "allFoes" },
        { type: "APPLY_STATUS", status: "static", stacks: 1, target: "allFoes" },
      ],
    },
  ],
  dropTable: [...COMMON_BASE, generalDrop("magnet", 0.05)],
  boonTable: LOW_BOONS,
};
