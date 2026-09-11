import type { EffectDescriptor } from "./types";

export interface CardMarkDef {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  effects: EffectDescriptor[];
  costDelta?: number;
  costOverride?: number;
  preEffects?: EffectDescriptor[];
  onDiscardEffects?: EffectDescriptor[];
}

export const CARD_MARK_DEFS: Record<string, CardMarkDef> = {
  starPact: {
    id: "starPact",
    name: "星契",
    emoji: "🌟",
    desc: "这张牌可以用星辉替代法力水晶。",
    effects: [],
  },
  mindsEye: {
    id: "mindsEye",
    name: "心眼",
    emoji: "👁️",
    desc: "打出此牌后，丢弃手牌第一张。",
    effects: [{ type: "DISCARD", amount: 1, discardPick: "handTop" }],
  },
  heavy: {
    id: "heavy",
    name: "沉重",
    emoji: "🪨",
    desc: "这张牌的费用 +1。打出后移除。",
    effects: [],
    costDelta: 1,
  },
  swordMound: {
    id: "swordMound",
    name: "剑冢",
    emoji: "🪦",
    desc: "这张牌的费用 +1。",
    effects: [],
    costDelta: 1,
  },
  divineSight: {
    id: "divineSight",
    name: "神眼",
    emoji: "👁️",
    desc: "这张牌被丢弃时，将它的复制卡加入手牌。复制卡为消耗、虚无。",
    effects: [],
    onDiscardEffects: [{ type: "COPY_CARD_TO_HAND" }],
  },
  noto: {
    id: "noto",
    name: "纳刀",
    emoji: "⚔️",
    desc: "这张牌下回合开始取回手牌，费用为 0；若为攻击牌，本次伤害 +40%。",
    effects: [],
    costOverride: 0,
    preEffects: [{ type: "PLAY_STAT_BONUS", stat: "attack", amount: 40, pct: true }],
  },
};
