// ============================================================================
// 角色装备格 —— 与物品的「部位」(EquipSlot) 是两层概念:
//   · EquipSlot: 物品属性, 一件装备是武器 / 防具 / 饰品之一。
//   · GearSlot : 角色身上的格子, 每个部位一主一副共 6 格。
// 主格开局即有; 副格随卡组等级解锁 —— 2 级武器、4 级防具、6 级饰品。
// 等级只升不降, 所以已解锁的格子永远不会再被锁上, 不需要处理"降级掉装备"。
// ============================================================================

import type { EquipSlot, ItemStack } from "./types";

export type GearSlot = "weapon" | "weapon2" | "armor" | "armor2" | "trinket" | "trinket2";

/** 全部 6 格; 遍历顺序 = 主副成对, 按武器 → 防具 → 饰品。 */
export const GEAR_SLOTS: GearSlot[] = ["weapon", "weapon2", "armor", "armor2", "trinket", "trinket2"];

/** UI 按部位成行: 每行一主一副。 */
export const GEAR_ROWS: { kind: EquipSlot; slots: [GearSlot, GearSlot] }[] = [
  { kind: "weapon", slots: ["weapon", "weapon2"] },
  { kind: "armor", slots: ["armor", "armor2"] },
  { kind: "trinket", slots: ["trinket", "trinket2"] },
];

export const GEAR_SLOT_KIND: Record<GearSlot, EquipSlot> = {
  weapon: "weapon",
  weapon2: "weapon",
  armor: "armor",
  armor2: "armor",
  trinket: "trinket",
  trinket2: "trinket",
};

export const GEAR_SLOT_LABEL: Record<GearSlot, string> = {
  weapon: "武器",
  weapon2: "副武器",
  armor: "防具",
  armor2: "副防具",
  trinket: "饰品",
  trinket2: "副饰品",
};

/** 解锁所需卡组等级。 */
export const GEAR_SLOT_UNLOCK: Record<GearSlot, number> = {
  weapon: 0,
  weapon2: 2,
  armor: 0,
  armor2: 4,
  trinket: 0,
  trinket2: 6,
};

export type GearSet = Record<GearSlot, ItemStack | null>;

export function emptyGear(): GearSet {
  return { weapon: null, weapon2: null, armor: null, armor2: null, trinket: null, trinket2: null };
}

export function gearSlotUnlocked(slot: GearSlot, level: number): boolean {
  return level >= GEAR_SLOT_UNLOCK[slot];
}

/** 未解锁格的提示文案, 如「2级解锁」。 */
export function gearUnlockText(slot: GearSlot): string {
  return `${GEAR_SLOT_UNLOCK[slot]}级解锁`;
}

/**
 * 未指定格子时, 一件 kind 部位的装备该穿到哪: 优先同部位已解锁的空格, 都满了就替换主格。
 */
export function pickGearSlot(equipped: Partial<GearSet>, level: number, kind: EquipSlot): GearSlot {
  const row = GEAR_ROWS.find((entry) => entry.kind === kind)!;
  return row.slots.find((slot) => gearSlotUnlocked(slot, level) && !equipped[slot]) ?? row.slots[0];
}

/** 指定格子能否穿 kind 部位的装备: 部位对得上且已解锁。 */
export function canWearIn(slot: GearSlot, level: number, kind: EquipSlot): boolean {
  return GEAR_SLOT_KIND[slot] === kind && gearSlotUnlocked(slot, level);
}

/** 穿戴的落点: 指定了格子就校验, 没指定就自动挑; 不合法返回 null。 */
export function resolveGearSlot(
  equipped: Partial<GearSet>,
  level: number,
  kind: EquipSlot,
  slot?: GearSlot,
): GearSlot | null {
  if (slot) return canWearIn(slot, level, kind) ? slot : null;
  return pickGearSlot(equipped, level, kind);
}
