import type { Rarity } from "@/engine";
import { deckUpgradeCost, RULES } from "@/engine";
import { availablePools, deckForgeCosts, type CharacterState } from "@/store/townStore";

export interface ForgeViewModel {
  costs: ReturnType<typeof deckForgeCosts>;
  hasPool: Record<Rarity, boolean>;
  canDraw: boolean;
  canRemove: boolean;
  canUpgrade: boolean;
  drawDisabledReason?: string;
  removeDisabledReason?: string;
  upgradeDisabledReason?: string;
}

export function forgeViewModel(cs: CharacterState, day: number): ForgeViewModel {
  const costs = deckForgeCosts(cs, day);
  const pools = availablePools(cs);
  const hasPool: Record<Rarity, boolean> = {
    common: pools.common.length > 0,
    uncommon: pools.uncommon.length > 0,
    rare: pools.rare.length > 0,
  };
  const hasDrawPool = hasPool.common || hasPool.uncommon || hasPool.rare;
  const canDraw = !cs.pendingDraw && cs.exp >= costs.draw && hasDrawPool;
  const canRemove = cs.exp >= costs.remove && cs.deck.length > cs.minDeckSize;
  const canUpgrade = costs.upgrade != null && cs.exp >= costs.upgrade;

  return {
    costs,
    hasPool,
    canDraw,
    canRemove,
    canUpgrade,
    removeDisabledReason: cs.deck.length <= cs.minDeckSize ? "卡组已达到最小张数" : "经验不足",
    upgradeDisabledReason: costs.upgrade == null ? `已满级 Lv.${cs.deckLevel}` : "经验不足",
    drawDisabledReason: !hasDrawPool
      ? "该角色暂无可抽卡池"
      : cs.exp < costs.draw
        ? "经验不足"
        : undefined,
  };
}

export const FORGE_LEVEL_MAX = RULES.deck.levelMax;
export const nextForgeUpgradeCost = (level: number): number | null => deckUpgradeCost(level + 1);
