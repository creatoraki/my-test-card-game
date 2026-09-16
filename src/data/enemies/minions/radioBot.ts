import type { EnemyDef } from "../types";
import { COMMON_BASE, generalDrop, LOW_BOONS } from "./shared";

export const RADIO_BOT: EnemyDef = {
  id: "radio-bot",
  name: "收音机机器人",
  emoji: "📻",
  maxHp: 48,
  exp: 11,
  stats: { attack: 50, defense: 0, dodgeRate: 0, initiative: 24, critDamage: 150 },
  moves: [
    {
      id: "radio-peck",
      name: "电波啄击",
      emoji: "⚔️",
      delay: 2,
      kind: "attack",
      targeting: "foe",
      targetPick: "highestHealRoom",
      weight: 3,
      bias: [{ when: "anyFoeHealRoomAtLeast", value: 12, multiplier: 3 }],
      anim: "shot",
      effects: [{ type: "DAMAGE", multiplier: 0.5, target: "primary" }],
    },
    {
      id: "radio-static",
      name: "全频压制",
      emoji: "⚡",
      delay: 5,
      kind: "attack",
      targeting: "allFoes",
      weight: 1,
      anim: "lightning",
      effects: [{ type: "DAMAGE", multiplier: 0.25, target: "allFoes" }],
    },
    {
      id: "radio-broadcast",
      name: "污染广播",
      emoji: "📡",
      delay: 4,
      kind: "debuff",
      targeting: "foe",
      weight: 1,
      anim: "shot",
      effects: [
        { type: "DAMAGE", multiplier: 0.2, target: "primary" },
        { type: "GAIN_POLLUTION", amount: 6, target: "primary" },
      ],
    },
  ],
  dropTable: [...COMMON_BASE, generalDrop("logic-cube", 0.05)],
  boonTable: LOW_BOONS,
};
