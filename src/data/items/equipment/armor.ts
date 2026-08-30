import type { ItemDef } from "../../../items/types";
import { expandEquipTiers, ARMOR_PRESET, type EquipFamily } from "./equipModel";

const ARMOR_FAMILIES: EquipFamily[] = [
  {
    familyId: "raider-light-armor",
    name: "破袭轻甲",
    desc: "以攻击、暴击与防御构筑轻量进攻型防具，但牺牲最大生命值。",
    affixes: ["attack", "critRate", "defense"],
    drawback: "maxHp",
  },
  {
    familyId: "mobile-armor",
    name: "机动护甲",
    desc: "以闪避、先手与防御强化机动生存能力。",
    affixes: ["dodgeRate", "initiative", "defense"],
  },
  {
    familyId: "fire-control-armor",
    name: "火控战甲",
    desc: "以命中、攻击与防御强化稳定的火力输出。",
    affixes: ["hitRate", "attack", "defense"],
  },
  {
    familyId: "composite-armor",
    name: "复合护甲",
    desc: "以防御、生命与格挡构筑厚重防护，但牺牲攻击力。",
    affixes: ["defense", "maxHp", "blockRate"],
    drawback: "attack",
  },
  {
    familyId: "hazmat-suit",
    name: "防毒战衣",
    desc: "以异常抗性、生命与防御应对持续性环境威胁。",
    affixes: ["ailmentResist", "maxHp", "defense"],
  },
];

export const ARMOR_ITEM_DEFS: ItemDef[] = ARMOR_FAMILIES.flatMap((family) =>
  expandEquipTiers(family, ARMOR_PRESET),
);