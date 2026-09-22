import type { EnemyDef } from "../types";
import { arkDrops, ARK_MINION_BOONS } from "./shared";

export const ARK_MINIONS: EnemyDef[] = [
  {
    id: "ark-moss-crab", name: "苔甲搬运蟹", emoji: "🦀", maxHp: 80, exp: 14,
    stats: { attack: 66, defense: 2, initiative: 18, critDamage: 150 },
    moves: [
      { id: "ark-crab-clamp", name: "液压钳击", emoji: "🦀", delay: 3, kind: "attack", targeting: "foe", weight: 3, anim: "slash",
        effects: [{ type: "DAMAGE", multiplier: 0.8, target: "primary" }] },
      { id: "ark-crab-shell", name: "苔甲覆盖", emoji: "🛡️", delay: 4, kind: "block", targeting: "ally", targetPick: "escortAlly", weight: 1, anim: "shield",
        effects: [{ type: "GAIN_SHIELD", amount: 14, target: "primary" }] },
      { id: "ark-crab-spill", name: "营养液泄漏", emoji: "🧪", delay: 5, kind: "debuff", targeting: "foe", weight: 1, anim: "poison",
        effects: [{ type: "DAMAGE", multiplier: 0.4, target: "primary" }, { type: "APPLY_STATUS", status: "poison", stacks: 2, duration: 2, target: "primary" }] },
    ],
    dropTable: arkDrops("minion", "standard-gear"), boonTable: ARK_MINION_BOONS,
  },
  {
    id: "ark-spore-moth", name: "孢灯浮蛾", emoji: "🦋", maxHp: 52, exp: 15,
    stats: { attack: 55, defense: 0, dodgeRate: 12, initiative: 22, critDamage: 150 },
    moves: [
      { id: "ark-moth-dust", name: "孢粉点射", emoji: "☠️", delay: 3, kind: "attack", targeting: "foe", weight: 3, anim: "poison",
        effects: [{ type: "DAMAGE", multiplier: 0.65, target: "primary" }, { type: "APPLY_STATUS", status: "poison", stacks: 2, duration: 2, target: "primary" }] },
      { id: "ark-moth-haze", name: "遮光鳞粉", emoji: "🌫️", delay: 5, kind: "debuff", targeting: "allFoes", weight: 1, anim: "poison",
        effects: [{ type: "DAMAGE", multiplier: 0.25, target: "allFoes" }, { type: "APPLY_STATUS", status: "weak", stacks: 1, duration: 1, target: "allFoes" }] },
      { id: "ark-moth-feed", name: "荧孢哺育", emoji: "🌱", delay: 4, kind: "buff", targeting: "ally", weight: 0.7, anim: "heal",
        bias: [{ when: "anyAllyHpBelowPct", value: 55, multiplier: 2 }],
        effects: [{ type: "HEAL", amount: 9, target: "lowestHpAlly" }] },
    ],
    dropTable: arkDrops("minion", "magnet"), boonTable: ARK_MINION_BOONS,
  },
  {
    id: "ark-thorn-mantis", name: "棘刃园丁", emoji: "🌿", maxHp: 69, exp: 15,
    stats: { attack: 67, defense: 0, initiative: 21, critDamage: 150 },
    moves: [
      { id: "ark-mantis-prune", name: "交错修枝", emoji: "✂️", delay: 3, kind: "attack", targeting: "foe", weight: 3, anim: "slash",
        effects: [{ type: "DAMAGE", multiplier: 0.38, hits: 2, target: "primary" }] },
      { id: "ark-mantis-harvest", name: "病株收割", emoji: "☠️", delay: 5, kind: "attack", targeting: "foe", targetPick: "withStatus", targetStatus: "poison", weight: 1, anim: "slash",
        bias: [{ when: "anyFoeHasStatus", status: "poison", multiplier: 2 }],
        effects: [{ type: "DAMAGE", multiplier: 0.8, target: "primary", damageBonus: { when: "targetHasStatus", status: "poison", multiplier: 0.2 } }] },
      { id: "ark-mantis-tangle", name: "缠枝绊索", emoji: "🌱", delay: 4, kind: "debuff", targeting: "foe", weight: 1, anim: "poison",
        effects: [{ type: "DAMAGE", multiplier: 0.45, target: "primary" }, { type: "APPLY_STATUS", status: "weak", stacks: 1, duration: 2, target: "primary" }] },
    ],
    dropTable: arkDrops("minion", "coil-spring"), boonTable: ARK_MINION_BOONS,
  },
  {
    id: "ark-irrigation-snail", name: "灌流蜗牛", emoji: "🐌", maxHp: 77, exp: 16,
    stats: { attack: 61, defense: 3, initiative: 19, critDamage: 150 },
    moves: [
      { id: "ark-snail-jet", name: "高压灌流", emoji: "💧", delay: 3, kind: "attack", targeting: "foe", weight: 3, anim: "shot",
        effects: [{ type: "DAMAGE", multiplier: 0.75, target: "primary" }] },
      { id: "ark-snail-cycle", name: "循环灌溉", emoji: "🌱", delay: 5, kind: "buff", targeting: "allAllies", weight: 0.8, anim: "heal",
        bias: [{ when: "anyAllyHpBelowPct", value: 60, multiplier: 2 }],
        effects: [{ type: "HEAL", amount: 7, target: "allAllies" }, { type: "APPLY_STATUS", status: "regen", stacks: 1, duration: 2, target: "allAllies" }] },
      { id: "ark-snail-film", name: "水膜封护", emoji: "🛡️", delay: 4, kind: "block", targeting: "self", weight: 1, anim: "shield",
        effects: [{ type: "GAIN_SHIELD", amount: 16, target: "self" }] },
    ],
    dropTable: arkDrops("minion", "standard-battery"), boonTable: ARK_MINION_BOONS,
  },
  {
    id: "ark-seed-sentry", name: "种荚哨兵", emoji: "🌰", maxHp: 45, exp: 13,
    stats: { attack: 50, defense: 0, initiative: 24, critDamage: 150 },
    moves: [
      { id: "ark-seed-burst", name: "种荚齐射", emoji: "🌰", delay: 2, kind: "attack", targeting: "foe", weight: 3, anim: "shot",
        effects: [{ type: "DAMAGE", multiplier: 0.65, target: "primary" }] },
      { id: "ark-seed-crack", name: "裂壳标记", emoji: "🎯", delay: 4, kind: "debuff", targeting: "foe", weight: 1, anim: "shot",
        effects: [{ type: "DAMAGE", multiplier: 0.35, target: "primary" }, { type: "APPLY_STATUS", status: "armorBreak", stacks: 1, duration: 2, target: "primary" }] },
      { id: "ark-seed-sow", name: "散播警戒", emoji: "🌿", delay: 5, kind: "attack", targeting: "allFoes", weight: 0.7, anim: "shot",
        effects: [{ type: "DAMAGE", multiplier: 0.35, target: "allFoes" }] },
    ],
    dropTable: arkDrops("minion", "logic-cube"), boonTable: ARK_MINION_BOONS,
  },
];
