import type { EffectDescriptor } from "./types";

export interface CardMarkDef {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  effects: EffectDescriptor[];
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
};