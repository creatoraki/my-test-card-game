import type { ItemDef } from "../../../items/types";
import { expandWeaponTiers, type WeaponFamily } from "./weaponModel";

const WEAPON_FAMILIES: WeaponFamily[] = [
  {
    familyId: "deflection-blade",
    name: "太刀",
    desc: "以攻击力和命中率为核心的稳定近战武器。",
    affixes: ["attack", "hitRate"],
  },
  {
    familyId: "quickstrike-gauntlet",
    name: "拳套",
    desc: "围绕低费卡牌与行动节奏构筑的速攻武器。",
    affixes: ["lowCostMastery", "initiative"],
  },
  {
    familyId: "armor-piercing-crossbow",
    name: "穿甲弩",
    desc: "以攻击力、穿甲和命中率构成的稳定远程武器。",
    affixes: ["attack", "armorPen", "hitRate"],
  },
  {
    familyId: "hunting-rifle",
    name: "狙击枪",
    desc: "围绕暴击、高费精通与爆伤构筑的精确武器。",
    affixes: ["critRate", "highCostMastery", "critDamage"],
  },
  {
    familyId: "hunter-longbow",
    name: "弓箭",
    desc: "以穿甲和低费精通为核心的远程武器。",
    affixes: ["armorPen", "lowCostMastery"],
  },
  {
    familyId: "saber",
    name: "军刀",
    desc: "兼顾攻击、先手和命中率的制式近战武器。",
    affixes: ["attack", "initiative", "hitRate"],
  },
  {
    familyId: "glass-dagger",
    name: "匕首",
    desc: "牺牲生命上限，换取低费精通与暴击的极端速攻武器。",
    affixes: ["lowCostMastery", "critRate", "initiative"],
    drawback: "maxHp",
  },
  {
    familyId: "heavy-cannon",
    name: "火炮",
    desc: "以高费精通、攻击力和穿甲换取重击能力，但牺牲命中率。",
    affixes: ["highCostMastery", "attack", "armorPen"],
    drawback: "hitRate",
  },
  {
    familyId: "cross-sword",
    name: "盾斧",
    desc: "牺牲先手，换取生命上限、高费精通和攻击力的极端武器。",
    affixes: ["maxHp", "highCostMastery", "attack"],
    drawback: "initiative",
  },
  {
    familyId: "war-hammer",
    name: "锤子",
    desc: "牺牲先手，换取攻击、穿甲和爆伤的迟滞型重击武器。",
    affixes: ["attack", "armorPen", "critDamage"],
    drawback: "defense",
  },
  {
    familyId: "crystal-orb",
    name: "水晶球",
    desc: "强化高费卡牌并提供治愈力的法术支援武器。",
    affixes: ["highCostMastery", "healPower"],
  },
  {
    familyId: "spellbook",
    name: "魔法书",
    desc: "强化低费卡牌循环并提供治愈力的辅助武器。",
    affixes: ["lowCostMastery", "healPower"],
  },
];

export const WEAPON_ITEM_DEFS: ItemDef[] = WEAPON_FAMILIES.flatMap(expandWeaponTiers);