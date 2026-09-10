import type { ItemDef, RelicSpec } from "../../../items/types";

const battle = (
  id: string,
  name: string,
  desc: string,
  relic: Omit<RelicSpec, "polarity" | "scope"> & { mods?: RelicSpec["mods"] },
  rarity: ItemDef["rarity"] = "fine",
): ItemDef => ({
  id,
  name,
  category: "relic",
  rarity,
  desc,
  maxStack: 1,
  relic: { polarity: "blessing", scope: "battle", ...relic },
});

export const BLESSING_RELIC_DEFS: ItemDef[] = [
  battle(
    "relic-safety-latch",
    "安全闩",
    "每两次队友受击时，全队获得 5 点护盾。",
    {
      on: "allyAttacked",
      every: 2,
      effects: [{ type: "GAIN_SHIELD", target: "allAllies", amount: 5 }],
    }, "common"),
  battle(
    "relic-even-draw",
    "双相抽牌器",
    "每个偶数回合开始时，额外抽 1 张牌。",
    { on: "roundStart", every: 2, effects: [{ type: "DRAW", amount: 1 }] },
    "rare",
  ),
  battle("recovery-oxygen", "循环供氧", "战斗中提高队伍治疗效果。", {
    on: "roundStart",
    mods: { flat: { healBoost: 10 } },
  }),
  battle("calm-breathing", "平静呼吸", "战斗中提高治疗、护盾、格挡与防御。", {
    on: "roundStart",
    mods: { flat: { healBoost: 12, shieldBoost: 12, blockRate: 8, defense: 3 } },
  }),
  battle("trial-overclock-feedback", "超频回授", "战斗中攻击力提高。", {
    on: "roundStart",
    mods: { pct: { attack: 12 } },
  }),
  battle("trial-emergency-infusion", "应急输液", "战斗中治疗与护盾效果提高。", {
    on: "roundStart",
    mods: { flat: { healBoost: 15, shieldBoost: 10 } },
  }),
  battle("trial-ballast-adaptation", "配重适应", "战斗中闪避率与格挡率提高。", {
    on: "roundStart",
    mods: { flat: { dodgeRate: 10, blockRate: 8 } },
  }),
  battle("trial-calibrated-lock", "校准锁定", "战斗中命中、暴击与精准提高。", {
    on: "roundStart",
    mods: { flat: { hitRate: 10, critRate: 12, precision: 8 } },
  }),
  battle("picnic-morning-meal", "暖胃", "战斗中提高队伍治疗与护盾效果。", {
    on: "roundStart",
    mods: { flat: { healBoost: 20, shieldBoost: 20 } },
  }),
  battle("picnic-happy-combo", "高糖冲击", "战斗中提高队伍暴击率与暴击伤害。", {
    on: "roundStart",
    mods: { flat: { critRate: 10, critDamage: 30 } },
  }),
  battle("picnic-energy-supply", "稳态供能", "战斗中提高队伍生命、防御与格挡。", {
    on: "roundStart",
    mods: { flat: { maxHp: 15, defense: 5, blockRate: 8 } },
  }),
  battle("picnic-party-platter", "会前动员", "战斗中提高队伍先手、命中与攻击。", {
    on: "roundStart",
    mods: { flat: { initiative: 6, hitRate: 10, attack: 5 } },
  }),
  battle("picnic-high-calorie-feast", "油脂燃烧", "战斗中提高队伍攻击、穿甲与暴击伤害。", {
    on: "roundStart",
    mods: { flat: { attack: 12, armorPen: 6, critDamage: 25 } },
  }),
  battle("picnic-full-dinner", "满席", "战斗中全面提升队伍攻防、先手、命中与治疗。", {
    on: "roundStart",
    mods: { flat: { attack: 6, healPower: 6, defense: 4, initiative: 4, hitRate: 6, healBoost: 10 } },
  }),
  battle("trade-overclock-protocol", "超频协议", "战斗中提高队伍先手。", {
    on: "roundStart",
    mods: { flat: { initiative: 4 } },
  }),
  battle("trade-recovery-oxygen", "循环供氧协议", "战斗中提高队伍治疗效果。", {
    on: "roundStart",
    mods: { flat: { healBoost: 10 } },
  }),
  battle("trade-fortification-grid", "防御网格", "战斗中提高队伍防御与格挡。", {
    on: "roundStart",
    mods: { flat: { defense: 3, blockRate: 5 } },
  }),
];
