import { defineRelics } from "../defineRelic";

// 精良档祝福遗物。
export const FINE_BLESSING_RELIC_DEFS = defineRelics("blessing", "fine", [
  {
    id: "relic-stun-hammer",
    name: "眩晕锤",
    scope: "battle",
    desc: "每当洗牌时，将一张临时卡牌《眩晕锤》加入随机存活队员的手牌。",
  },
  {
    id: "relic-insurance-contract",
    name: "保险契约",
    scope: "battle",
    desc: "每场战斗中，队员濒死后的第一次致死判定必定顶住。",
  },
  {
    id: "relic-emergency-beacon",
    name: "应急信标",
    scope: "explore",
    desc: "每趟远征可使用一次：立即传送回任意已访问过的房间，不消耗净化粒子。",
  },
  {
    id: "relic-entropy-battery",
    name: "逆熵电池",
    scope: "battle",
    desc: "回合结束时未使用的法力水晶最多保留 2 点到下回合。",
  },
  {
    id: "relic-bounty-list",
    name: "悬赏名单",
    scope: "battle",
    desc: "本场战斗内每击杀一名敌人，全队攻击力 +8，可叠加。",
    on: "enemyKilled",
    effects: [{ type: "APPLY_STAT_MOD", target: "allAllies", stat: "attack", amount: 8 }],
  },
  {
    id: "relic-folding-crate",
    name: "折叠货箱",
    scope: "explore",
    desc: "小队负重适应 +5。",
  },
  {
    id: "relic-double-socket",
    name: "双头插座",
    scope: "battle",
    desc: "每回合首次连续打出 3 名不同队员的卡牌时，抽 1 张牌。",
  },
  {
    id: "relic-overload-fuse",
    name: "过载保险丝",
    scope: "battle",
    desc: "手牌上限 +1；每场战斗第一回合额外抽 1 张牌。",
    squadMods: { handLimit: 1 },
  },
  {
    id: "relic-prism-shard",
    name: "棱镜残片",
    scope: "battle",
    desc: "造成暴击时，对另一名随机敌人造成该次伤害 30% 的溅射伤害。",
  },
  {
    id: "relic-petri-dish",
    name: "培养皿",
    scope: "battle",
    desc: "带有中毒的敌人死亡时，其中毒层数的一半转移给随机另一名敌人。",
  },
  {
    id: "relic-family-photo",
    name: "全家福",
    scope: "battle",
    desc: "队伍中无阵亡队员时，全队攻击力与治愈力 +10；有队员阵亡后本场战斗失效。",
  },
  {
    id: "relic-purify-filter",
    name: "净化滤网",
    scope: "explore",
    desc: "在 4 回合内赢得战斗时，返还 3 点净化粒子。",
  },
]);
