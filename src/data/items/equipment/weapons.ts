import type { ItemDef } from "@/items/types";
import { expandEquipTiers, WEAPON_PRESET, type EquipFamily } from "./equipModel";

// 武器特色词条: 速攻 / 斩杀 / 冲锋三种伤害精通分散到不同武器上, 先手可作为负面词条。
const WEAPON_FAMILIES: EquipFamily[] = [
  {
    familyId: "deflection-blade",
    name: "太刀",
    desc: "以攻击力和冲锋精通抢下首刀的稳定近战武器。",
    affixes: ["attack", "chargeMastery", "hitRate"],
  },
  {
    familyId: "quickstrike-gauntlet",
    name: "拳套",
    desc: "围绕速攻牌与低费卡牌连打构筑的速攻武器。",
    affixes: ["fastMastery", "lowCostMastery", "hitRate"],
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
    desc: "牺牲先手，换取对满血目标的冲锋精通与暴击爆发的精确武器。",
    affixes: ["critRate", "chargeMastery", "critDamage"],
    drawback: "initiative",
  },
  {
    familyId: "hunter-longbow",
    name: "弓箭",
    desc: "以穿甲和速攻精通为核心的轻快远程武器。",
    affixes: ["armorPen", "fastMastery"],
  },
  {
    familyId: "saber",
    name: "军刀",
    desc: "兼顾攻击、暴击和斩杀精通的制式近战武器。",
    affixes: ["attack", "critRate", "executeMastery"],
  },
  {
    familyId: "glass-dagger",
    name: "匕首",
    desc: "牺牲生命上限，换取速攻与斩杀爆发的极端速攻武器。",
    affixes: ["fastMastery", "executeMastery", "critDamage"],
    drawback: "maxHp",
  },
  {
    familyId: "heavy-cannon",
    name: "火炮",
    desc: "牺牲先手，换取高费精通、攻击力和穿甲的重击武器。",
    affixes: ["highCostMastery", "attack", "armorPen"],
    drawback: "initiative",
  },
  {
    familyId: "cross-sword",
    name: "盾斧",
    desc: "牺牲命中率，换取生命上限、高费精通和攻击力的极端武器。",
    affixes: ["maxHp", "highCostMastery", "attack"],
    drawback: "hitRate",
  },
  {
    familyId: "war-hammer",
    name: "锤子",
    desc: "牺牲先手，换取攻击、斩杀精通和穿甲的迟滞型重击武器。",
    affixes: ["attack", "executeMastery", "armorPen"],
    drawback: "initiative",
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

export const WEAPON_ITEM_DEFS: ItemDef[] = WEAPON_FAMILIES.flatMap((family) =>
  expandEquipTiers(family, WEAPON_PRESET),
);
