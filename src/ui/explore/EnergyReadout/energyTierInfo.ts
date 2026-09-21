// 净化粒子悬浮详情的数据: 当前档位 → 收益加成 + 敌人强化。纯函数, 不碰 DOM。
// 加成来自 explore/rules.ts 的 ENERGY_TIERS(rewardMultiplier, 同时作用于掉落、经验与居民积分);
// 敌人强化 = 档位带入战斗的「过载」层数 × engine/rules.ts 的每层数值。

import { OVERLOAD_STATUS_ID, RULES } from "@/engine/rules";
import { energyTier, toNextTier } from "@/explore/session";

export interface EnergyTierInfo {
  name: string;
  color: string;
  /** 收益加成百分比(1.35 → 35)。 */
  bonusPct: number;
  overloadStacks: number;
  attackBonus: number;
  blockBonusPct: number;
  /** 再消耗多少点跌入下一档; 已在末档为 null。 */
  toNext: number | null;
}

export function energyTierInfo(energy: number): EnergyTierInfo {
  const tier = energyTier(energy);
  const stacks = tier.enemyStatuses.find((status) => status.id === OVERLOAD_STATUS_ID)?.stacks ?? 0;
  return {
    name: tier.name,
    color: tier.color,
    bonusPct: Math.round((tier.rewardMultiplier - 1) * 100),
    overloadStacks: stacks,
    attackBonus: stacks * RULES.combat.overloadAttackPerStack,
    blockBonusPct: stacks * RULES.combat.overloadBlockPerStack,
    toNext: toNextTier(energy),
  };
}
