import type { ItemDef } from "@/items/types";

/** 1 阶通用模组的族 id。掉落表写 family 时按稀有度右移, 阶 = 稀有度(《通用模组设计.md》§2)。 */
export const GENERIC_MODULE_FAMILY = "generic-module";

// 角色关键词模组 —— 装配舱制造产出。
export const MODULE_ITEM_DEFS: ItemDef[] = [
  {
    id: "rush-module",
    name: "速攻模组",
    category: "module",
    rarity: "fine",
    desc: "装配后，该卡牌变为速攻牌。",
    maxStack: 1,
    icon: "module",
  },
  {
    id: "discard-module",
    name: "弃牌模组",
    category: "module",
    rarity: "fine",
    desc: "装配后，该卡牌使用时额外弃置手牌最后一张。",
    maxStack: 1,
    icon: "module",
  },
  {
    id: "gap-module",
    name: "落差模组",
    category: "module",
    rarity: "fine",
    desc: "装配后，该卡费用 -1；使用后随机令手牌中费用最高的牌获得沉重。",
    maxStack: 1,
    icon: "module",
  },
  {
    id: "satellite-module",
    name: "卫星模组",
    category: "module",
    rarity: "fine",
    desc: "装配后，使用后随机为已有星辉的我方角色增加 1 层星辉。",
    maxStack: 1,
    icon: "module",
  },
  {
    id: "starloan-module",
    name: "借星模组",
    category: "module",
    rarity: "fine",
    desc: "装配后，打出时全队各消耗 1 层星辉，每点星辉使本卡数值 +20%。",
    maxStack: 1,
    icon: "module",
  },
  {
    id: "aim-module",
    name: "瞄准模组",
    category: "module",
    rarity: "fine",
    desc: "装配后附加瞄准；目标已有被瞄准时本卡数值 +30%。",
    maxStack: 1,
    icon: "module",
  },
  {
    id: "ripen-module",
    name: "催熟模组",
    category: "module",
    rarity: "fine",
    desc: "装配后，使用后随机使一张带培育的手牌培育层数 -1。",
    maxStack: 1,
    icon: "module",
  },
];

// ---------------------------------------------------------------------------
// 1 阶通用模组 —— 只从战斗掉落, 不可制造, 不进商店也不进回收台(不填 sellValue/buyValue)。
// ★ 阶 = 稀有度: 1 阶统一 fine, 名称直接带阶数字, 玩家不用读稀有度色就能比强弱。
// ---------------------------------------------------------------------------
function genericModuleT1(id: string, name: string, desc: string): ItemDef {
  return {
    id,
    name,
    category: "module",
    rarity: "fine",
    desc,
    maxStack: 1,
    icon: "module",
    familyId: GENERIC_MODULE_FAMILY,
  };
}

export const GENERIC_MODULE_ITEM_DEFS: ItemDef[] = [
  genericModuleT1(
    "attack-module-t1",
    "攻击力模组1",
    "装配后，使用该卡牌时，计算结果时额外获得 10 点攻击力。",
  ),
  genericModuleT1(
    "healpower-module-t1",
    "治愈力模组1",
    "装配后，使用该卡牌时，计算结果时额外获得 10 点治愈力。",
  ),
  genericModuleT1(
    "armorpen-module-t1",
    "穿甲模组1",
    "装配后，使用该卡牌时，计算结果时额外获得 5 点穿甲。",
  ),
  genericModuleT1(
    "crit-module-t1",
    "暴击模组1",
    "装配后，使用该卡牌时，计算结果时额外获得 25% 暴击率。",
  ),
  genericModuleT1(
    "precision-module-t1",
    "精准模组1",
    "装配后，使用该卡牌时，计算结果时额外获得 10% 命中率与 5 点精准。",
  ),
  genericModuleT1(
    "poison-module-t1",
    "淬毒模组1",
    "装配后，打出该卡牌后对目标施加攻击力 15% 层数的中毒，持续 2 回合。",
  ),
  genericModuleT1(
    "burn-module-t1",
    "燃烧模组1",
    "装配后，打出该卡牌后对目标施加攻击力 15% 层数的灼烧，持续 2 回合。",
  ),
];

/** 1 阶模组箱 —— 背包里打开, 随机开出一件 1 阶通用模组。开出的模组进待拾取框。 */
export const MODULE_CRATE_ITEM_DEFS: ItemDef[] = [
  {
    id: "module-crate-t1",
    name: "1 阶模组箱",
    category: "consumable",
    rarity: "fine",
    desc: "打开后随机开出一件 1 阶通用模组，模组会进入待拾取框。",
    maxStack: 1,
    icon: "consumable",
    use: { kind: "openModuleCrate", tier: 1 },
  },
];
