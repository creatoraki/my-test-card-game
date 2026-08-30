import type { StatBlock } from "../../../engine/types";
import { expandWeaponTiers, type WeaponFamily } from "./weaponModel";

const WEAPON_FAMILIES: WeaponFamily[] = [
  {
    familyId: "deflection-blade",
    name: "太刀",
    desc: "稳定提高攻击力与命中率的武器模板。",
    affixes: ["attack", "hitRate", "critRate"],
  },
  {
    familyId: "armor-piercing-crossbow",
    name: "穿甲弩",
    desc: "集中提高攻击力与穿甲的武器模板。",
    affixes: ["attack", "armorPen", "hitRate"],
  },
  {
    familyId: "quickstrike-gauntlet",
    name: "拳套",
    desc: "强化攻击节奏与战地续航的速攻武器模板。",
    affixes: ["attack", "initiative", "healPower"],
  },
  {
    familyId: "hunting-rifle",
    name: "狙击枪",
    desc: "围绕暴击与远程命中构筑的精确武器模板。",
    affixes: ["critRate", "attack", "critDamage"],
  },
  {
    familyId: "hunter-longbow",
    name: "弓箭",
    desc: "以穿甲和暴击为核心、逐步扩展输出的远程武器模板。",
    affixes: ["armorPen", "critRate", "attack"],
  },
  {
    familyId: "glass-dagger",
    name: "匕首",
    desc: "以生命与防御为代价换取暴击和命中的极端武器模板。",
    affixes: ["critRate", "attack", "hitRate"],
    drawback: "maxHp",
  },
  {
    familyId: "heavy-cannon",
    name: "火炮",
    desc: "极端武器模板：集中提高攻击力与穿甲，代价是命中率。",
    affixes: ["attack", "armorPen", "critDamage"],
    drawback: "hitRate",
  },
  {
    familyId: "cross-sword",
    name: "盾斧",
    desc: "以先手为代价换取生命、治愈与攻击的守护型极端武器模板。",
    affixes: ["maxHp", "healPower", "attack"],
    drawback: "initiative",
  },
];

export const WEAPON_ITEM_DEFS: ItemDef[] = WEAPON_FAMILIES.flatMap(expandWeaponTiers);