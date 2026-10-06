import type { CardDef } from "@/engine/types";
import { HEXER_ID, venom } from "./gates";

// 咒术师 · 直伤卡。咒术师的伤害以痛楚为主, 直伤只保留这几张: 起手补刀、饲咒重击、击杀转咒、操控与斩杀。
export const HEXER_STRIKE_CARDS: CardDef[] = [
  {
    id: "curse-nail",
    name: "咒钉",
    ownerCharId: HEXER_ID,
    cost: 1,
    cardType: "normal",
    targeting: "foe",
    rarity: "common",
    anim: "shot",
    effects: [
      { type: "APPLY_STATUS", status: "doom", stacks: 1, duration: 2, target: "primary" },
      { type: "DAMAGE", multiplier: 0.7, target: "primary" },
      { type: "RETURN_SELF_TO_HAND", keywordGate: venom(3) },
    ],
    text: "对目标施加厄运，然后造成 {1} 点伤害。恶毒 3：本卡返回手牌，并叠加 1 层回手负担（本回合费用 +1，回合结束移除）。",
  },
  {
    id: "death-knell",
    name: "丧钟",
    ownerCharId: HEXER_ID,
    cost: 2,
    cardType: "normal",
    targeting: "foe",
    rarity: "common",
    anim: "smash",
    effects: [
      { type: "DAMAGE", multiplier: 1.5, target: "primary" },
      { type: "GAIN_ENEMY_AP", amount: 2, target: "primary" },
    ],
    text: "造成 {0} 点伤害，然后目标获得 2 点行动点。",
  },
  {
    id: "soul-sever",
    name: "断魂咒",
    ownerCharId: HEXER_ID,
    cost: 2,
    cardType: "normal",
    targeting: "foe",
    rarity: "uncommon",
    anim: "blood-slash",
    effects: [
      {
        type: "DAMAGE",
        multiplier: 1.3,
        target: "primary",
        onKill: [{ type: "INHERIT_DEBUFFS", target: "randomFoe", excludePrimary: true, keywordGate: venom(4) }],
      },
    ],
    text: "造成 {0} 点伤害。恶毒 4：若本卡击杀目标，其全部诅咒转移给另一名随机敌人。",
  },
  {
    id: "string-puppet",
    name: "牵线傀儡",
    ownerCharId: HEXER_ID,
    cost: 2,
    cardType: "normal",
    targeting: "foe",
    rarity: "uncommon",
    anim: "slash",
    // 两条操控互斥: 恶毒未满足按 80%, 满足按 120%。伤害由目标自身打出, 咒术师本身不造成伤害。
    effects: [
      { type: "PUPPET_STRIKE", multiplier: 0.8, target: "randomFoe", excludePrimary: true, keywordGate: venom(3, true) },
      { type: "PUPPET_STRIKE", multiplier: 1.2, target: "randomFoe", excludePrimary: true, keywordGate: venom(3) },
    ],
    text: "目标对另一名随机敌人造成其自身攻击力 80% 的伤害；场上只有目标一名敌人时，改为对自身造成。恶毒 3：改为 120%。",
  },
  {
    id: "death-hex",
    name: "咒杀",
    ownerCharId: HEXER_ID,
    cost: 3,
    cardType: "normal",
    targeting: "foe",
    rarity: "rare",
    anim: "lightning",
    effects: [
      { type: "DAMAGE", multiplier: 1.5, target: "primary" },
      { type: "EXECUTE", executePct: 0.25, executeBossPct: 0.15, target: "primary", keywordGate: venom(4) },
    ],
    text: "造成 {0} 点伤害。恶毒 4：若目标生命不高于最大生命 25%（首领为 15%），直接击杀。",
  },
];
