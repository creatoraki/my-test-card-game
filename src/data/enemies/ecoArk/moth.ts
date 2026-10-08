import type { EnemyDef } from "../types";
import { arkDrops, ARK_MINION_BOONS } from "./shared";

export const SPORE_MOTH: EnemyDef = {
  id: "ark-spore-moth", name: "孢灯浮蛾", emoji: "🦋", maxHp: 60, exp: 20,
  stats: { attack: 100, defense: 0, dodgeRate: 12, initiative: 26, critDamage: 150 },
  moves: [
    { id: "ark-moth-strike", name: "鳞翅连击", emoji: "🦋", cost: 3, delay: 1, kind: "attack", targeting: "foe", weight: 3, anim: "slash",
      effects: [{ type: "DAMAGE", multiplier: 0.225, hits: 2, target: "primary" },
        { type: "MARK_CARDS", mark: "sporeSac", markPick: "targetHandRandom", amount: 1, target: "primary" }] },
    { id: "ark-moth-pollen", name: "授粉催行", emoji: "🌼", cost: 4, delay: 2, kind: "buff", targeting: "ally", weight: 1.5, anim: "buff",
      effects: [{ type: "GAIN_ENEMY_AP", amount: 2, target: "primary" }] },
    { id: "ark-moth-dance", name: "孢光群舞", emoji: "🍄", cost: 6, delay: 3, kind: "attack", targeting: "allFoes", weight: 1, anim: "poison",
      description: "全体角色受到 0.225 倍伤害并获得 1 层孢子。结算后自身获得 2 点行动点；点数足够时立即按权重追加一次鳞翅连击或授粉催行，正常扣点、不蓄力，不能追加群舞。",
      effects: [{ type: "DAMAGE", multiplier: 0.225, target: "allFoes" }, { type: "APPLY_STATUS", status: "arkSpore", stacks: 1, target: "allFoes" },
        { type: "GAIN_ENEMY_AP", amount: 2, target: "self" }] },
  ],
  dropTable: arkDrops("minion", "magnet"), boonTable: ARK_MINION_BOONS,
};
