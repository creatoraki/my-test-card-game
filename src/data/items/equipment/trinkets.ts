import type { ItemDef } from "../../../items/types";
import { expandEquipTiers, TRINKET_PRESET, type EquipFamily } from "./equipModel";

const TRINKET_FAMILIES: EquipFamily[] = [
  {
    familyId: "tactical-goggles",
    name: "战术目镜",
    desc: "以精准和命中率为核心，稳定突破敌方闪避。",
    affixes: ["precision", "hitRate"],
  },
  {
    familyId: "quickstep-watch",
    name: "急行怀表",
    desc: "兼顾先手与闪避率，掌握战斗节奏并保持机动。",
    affixes: ["initiative", "dodgeRate"],
  },
  {
    familyId: "critical-prism",
    name: "暴击棱镜",
    desc: "集中强化暴击率与爆伤，放大关键一击的收益。",
    affixes: ["critRate", "critDamage"],
  },
  {
    familyId: "polarized-core",
    name: "偏振核心",
    desc: "强化护盾强度并兼顾防御与生命，适合护盾流派。",
    affixes: ["shieldBoost", "defense", "maxHp"],
  },
  {
    familyId: "medical-pendant",
    name: "医疗吊坠",
    desc: "放大治愈强度并提升治愈力与生命上限，强化队伍续航。",
    affixes: ["healBoost", "healPower", "maxHp"],
  },
  {
    familyId: "reaction-charm",
    name: "反应护符",
    desc: "兼顾格挡率、异常抗性与防御，稳住危险状态。",
    affixes: ["blockRate", "ailmentResist", "defense"],
  },
  {
    familyId: "life-thorn-ring",
    name: "生命棘环",
    desc: "以生命上限为核心，兼顾治愈力与格挡率，强化坚韧续航。",
    affixes: ["maxHp", "healPower", "blockRate"],
  },
  {
    familyId: "breach-beacon",
    name: "破阵信标",
    desc: "以穿甲和精准撕开防线，并提供稳定的攻击力。",
    affixes: ["armorPen", "precision", "attack"],
  },
  {
    familyId: "burden-module",
    name: "负重模块",
    desc: "以防御和生命承受额外负荷，并提供固定的负重适应。",
    affixes: ["defense", "maxHp", "burdenAdapt"],
  },
];

export const TRINKET_ITEM_DEFS: ItemDef[] = TRINKET_FAMILIES.flatMap((family) =>
  expandEquipTiers(family, TRINKET_PRESET),
);