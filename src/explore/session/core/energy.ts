// 能量换算 —— 唯一真相点, UI 与战斗生成共用。

import type { EncounterModifier } from "@/engine/types";
import { ENERGY_TIERS } from "../../core/exploreRules";
import type { BattleTier, EnergyTier, ExploreState } from "../../types";

// ENERGY_TIERS 按 min 降序排列(80 / 60 / 40 / 20 / 0), 故第一个 min <= energy 的就是当前档。
export function energyTier(energy: number): EnergyTier {
  for (const t of ENERGY_TIERS) if (energy >= t.min) return t;
  return ENERGY_TIERS[ENERGY_TIERS.length - 1];
}

// 再掉多少点就跌入下一档; 已在末档返回 null(供 UI 决定要不要显示跨档预警)。
export function toNextTier(energy: number): number | null {
  const cur = energyTier(energy);
  const next = ENERGY_TIERS.find((t) => t.tier === cur.tier + 1);
  return next ? energy - next.min + 1 : null;
}

// 即设计文档 §5.1 的 K_energy。同时作用于经验、居民积分与实物掉落。
export function rewardMultiplier(energy: number): number {
  return energyTier(energy).rewardMultiplier;
}

// 粒子计价(交互 / 换房 / 战斗 / 行走)统一在 energyCost.ts, 这里转出供旧调用方沿用。
export { interactionCost, spendBattleEnergy } from "../../resources/energyCost";

// 能量档位 → 遭遇战改造。档位只把对应的 BUFF/状态层数带入战斗。
export function encounterModifier(energy: number): EncounterModifier {
  const t = energyTier(energy);
  return {
    enemyStatuses: t.enemyStatuses.map((st) => ({ ...st })),
  };
}

// 最近一次建立的战斗档位。档位在开战那一刻按房间深度抽定, 后续读取不再消耗 RNG。
export function battleTierOf(s: ExploreState): BattleTier {
  return s.roundBattleTier;
}

export const BATTLE_TIER_NAME: Record<BattleTier, string> = {
  t1: "难度1",
  t2: "难度2",
  t3: "难度3",
  t4: "难度4",
  t5: "难度5 · BOSS",
};
