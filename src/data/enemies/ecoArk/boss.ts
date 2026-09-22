import type { EnemyDef } from "../types";
import { arkDrops } from "./shared";

/** 双行动，攻击间穿插培育与修复窗口；中毒协作不附带硬控。 */
export const ARK_BOSSES: EnemyDef[] = [{
  id: "ark-mother-core", name: "母树中枢", emoji: "🌳", maxHp: 230, exp: 95, actsPerRound: 2,
  stats: { attack: 110, defense: 8, initiative: 20, critDamage: 150 },
  moves: [
    { id: "ark-mother-root", name: "根脉贯穿", emoji: "🌿", delay: 4, kind: "attack", targeting: "foe", weight: 3, anim: "slash",
      effects: [{ type: "DAMAGE", multiplier: 1.05, target: "primary" }] },
    { id: "ark-mother-bloom", name: "全域授粉", emoji: "☠️", delay: 6, kind: "debuff", targeting: "allFoes", weight: 1, anim: "poison",
      bias: [{ when: "noFoeHasStatus", status: "poison", multiplier: 1.5 }],
      effects: [{ type: "DAMAGE", multiplier: 0.65, target: "allFoes" }, { type: "APPLY_STATUS", status: "poison", stacks: 2, duration: 3, target: "allFoes" }] },
    { id: "ark-mother-reap", name: "生态纠偏", emoji: "🌳", delay: 6, kind: "attack", targeting: "foe", targetPick: "withStatus", targetStatus: "poison", weight: 1, anim: "slash",
      bias: [{ when: "anyFoeHasStatus", status: "poison", multiplier: 2 }],
      effects: [{ type: "DAMAGE", multiplier: 1.6, target: "primary", damageBonus: { when: "targetHasStatus", status: "poison", multiplier: 0.2 } }] },
    { id: "ark-mother-canopy", name: "闭合冠层", emoji: "🛡️", delay: 5, kind: "block", targeting: "self", weight: 1.3, anim: "shield",
      effects: [{ type: "GAIN_SHIELD", amount: 22, target: "self" }] },
    { id: "ark-mother-renew", name: "休眠再生", emoji: "🌱", delay: 7, kind: "buff", targeting: "self", weight: 0.5, anim: "heal",
      bias: [{ when: "anyAllyHpBelowPct", value: 45, multiplier: 2 }],
      effects: [{ type: "HEAL", amount: 16, target: "self" }, { type: "APPLY_STATUS", status: "regen", stacks: 2, duration: 2, target: "self" }] },
  ],
  dropTable: arkDrops("boss", "standard-battery"),
  boonTable: [
    { kind: "healDew", chance: 0.8 }, { kind: "equipCrate", chance: 1 },
    { kind: "moduleCrate", chance: 0.5 }, { kind: "cardOffer", chance: 1 },
  ],
}];
