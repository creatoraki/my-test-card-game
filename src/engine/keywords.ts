// ============================================================================
// 卡牌词条注册表。新增词条只需在这里注册判定与触发后的副作用。
// ============================================================================

import type { BattleState, Card } from "./types";
import { ops } from "./ops";
import { RULES } from "./rules";

export interface KeywordCtx {
  primaryId?: string;
  hitIds: string[];
}

export interface KeywordDef {
  id: string;
  name: string;
  desc: string;
  triggers(state: BattleState, card: Card, ctx: KeywordCtx): number;
  onTriggered?(state: BattleState, card: Card, ctx: KeywordCtx, times: number): void;
}

export const KEYWORD_DEFS: Record<string, KeywordDef> = {
  aim: {
    id: "aim",
    name: "瞄准",
    desc: "攻击未被瞄准的目标时为其附加被瞄准；再次用瞄准卡命中该目标时移除被瞄准并触发额外效果。",
    triggers: (state, card, ctx) => {
      const candidates =
        card.targeting === "allFoes"
          ? [...new Set(ctx.hitIds)].filter((id) => state.combatants[id]?.team === "enemy")
          : ctx.primaryId && ctx.hitIds.includes(ctx.primaryId)
            ? [ctx.primaryId]
            : [];
      let triggered = 0;
      for (const id of candidates) {
        const target = state.combatants[id];
        if (!target) continue;
        const aimed = target.statuses.find((status) => status.id === "aimed");
        if (aimed) {
          ops.applyStatus(state, id, "aimed", -1);
          triggered += 1;
        } else {
          ops.applyStatus(state, id, "aimed", 1);
        }
      }
      return triggered;
    },
  },
};

export interface CardKeywordInfo {
  id: string;
  name: string;
  desc: string;
}

export const CARD_KEYWORD_INFOS: CardKeywordInfo[] = [
  {
    id: "starlight",
    name: "汇星",
    desc: `打出后获得 ${RULES.combat.starlightMax} 层以内对应数量的星辉。`,
  },
  {
    id: "starPay",
    name: "应星",
    desc: "应星卡牌可以消耗星辉替代法力水晶，星辉不足时支付剩余法力水晶。",
  },
  {
    id: "waterfall",
    name: "瀑布",
    desc: "该牌为手牌中费用最高的牌时，触发额外效果。",
  },
  {
    id: "aim",
    name: "瞄准",
    desc: "攻击未被瞄准的目标时为其附加被瞄准；再次用瞄准卡命中该目标时移除被瞄准并触发额外效果。",
  },
  {
    id: "cultivate",
    name: "培育",
    desc: "该牌在手牌中每经过 1 个回合减少 1 层培育；归零后打出时触发额外效果。",
  },
  {
    id: "resonance",
    name: "共鸣",
    desc: "打出共鸣牌时，手牌中费用更低的共鸣牌获得 1 次强化。",
  },
  {
    id: "assemble",
    name: "组装",
    desc: "获得对应的组装部件；集齐任意 3 种时触发组装成功。",
  },
];

const CARD_KEYWORD_PATTERN = new RegExp(
  CARD_KEYWORD_INFOS
    .map(({ name }) => name)
    .sort((left, right) => right.length - left.length)
    .join("|"),
  "g",
);

export function splitCardKeywords(text: string): Array<{ text: string; keyword?: CardKeywordInfo }> {
  const segments: Array<{ text: string; keyword?: CardKeywordInfo }> = [];
  let cursor = 0;

  for (const match of text.matchAll(CARD_KEYWORD_PATTERN)) {
    const index = match.index ?? 0;
    if (index > cursor) segments.push({ text: text.slice(cursor, index) });
    const keyword = CARD_KEYWORD_INFOS.find((info) => info.name === match[0]);
    if (keyword) segments.push({ text: match[0], keyword });
    cursor = index + match[0].length;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}

export function cardKeywordsIn(text: string): CardKeywordInfo[] {
  const found: CardKeywordInfo[] = [];
  for (const segment of splitCardKeywords(text)) {
    if (segment.keyword && !found.includes(segment.keyword)) found.push(segment.keyword);
  }
  return found;
}

/*
 * 待接词条落点:
 * - 登阶: state.lastPlayedCard.cost < card.cost ? 1 : 0
 * - 日蚀: state.draw.slice(0, 3) 中同角色卡牌数量
 * - 月蚀: state.discard.slice(-3) 中同角色卡牌数量
 * - 共鸣: triggers 恒为 0, 在 onTriggered 中处理临时手牌费用强化
 */
