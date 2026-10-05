import type { EnemyDef } from "../types";
import { arkDrops, ARK_ELITE_BOONS } from "./shared";

export const ARK_ELITES: EnemyDef[] = [
  {
    id: "ark-canopy-stag", name: "冠层巡猎鹿", emoji: "🦌", maxHp: 110, exp: 47,
    stats: { attack: 100, defense: 4, initiative: 20, critDamage: 150 },
    moves: [
      { id: "ark-stag-charge", name: "枝角冲锋", emoji: "🦌", cost: 4, delay: 3, kind: "attack", targeting: "foe", weight: 3, anim: "smash",
        effects: [{ type: "DAMAGE", multiplier: 0.987, target: "primary" }] },
      { id: "ark-stag-fan", name: "冠叶扫荡", emoji: "🌿", cost: 6, delay: 4, kind: "attack", targeting: "allFoes", weight: 1, anim: "slash",
        effects: [{ type: "DAMAGE", multiplier: 0.705, target: "allFoes" }] },
      { id: "ark-stag-shell", name: "树皮增殖", emoji: "🛡️", cost: 3, delay: 2, kind: "block", targeting: "self", weight: 1, anim: "shield",
        effects: [{ type: "GAIN_SHIELD", amount: 18, target: "self" }, { type: "APPLY_STATUS", status: "ironwall", stacks: 1, duration: 2, target: "self" }] },
      { id: "ark-stag-track", name: "循孢追猎", emoji: "☠️", cost: 5, delay: 4, kind: "attack", targeting: "foe", targetPick: "withStatus", targetStatus: "poison", weight: 1, anim: "slash",
        bias: [{ when: "anyFoeHasStatus", status: "poison", multiplier: 2 }],
        effects: [{ type: "DAMAGE", multiplier: 0.94, target: "primary", damageBonus: { when: "targetHasStatus", status: "poison", multiplier: 0.235 } }] },
    ],
    dropTable: arkDrops("elite", "coil-spring"), boonTable: ARK_ELITE_BOONS,
  },
  {
    id: "ark-nursery-keeper", name: "温室监护者", emoji: "🤖", maxHp: 115, exp: 49,
    stats: { attack: 100, defense: 4, initiative: 20, critDamage: 150 },
    moves: [
      { id: "ark-keeper-cut", name: "清除入侵株", emoji: "✂️", cost: 4, delay: 3, kind: "attack", targeting: "foe", weight: 3, anim: "slash",
        effects: [{ type: "DAMAGE", multiplier: 0.99, target: "primary" }] },
      { id: "ark-keeper-fumigate", name: "温室熏蒸", emoji: "☠️", cost: 6, delay: 4, kind: "debuff", targeting: "allFoes", weight: 1, anim: "poison",
        effects: [{ type: "DAMAGE", multiplier: 0.495, target: "allFoes" }, { type: "APPLY_STATUS", status: "poison", stacks: 3, duration: 2, target: "allFoes" }] },
      { id: "ark-keeper-graft", name: "应急嫁接", emoji: "🌱", cost: 5, delay: 4, kind: "buff", targeting: "ally", weight: 0.7, anim: "heal",
        bias: [{ when: "anyAllyHpBelowPct", value: 50, multiplier: 2 }],
        effects: [{ type: "HEAL", amount: 16, target: "lowestHpAlly" }, { type: "GAIN_SHIELD", amount: 12, target: "lowestHpAlly" }] },
      { id: "ark-keeper-isolate", name: "根网隔离", emoji: "🌿", cost: 3, delay: 2, kind: "debuff", targeting: "foe", weight: 1, anim: "poison",
        effects: [{ type: "DAMAGE", multiplier: 0.4455, target: "primary" }, { type: "APPLY_STATUS", status: "weak", stacks: 1, duration: 2, target: "primary" }] },
    ],
    dropTable: arkDrops("elite", "logic-cube"), boonTable: ARK_ELITE_BOONS,
  },
];
