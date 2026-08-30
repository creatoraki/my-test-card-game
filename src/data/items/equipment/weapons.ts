import type { ItemDef } from "../../../items/types";
import { expandWeaponTiers, type WeaponFamily } from "./weaponModel";

const WEAPON_FAMILIES: WeaponFamily[] = [
  {
    familyId: "deflection-blade",
    name: "太刀",
    desc: "稳定提高攻击力与命中率的武器模板。",
    affixes: ["attack", "hitRate"],
  },
  {
    familyId: "quickstrike-gauntlet",
    name: "拳套",
    desc: "完全围绕低费快牌构筑的速攻武器模板。",
    affixes: ["lowCostMastery", "initiative"],
  },
  {
    familyId: "hunter-longbow",
    name: "弓箭",
    desc: "以穿甲和低费精通为核心的远程武器模板。",
    affixes: ["armorPen", "lowCostMastery"],
  },
  {
    familyId: "glass-dagger",
    name: "匕首",
    desc: "以生命上限为代价换取低费精通与暴击的极端速攻武器模板。",
    affixes: ["lowCostMastery", "critRate"],
    drawback: "maxHp",
  },
  {
    familyId: "armor-piercing-crossbow",
    name: "穿甲弩",
    desc: "以攻击力、穿甲和命中率构成的稳定远程武器模板。",
    affixes: ["attack", "armorPen", "hitRate"],
  },
  {
    familyId: "hunting-rifle",
    name: "狙击枪",
    desc: "围绕暴击、高费精通与爆伤构筑的精确武器模板。",
    affixes: ["critRate", "highCostMastery", "critDamage"],
  },
  {
    familyId: "heavy-cannon",
    name: "火炮",
    desc: "以高费精通和攻击力为核心、牺牲命中率换取穿甲的极端武器模板。",
    affixes: ["highCostMastery", "attack", "armorPen"],
    drawback: "hitRate",
  },
  {
    familyId: "cross-sword",
    name: "盾斧",
    desc: "以先手为代价换取生命、治愈与高费精通的守护型极端武器模板。",
    affixes: ["maxHp", "healPower", "highCostMastery"],
    drawback: "initiative",
  },
];

export const WEAPON_ITEM_DEFS: ItemDef[] = WEAPON_FAMILIES.flatMap(expandWeaponTiers);