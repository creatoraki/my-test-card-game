// ============================================================================
// 卡牌词条注册表。新增词条只需在这里注册判定与触发后的副作用。
// ============================================================================

import type { BattleState, Card } from "./types";
import { RULES } from "./rules";

export interface KeywordDef {
  id: string;
  name: string;
  desc: string;
  triggers(state: BattleState, card: Card, primaryId?: string): number;
  onTriggered?(state: BattleState, card: Card, primaryId: string | undefined, times: number): void;
}

export const KEYWORD_DEFS: Record<string, KeywordDef> = {};

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
 * - 瞄准: 目标有 aimed 时返回 1 并移除, 否则施加 aimed
 * - 共鸣: triggers 恒为 0, 在 onTriggered 中处理临时手牌费用强化
 */
