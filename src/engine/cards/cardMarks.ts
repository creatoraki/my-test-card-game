import type { Card, EffectDescriptor } from "../types";

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
  // 星印: 预言家专属卡牌增益。费用 +1, 打出收益以预言家为来源结算, 离开手牌时移除。
  starSeal?: true;
  // 带此标记的牌打出时视为速攻(不推进时刻)。
  playsAsFast?: true;
  // 常驻增益: 打出或离开手牌都不移除, 不能被搬运或剥离。
  persistent?: true;
}

export const CARD_MARK_DEFS: Record<string, CardMarkDef> = {
  starPact: {
    id: "starPact",
    name: "星契",
    emoji: "🌟",
    desc: "这张牌的所属者变为预言家，并可以用星辉替代法力水晶。本场战斗持续。",
    effects: [],
    persistent: true,
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
    desc: "星印。这张牌的费用 +1。打出或离手后移除。",
    effects: [],
    costDelta: 1,
    starSeal: true,
  },
  scorching: {
    id: "scorching",
    name: "灼热",
    emoji: "🔥",
    desc: "打出后，所属角色获得 2 层灼烧，持续 2 拍。",
    effects: [{ type: "APPLY_STATUS", status: "burn", stacks: 2, duration: 2, target: "self" }],
  },
  countercurrent: {
    id: "countercurrent",
    name: "逆流",
    emoji: "🌀",
    desc: "星印。这张牌的费用 +1。打出后预言家汇星 1，离手时移除。",
    effects: [{ type: "APPLY_STATUS", status: "starlight", stacks: 1, target: "self" }],
    costDelta: 1,
    starSeal: true,
  },
  domino: {
    id: "domino",
    name: "多米诺",
    emoji: "🁢",
    desc: "星印。这张牌的费用 +1。打出后抽 1 张牌，离手时移除。",
    effects: [{ type: "DRAW", amount: 1 }],
    costDelta: 1,
    starSeal: true,
  },
  cometTail: {
    id: "cometTail",
    name: "彗尾",
    emoji: "☄️",
    desc: "星印。这张牌的费用 +1。打出后对随机敌人造成预言家攻击力 30% 的伤害，离手时移除。",
    effects: [{ type: "DAMAGE", multiplier: 0.3, target: "randomFoe" }],
    costDelta: 1,
    starSeal: true,
  },
  streamer: {
    id: "streamer",
    name: "流光",
    emoji: "💫",
    desc: "星印。这张牌的费用 +1。打出时视为速攻，不推进时刻，离手时移除。",
    effects: [],
    costDelta: 1,
    starSeal: true,
    playsAsFast: true,
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

export function isPersistentMark(markId: string): boolean {
  return CARD_MARK_DEFS[markId]?.persistent === true;
}

// 可被搬运 / 剥离 / 打出清除的卡牌增益(常驻增益除外)。
export function transferableMarks(card: Pick<Card, "marks"> | undefined): string[] {
  return (card?.marks ?? []).filter((markId) => !isPersistentMark(markId));
}

// 离开手牌时移除的标记: 所有星印与纳刀。
export function dropsOnLeaveHand(markId: string): boolean {
  return markId === "noto" || CARD_MARK_DEFS[markId]?.starSeal === true;
}
