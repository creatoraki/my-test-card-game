// ============================================================================
// 卡牌词条注册表。新增词条只需在这里注册判定与触发后的副作用。
// ============================================================================

import type { BattleState, Card } from "./types";

export interface KeywordDef {
  id: string;
  name: string;
  desc: string;
  triggers(state: BattleState, card: Card, primaryId?: string): number;
  onTriggered?(state: BattleState, card: Card, primaryId: string | undefined, times: number): void;
}

export const KEYWORD_DEFS: Record<string, KeywordDef> = {};

/*
 * 待接词条落点:
 * - 登阶: state.lastPlayedCard.cost < card.cost ? 1 : 0
 * - 日蚀: state.draw.slice(0, 3) 中同角色卡牌数量
 * - 月蚀: state.discard.slice(-3) 中同角色卡牌数量
 * - 瞄准: 目标有 aimed 时返回 1 并移除, 否则施加 aimed
 * - 共鸣: triggers 恒为 0, 在 onTriggered 中处理临时手牌费用强化
 */
