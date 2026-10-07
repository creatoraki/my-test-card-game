import type { EnemyDef } from "../types";
import { arkDrops, ARK_MINION_BOONS } from "./shared";

export const SEED_SENTRY: EnemyDef = {
  id: "ark-seed-sentry", name: "种荚哨兵", emoji: "🌰", maxHp: 65, exp: 17,
  stats: { attack: 100, defense: 0, initiative: 22, critDamage: 150 },
  moves: [
    { id: "ark-seed-burst", name: "点名齐射", emoji: "🎯", cost: 3, delay: 2, kind: "attack", targeting: "foe", weight: 3, anim: "shot",
      description: "造成 0.375 倍伤害，施加 2 层中毒，持续 2 拍。蓄力时随机目标；玩家最后完整打出的牌，其所属角色成为新目标。自动出牌、速攻也会更新目标，解缠不会。",
      effects: [{ type: "DAMAGE", multiplier: 0.375, target: "primary" }, { type: "APPLY_STATUS", status: "poison", stacks: 2, duration: 2, target: "primary" }] },
    { id: "ark-seed-pods", name: "寄生种荚", emoji: "🌰", cost: 4, delay: 3, kind: "attack", targeting: "foe", weight: 1.2, anim: "shot",
      effects: [{ type: "DAMAGE", multiplier: 0.30, target: "primary" }, { type: "APPLY_STATUS", status: "arkParasiticPods", stacks: 1, duration: 3, target: "primary" }] },
    { id: "ark-seed-blockade", name: "火力封锁", emoji: "🔒", cost: 6, delay: 4, kind: "special", targeting: "self", weight: 1, anim: "shot",
      description: "装填 3 发，封锁 3 个时刻。每张牌及其待选操作完整结算后，向所属角色射一发：0.30 倍伤害，1 层中毒持续 3 拍。到期余弹逐发随机射击；死亡或眩晕取消余弹。结束后完成两次其他技能才可再次封锁，同场只允许一只哨兵封锁。",
      effects: [{ type: "ARK_BARRAGE", target: "self" }] },
  ],
  dropTable: arkDrops("minion", "logic-cube"), boonTable: ARK_MINION_BOONS,
};
