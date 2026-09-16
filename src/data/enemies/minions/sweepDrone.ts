import type { EnemyDef } from "../types";
import { COMMON_BASE, generalDrop, LOW_BOONS } from "./shared";

export const SWEEP_DRONE: EnemyDef = {
  id: "sweep-drone",
  name: "清扫无人机",
  emoji: "🛸",
  maxHp: 70,
  exp: 12,
  stats: { attack: 70, defense: 0, dodgeRate: 0, initiative: 18, critDamage: 150 },
  moves: [
    {
      id: "sweep-bump",
      name: "清扫撞击",
      emoji: "⚔️",
      delay: 3,
      kind: "attack",
      targeting: "foe",
      weight: 2,
      anim: "slash",
      effects: [{ type: "DAMAGE", multiplier: 0.7, target: "primary" }],
    },
    {
      id: "sweep-crush",
      name: "高压压实",
      emoji: "💥",
      delay: 5,
      kind: "attack",
      targeting: "foe",
      targetPick: "withStatus",
      targetStatus: "burn",
      weight: 1,
      bias: [{ when: "anyFoeHasStatus", status: "burn", multiplier: 2.5 }],
      anim: "slash",
      effects: [{
        type: "DAMAGE",
        multiplier: 1.8,
        target: "primary",
        damageBonus: { when: "targetHasStatus", status: "burn", multiplier: 0.7 },
      }],
    },
    {
      id: "sweep-shred",
      name: "破盾旋刃",
      emoji: "🛡️",
      delay: 4,
      kind: "attack",
      targeting: "foe",
      targetPick: "highestShield",
      weight: 1,
      anim: "slash",
      effects: [
        {
          type: "DAMAGE",
          multiplier: 0.7,
          target: "primary",
          damageBonus: { when: "targetHasShield", multiplier: 0.6 },
        },
      ],
    },
  ],
  dropTable: [...COMMON_BASE, generalDrop("standard-battery", 0.05)],
  boonTable: LOW_BOONS,
};
