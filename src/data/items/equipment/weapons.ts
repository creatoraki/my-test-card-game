import type { StatBlock } from "../../../engine/types";
import type { ItemDef, ItemRarity } from "../../../items/types";
import { RARITY_ORDER } from "../../../items/types";

interface WeaponFamily {
  familyId: string;
  name: string;
  desc: string;
  tiers: Record<ItemRarity, Partial<StatBlock>>;
}

const WEAPON_FAMILIES: WeaponFamily[] = [
  {
    familyId: "deflection-blade",
    name: "太刀",
    desc: "稳定提高攻击力与命中率的武器模板。",
    tiers: {
      common: { attack: 1, hitRate: 2 },
      fine: { attack: 2, hitRate: 2 },
      rare: { attack: 3, hitRate: 2 },
      epic: { attack: 4, hitRate: 4 },
      legendary: { attack: 5, hitRate: 6 },
    },
  },
  {
    familyId: "armor-piercing-crossbow",
    name: "穿甲弩",
    desc: "集中提高攻击力与穿甲的武器模板。",
    tiers: {
      common: { attack: 1, armorPen: 1 },
      fine: { attack: 2, armorPen: 1 },
      rare: { attack: 2, armorPen: 4 },
      epic: { attack: 3, armorPen: 5 },
      legendary: { attack: 4, armorPen: 6 },
    },
  },
  {
    familyId: "quickstrike-gauntlet",
    name: "拳套",
    desc: "强化攻击节奏与先手优势的速攻武器模板。",
    tiers: {
      common: { attack: 1, initiative: 1 },
      fine: { attack: 1, initiative: 2, hitRate: 2 },
      rare: { attack: 2, initiative: 3, hitRate: 1 },
      epic: { attack: 3, initiative: 4, hitRate: 1 },
      legendary: { attack: 4, initiative: 5, hitRate: 2 },
    },
  },
  {
    familyId: "hunting-rifle",
    name: "狙击枪",
    desc: "围绕暴击与远程命中构筑的精确武器模板。",
    tiers: {
      common: { attack: 1, critRate: 3 },
      fine: { attack: 1, critRate: 5, critDamage: 15 },
      rare: { attack: 1, critRate: 7, critDamage: 25, hitRate: 2 },
      epic: { attack: 2, critRate: 8, critDamage: 35, hitRate: 2 },
      legendary: { attack: 3, critRate: 10, critDamage: 45, hitRate: 2 },
    },
  },
  {
    familyId: "hunter-longbow",
    name: "弓箭",
    desc: "以穿甲和暴击为核心、逐步扩展输出的远程武器模板。",
    tiers: {
      common: { armorPen: 2, critRate: 4 },
      fine: { armorPen: 2, critRate: 4, attack: 1 },
      rare: { armorPen: 2, critRate: 6, attack: 1, critDamage: 20 },
      epic: { armorPen: 2, critRate: 7, attack: 2, critDamage: 25 },
      legendary: { armorPen: 4, critRate: 9, attack: 2, critDamage: 45 },
    },
  },
  {
    familyId: "glass-dagger",
    name: "匕首",
    desc: "以生命与防御为代价换取暴击和命中的极端武器模板。",
    tiers: {
      common: { attack: 2, critRate: 4, maxHp: -12, defense: -3 },
      fine: { attack: 2, critRate: 5, hitRate: 3, maxHp: -15, defense: -4 },
      rare: { attack: 3, critRate: 7, hitRate: 4, maxHp: -20, defense: -5 },
      epic: { attack: 4, critRate: 9, hitRate: 5, maxHp: -25, defense: -6 },
      legendary: { attack: 5, critRate: 11, hitRate: 6, maxHp: -30, defense: -7 },
    },
  },
  {
    familyId: "heavy-cannon",
    name: "火炮",
    desc: "极端武器模板：集中提高攻击力与穿甲，代价是命中率与先手。",
    tiers: {
      common: { attack: 3, hitRate: -6, initiative: -1 },
      fine: { attack: 3, armorPen: 2, hitRate: -7, initiative: -1 },
      rare: { attack: 4, armorPen: 3, hitRate: -9, initiative: -1 },
      epic: { attack: 5, armorPen: 4, hitRate: -10, initiative: -1 },
      legendary: { attack: 6, armorPen: 5, hitRate: -11, initiative: -1 },
    },
  },
  {
    familyId: "cross-sword",
    name: "盾斧",
    desc: "以先手为代价换取攻击力、生命与穿甲的极端武器模板。",
    tiers: {
      common: { attack: 2, maxHp: 15, initiative: -4 },
      fine: { attack: 2, maxHp: 20, armorPen: 1, initiative: -4 },
      rare: { attack: 3, maxHp: 25, armorPen: 2, initiative: -6 },
      epic: { attack: 4, maxHp: 35, armorPen: 3, initiative: -8 },
      legendary: { attack: 5, maxHp: 45, armorPen: 4, initiative: -10 },
    },
  },
];

function expandWeaponTiers(family: WeaponFamily): ItemDef[] {
  return RARITY_ORDER.map((rarity) => ({
    id: `${family.familyId}-${rarity}`,
    name: family.name,
    category: "equipment",
    rarity,
    desc: family.desc,
    maxStack: 1,
    slot: "weapon",
    familyId: family.familyId,
    mods: { flat: family.tiers[rarity] },
    icon: "weapon",
  }));
}

export const WEAPON_ITEM_DEFS: ItemDef[] = WEAPON_FAMILIES.flatMap(expandWeaponTiers);