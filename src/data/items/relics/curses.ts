import type { ItemDef, RelicSpec } from "../../../items/types";

const curse = (
  id: string,
  name: string,
  desc: string,
  relic: Omit<RelicSpec, "polarity">,
  rarity: ItemDef["rarity"] = "common",
): ItemDef => ({
  id,
  name,
  category: "relic",
  rarity,
  desc,
  maxStack: 1,
  relic: { polarity: "curse", ...relic },
});

export const CURSE_RELIC_DEFS: ItemDef[] = [
  curse(
    "relic-broken-compass",
    "断针罗盘",
    "每抵达一个节点，额外损失 2 点净化粒子。",
    {
      scope: "explore",
      on: "nodeArrived",
      effects: [{ type: "GAIN_RESOURCE", resource: "energy", amount: -2 }],
      purifyTo: { rarity: "common" },
    },
  ),
  curse(
    "relic-static-parasite",
    "静电寄生体",
    "战斗中全队命中率下降 10。",
    {
      scope: "battle",
      on: "roundStart",
      mods: { flat: { hitRate: -10 } },
      purifyTo: { rarity: "common" },
    },
  ),
  curse(
    "relic-hollow-core",
    "空腔核心",
    "每打出 3 张牌，全队获得 1 点污染。",
    {
      scope: "battle",
      on: "cardPlayed",
      every: 3,
      effects: [{ type: "GAIN_POLLUTION", target: "allAllies", amount: 1 }],
      purifyTo: { rarity: "fine" },
    },
    "fine",
  ),
  curse(
    "relic-heavy-shadow",
    "沉影锚",
    "每场战斗胜利后额外损失 4 点净化粒子。",
    {
      scope: "explore",
      on: "battleVictory",
      effects: [{ type: "GAIN_RESOURCE", resource: "energy", amount: -4 }],
      purifyTo: { rarity: "rare" },
    },
    "rare",
  ),
  curse(
    "relic-bleeding-sigil",
    "渗血刻印",
    "每两次受到敌方攻击，全队失去 2 点生命。",
    {
      scope: "battle",
      on: "allyAttacked",
      every: 2,
      effects: [{ type: "LOSE_HP", target: "allAllies", amount: 2 }],
      purifyTo: { rarity: "rare" },
    },
    "rare",
  ),
];
