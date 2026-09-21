import type { EnemyDef } from "../types";
import { COMMON_BASE, generalDrop, LOW_BOONS } from "./shared";

export const MAINTENANCE_SPIDER: EnemyDef = {
  id: "maintenance-spider",
  name: "维修蜘蛛",
  emoji: "🕷️",
  maxHp: 62,
  exp: 12,
  stats: { attack: 60, defense: 0, dodgeRate: 0, initiative: 21, critDamage: 150 },
  moves: [
    {
      id: "spider-slag",
      name: "焊渣飞溅",
      emoji: "🔥",
      delay: 2,
      kind: "attack",
      targeting: "foe",
      weight: 2,
      anim: "fire",
      effects: [
        { type: "DAMAGE", multiplier: 0.6, target: "primary" },
        { type: "APPLY_STATUS", status: "static", stacks: 1, target: "primary" },
        { type: "MARK_CARDS", mark: "scorching", markPick: "targetHandRandom", amount: 1, target: "primary" },
      ],
    },
    {
      id: "spider-torch",
      name: "焊枪灼烧",
      emoji: "🔥",
      delay: 3,
      kind: "attack",
      targeting: "foe",
      weight: 2,
      anim: "fire",
      effects: [
        { type: "DAMAGE", multiplier: 0.55, target: "primary" },
        { type: "APPLY_STATUS", status: "burn", stacks: 3, duration: 3, target: "primary" },
      ],
    },
    {
      id: "spider-fume",
      name: "助燃喷雾",
      emoji: "🌫️",
      delay: 5,
      kind: "debuff",
      targeting: "allFoes",
      weight: 1,
      anim: "fire",
      effects: [
        { type: "DAMAGE", multiplier: 0.3, target: "allFoes" },
        { type: "APPLY_STATUS", status: "burn", stacks: 2, duration: 2, target: "allFoes" },
      ],
    },
  ],
  dropTable: [...COMMON_BASE, generalDrop("standard-gear", 0.05)],
  boonTable: LOW_BOONS,
};
