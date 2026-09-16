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
];
