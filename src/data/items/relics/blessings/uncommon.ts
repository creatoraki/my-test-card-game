import type { ItemDef, RelicSpec } from "../../../../items/types";

const blessing = (id: string, name: string, desc: string, relic: Omit<RelicSpec, "polarity">): ItemDef => ({
  id,
  name,
  category: "relic",
  rarity: "fine",
  desc,
  maxStack: 1,
  relic: { polarity: "blessing", ...relic },
});

export const UNCOMMON_BLESSING_RELIC_DEFS: ItemDef[] = [
  blessing("relic-stun-hammer", "眩晕锤", "每当洗牌时，将一张临时卡牌《眩晕锤》加入随机存活队员的手牌。", { scope: "battle" }),
  blessing("relic-insurance-contract", "保险契约", "每场战斗中，队员濒死后的第一次致死判定必定顶住。", { scope: "battle" }),
  blessing("relic-emergency-beacon", "应急信标", "每趟远征可使用一次：立即传送回任意已访问过的房间，不消耗净化粒子。", { scope: "explore" }),
  blessing("relic-entropy-battery", "逆熵电池", "回合结束时未使用的法力水晶最多保留 2 点到下回合。", { scope: "battle" }),
  blessing("relic-bounty-list", "悬赏名单", "本场战斗内每击杀一名敌人，全队攻击力 +8，可叠加。", {
    scope: "battle",
    on: "enemyKilled",
    effects: [{ type: "APPLY_STAT_MOD", target: "allAllies", stat: "attack", amount: 8 }],
  }),
  blessing("relic-folding-crate", "折叠货箱", "小队负重适应 +5。", { scope: "explore" }),
  blessing("relic-double-socket", "双头插座", "每回合首次连续打出 3 名不同队员的卡牌时，抽 1 张牌。", { scope: "battle" }),
  blessing("relic-overload-fuse", "过载保险丝", "手牌上限 +1；每场战斗第一回合额外抽 1 张牌。", {
    scope: "battle",
    squadMods: { handLimit: 1 },
  }),
  blessing("relic-prism-shard", "棱镜残片", "造成暴击时，对另一名随机敌人造成该次伤害 30% 的溅射伤害。", { scope: "battle" }),
  blessing("relic-petri-dish", "培养皿", "带有中毒的敌人死亡时，其中毒层数的一半转移给随机另一名敌人。", { scope: "battle" }),
  blessing(
    "relic-family-photo",
    "全家福",
    "队伍中无阵亡队员时，全队攻击力与治愈力 +10；有队员阵亡后本场战斗失效。",
    { scope: "battle" },
  ),
  blessing("relic-purify-filter", "净化滤网", "在 4 回合内赢得战斗时，返还 3 点净化粒子。", { scope: "explore" }),
];
