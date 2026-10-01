import type { EnemyDef } from "../types";
import { COMMON_BASE, generalDrop, LOW_BOONS } from "./shared";

export const RADIO_BOT: EnemyDef = {
  id: "radio-bot",
  name: "收音机机器人",
  emoji: "📻",
  maxHp: 45,
  exp: 14,
  stats: { attack: 45, defense: 0, dodgeRate: 0, initiative: 20, critDamage: 150 },
  moves: [
    {
      id: "radio-peck",
      name: "电波啄击",
      emoji: "⚔️",
      cost: 3,
      delay: 1,
      kind: "attack",
      targeting: "foe",
      weight: 3,
      anim: "shot",
      effects: [
        { type: "DAMAGE", multiplier: 0.55, target: "primary" },
        { type: "APPLY_STATUS", status: "static", stacks: 1, target: "primary" },
      ],
    },
    {
      id: "radio-noise",
      name: "污染杂讯",
      emoji: "📡",
      cost: 3,
      delay: 1,
      kind: "debuff",
      targeting: "foe",
      weight: 2,
      anim: "shot",
      effects: [{ type: "GAIN_POLLUTION", amount: 5, target: "primary" }],
    },
    {
      id: "radio-full-band",
      name: "全频压制",
      emoji: "⚡",
      cost: 6,
      delay: 3,
      kind: "attack",
      targeting: "allFoes",
      weight: 1,
      anim: "lightning",
      effects: [
        { type: "DAMAGE", multiplier: 0.5, target: "allFoes" },
        { type: "APPLY_STATUS", status: "static", stacks: 1, target: "allFoes" },
      ],
    },
  ],
  dropTable: [...COMMON_BASE, generalDrop("logic-cube", 0.05)],
  boonTable: LOW_BOONS,
};
