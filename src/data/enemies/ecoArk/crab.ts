import type { EnemyDef } from "../types";
import { arkDrops, ARK_MINION_BOONS } from "./shared";

export const MOSS_CRAB: EnemyDef = {
  id: "ark-moss-crab", name: "苔甲搬运蟹", emoji: "🦀", maxHp: 80, exp: 18,
  stats: { attack: 100, defense: 2, initiative: 20, critDamage: 150 },
  moves: [
    { id: "ark-crab-clamp", name: "钳锁扣押", emoji: "🦀", cost: 3, delay: 2, kind: "attack", targeting: "foe", weight: 3, anim: "smash",
      effects: [{ type: "DAMAGE", multiplier: 0.45, target: "primary" }, { type: "ARK_SEIZE_CARD", target: "primary" }] },
    { id: "ark-crab-crystal", name: "水晶扣押", emoji: "💎", cost: 4, delay: 3, kind: "attack", targeting: "foe", weight: 1.2, anim: "smash",
      effects: [{ type: "DAMAGE", multiplier: 0.30, target: "primary" }, { type: "ARK_SEIZE_MANA", target: "self" }] },
    { id: "ark-crab-carry", name: "根缠搬运", emoji: "🌱", cost: 5, delay: 2, kind: "special", targeting: "self", weight: 2, anim: "debuff",
      effects: [{ type: "ARK_CARRY_ROOTS", target: "self" }] },
    { id: "ark-crab-sweep", name: "苔藓横扫", emoji: "🍄", cost: 6, delay: 4, kind: "attack", targeting: "allFoes", weight: 1, anim: "smash",
      effects: [{ type: "DAMAGE", multiplier: 0.30, target: "allFoes" }, { type: "APPLY_STATUS", status: "arkSpore", stacks: 1, target: "allFoes" }] },
  ],
  dropTable: arkDrops("minion", "standard-gear"), boonTable: ARK_MINION_BOONS,
};
