import type { EnemyDef } from "../types";
import { arkDrops, ARK_MINION_BOONS } from "./shared";

export const IRRIGATION_SNAIL: EnemyDef = {
  id: "ark-irrigation-snail", name: "灌流蜗牛", emoji: "🐌", maxHp: 75, exp: 21,
  stats: { attack: 100, defense: 2, initiative: 17, critDamage: 150 },
  passiveDescription: "根网回灌：任意角色孢子萌发时，生命比例最低的友方回复 8 点生命。多个蜗牛分别触发。",
  moves: [
    { id: "ark-snail-spore", name: "黏孢弹", emoji: "🍄", cost: 3, delay: 2, kind: "attack", targeting: "foe", weight: 3, anim: "shot",
      effects: [{ type: "DAMAGE", multiplier: 0.375, target: "primary" }, { type: "APPLY_STATUS", status: "arkSpore", stacks: 1, target: "primary" }] },
    { id: "ark-snail-germinate", name: "催芽灌流", emoji: "🌱", cost: 4, delay: 3, kind: "special", targeting: "foe", weight: 1.5, anim: "poison",
      bias: [{ when: "anyAllyHpBelowPct", value: 70, multiplier: 2 }],
      effects: [{ type: "ARK_GERMINATE", target: "primary" }] },
    { id: "ark-snail-mist", name: "孢雾灌溉", emoji: "💧", cost: 6, delay: 4, kind: "buff", targeting: "allFoes", weight: 1, anim: "heal",
      effects: [{ type: "APPLY_STATUS", status: "arkSpore", stacks: 1, target: "allFoes" }, { type: "HEAL", amount: 5, target: "allAllies" }] },
  ],
  dropTable: arkDrops("minion", "standard-battery"), boonTable: ARK_MINION_BOONS,
};
