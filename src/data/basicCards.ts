import type { CardDef } from "../engine/types";

// 基础卡 —— 每个角色一套(id 前缀 charId), 三张 1 费:
// basic-attack 90% 攻击力伤害 / basic-heal 50% 治愈力治疗 / basic-guard 50% 治愈力护盾。
// rarity=basic 不进任何抽卡池、不计入限携, 但可被精简卡组移除。

export function basicCardId(charId: string, kind: "attack" | "heal" | "guard"): string {
  return `${charId}-basic-${kind}`;
}

export function makeBasicCardDefs(charId: string): CardDef[] {
  return [
    {
      id: basicCardId(charId, "attack"),
      name: "基础攻击",
      ownerCharId: charId,
      cost: 1,
      cardType: "normal",
      targeting: "foe",
      rarity: "basic",
      anim: "slash",
      effects: [{ type: "DAMAGE", multiplier: 0.9, target: "primary" }],
      text: "选择一名敌人，挥出一击造成 {0} 点伤害。",
    },
    {
      id: basicCardId(charId, "heal"),
      name: "基础治疗",
      ownerCharId: charId,
      cost: 1,
      cardType: "normal",
      targeting: "ally",
      rarity: "basic",
      anim: "heal",
      effects: [{ type: "HEAL", multiplier: 0.5, target: "primary" }],
      text: "选择一名友军，回复 {0} 点生命。",
    },
    {
      id: basicCardId(charId, "guard"),
      name: "基础防护",
      ownerCharId: charId,
      cost: 1,
      cardType: "normal",
      targeting: "ally",
      rarity: "basic",
      anim: "shield",
      effects: [{ type: "GAIN_SHIELD", multiplier: 0.5, target: "primary" }],
      text: "选择一名友军，为其获得 {0} 点护盾。",
    },
  ];
}

export function basicStartingCardIds(charId: string): string[] {
  return [
    basicCardId(charId, "attack"),
    basicCardId(charId, "attack"),
    basicCardId(charId, "heal"),
    basicCardId(charId, "heal"),
    basicCardId(charId, "guard"),
  ];
}
