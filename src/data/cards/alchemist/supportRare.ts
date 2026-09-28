import type { CardDef } from "@/engine/types";

// 炼金术士稀有功能牌。
export const ALCHEMIST_RARE_SUPPORT_CARDS: CardDef[] = [
  {
    id: "resonance-tuning",
    name: "共振调谐",
    ownerCharId: "alchemist",
    cost: 2,
    cardType: "normal",
    targeting: "none",
    rarity: "rare",
    anim: "buff",
    effects: [
      { type: "RESONATE", amount: 2, resonatePick: "handAll" },
      { type: "GAIN_SQUAD_BUFF", squadBuff: "assembleC", target: "self" },
    ],
    text: "手牌中所有共鸣卡获得 2 次共鸣强化（无视费用限制）；组装 C。",
  },
  {
    id: "philosophers-stone",
    name: "贤者之石",
    ownerCharId: "alchemist",
    cost: 2,
    cardType: "normal",
    targeting: "none",
    rarity: "rare",
    exhaust: true,
    anim: "buff",
    effects: [{ type: "APPLY_STATUS", status: "philosophersStone", stacks: 1, target: "self" }],
    text: "本场战斗中，每次组装成功时，从本次消耗的组装 BUFF 中选择 1 种保留。打出后消耗。",
  },
  {
    id: "ouroboros",
    name: "衔尾蛇",
    ownerCharId: "alchemist",
    cost: 3,
    cardType: "normal",
    targeting: "none",
    rarity: "rare",
    exhaust: true,
    anim: "poison",
    effects: [{ type: "APPLY_STATUS", status: "ouroboros", stacks: 1, target: "self" }],
    text: "本场战斗中，敌人身上的灼烧某一段自然到期时，对其施加该段层数 50% 的中毒；中毒某一段自然到期时，对其施加该段层数 50% 的灼烧。转化出的段到期时继续转化，层数不足 1 时停止。打出后消耗。",
  },
];
