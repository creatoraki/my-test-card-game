import type { CardDef } from "@/engine/types";
import { HEXER_ID } from "./gates";

// 咒术师 · 罕见被动卡。
export const HEXER_PASSIVE_CARDS: CardDef[] = [
  {
    id: "grudge-doll",
    name: "咒怨人偶",
    ownerCharId: HEXER_ID,
    cost: 0,
    cardType: "passive",
    targeting: "none",
    rarity: "uncommon",
    anim: "debuff",
    // 结算不走被动事件分发, 由 engine/enemy/grudgeDoll 按这个标签在敌人出招前直接拦截。
    tags: ["reverseEnemyAttack"],
    effects: [],
    passive: { on: "enemyAttack", effects: [] },
    text: "被动：在手牌中时，满足恶毒 4 的敌人发动攻击招式时，该招式改为打向它自己；首领不会被反转，改为本次招式伤害减半。触发后本卡进入弃牌堆。",
  },
  {
    id: "water-clock",
    name: "漏刻",
    ownerCharId: HEXER_ID,
    cost: 0,
    cardType: "passive",
    targeting: "none",
    rarity: "uncommon",
    anim: "debuff",
    effects: [],
    passive: {
      on: "tickAdvanced",
      // 每推进 1 时刻判定一次, 只在"恰好推进到第 4 个"时成立 ⇒ 天然每回合 1 次。
      effects: [
        {
          type: "RANDOM_HEX",
          duration: 1,
          target: "allFoes",
          condition: "counterAtLeast",
          conditionCounter: "ticksThisRound",
          conditionValue: 4,
          conditionValueMax: 4,
        },
      ],
    },
    text: "被动：在手牌中时，本回合推进到第 4 个时刻后，对所有敌人各施加 1 种随机咒（厄运、怨咒、封印中尚未持有的一种），持续 1 回合。",
  },
];
