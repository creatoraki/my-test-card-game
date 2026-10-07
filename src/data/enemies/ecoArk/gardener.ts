import type { EnemyDef } from "../types";
import { arkDrops, ARK_MINION_BOONS } from "./shared";

export const THORN_GARDENER: EnemyDef = {
  id: "ark-thorn-mantis", name: "棘刃园丁", emoji: "🌿", maxHp: 90, exp: 20,
  stats: { attack: 100, defense: 4, initiative: 15, critDamage: 150 },
  passiveDescription: "园丁庇护：只保护其他怪物，同一角色连续用卡牌攻击同一受庇护怪物时，伤害减半。每张牌只更新一次记忆，未命中不更新。园丁死亡后对应庇护消失；多只园丁不叠加，但会互相庇护。",
  moves: [
    { id: "ark-mantis-prune", name: "标定修剪", emoji: "✂️", cost: 3, delay: 2, kind: "attack", targeting: "foe", weight: 3, anim: "slash",
      effects: [{ type: "DAMAGE", multiplier: 0.525, target: "primary" }, { type: "ARK_MARK_GUARD", target: "primary" }] },
    { id: "ark-mantis-transplant", name: "病株移栽", emoji: "🌱", cost: 4, delay: 3, kind: "debuff", targeting: "foe", weight: 1.2, anim: "poison",
      effects: [{ type: "ARK_TRANSPLANT", target: "primary" }] },
    { id: "ark-mantis-harvest", name: "枯枝收割", emoji: "☠️", cost: 6, delay: 4, kind: "attack", targeting: "allFoes", weight: 1, anim: "slash",
      bias: [{ when: "noFoeHasStatus", status: "poison", multiplier: 0.5 }],
      effects: [{ type: "DAMAGE", multiplier: 0.30, target: "allFoes" }, { type: "TICK_STATUS", status: "poison", amount: 1, target: "allFoes" }] },
  ],
  dropTable: arkDrops("minion", "coil-spring"), boonTable: ARK_MINION_BOONS,
};
