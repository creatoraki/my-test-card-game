import type { StatModifier } from "../engine/types";
import type { EventChoice, ExploreEffect, EventOutcome } from "../explore/types";

export const outcome = (id: string, text: string, effects: ExploreEffect[]): EventOutcome => ({
  id,
  weight: 1,
  text,
  effects,
});

export const choice = (
  id: string,
  label: string,
  desc: string,
  story: string,
  outcomes: EventChoice["outcomes"],
  energyDelta = 0,
  choiceCost?: EventChoice["cost"],
): EventChoice => ({ id, label, desc, story, energyDelta, cost: choiceCost, outcomes });

export const item = (itemId: string, count = 1): ExploreEffect => ({ type: "GAIN_ITEM", itemId, count });
export const dmg = (percent: number): ExploreEffect => ({ type: "DAMAGE_PARTY_PERCENT", percent });
export const energy = (amount: number): ExploreEffect => ({ type: "MODIFY_ENERGY", amount });
export const contaminate = (count = 1): ExploreEffect => ({ type: "CONTAMINATE_CARDS", count });
export const burden = (count = 1): ExploreEffect => ({ type: "FORCE_ITEM", itemId: "heavy-burden", count });
export const heal = (percent: number): ExploreEffect => ({ type: "HEAL_PARTY", percent });
export const items = (...effects: ExploreEffect[]): ExploreEffect[] => effects;
export const partyExp = (amount: number): ExploreEffect => ({ type: "GAIN_EXP_PARTY", amount });
export const oneExp = (amount: number): ExploreEffect => ({ type: "GAIN_EXP_ONE", amount });
export const equip = (count: number, slot?: "weapon" | "armor" | "trinket"): ExploreEffect => ({
  type: "EQUIP_OFFER",
  count,
  slot,
});
export const cost = (itemId: string, count = 1) => ({ itemId, count });
export const aura = (id: string, name: string, desc: string, mods: StatModifier) => ({
  type: "GRANT_AURA" as const,
  aura: { id, name, desc, mods },
});

// 风险事件的概率结果: w 直接写设计文档里的百分数, 每个策略内累加为 100。
export const chance = (id: string, w: number, text: string, effects: ExploreEffect[]) => ({
  id,
  weight: w,
  text,
  effects,
});
