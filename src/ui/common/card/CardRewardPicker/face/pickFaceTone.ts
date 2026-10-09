// 三选一卡面(新皮肤)的状态派生: 老手牌卡面的各种特殊态, 在新皮肤里统一收敛到「钢框外观」+「卡面浮层」两条通道。
// 钢框只认一个主色调(tone), 多个状态同场时按优先级取一个; 打不出(dim)与升级(upgraded)是独立维度, 可与任何 tone 叠加。
import type { Card } from "@/engine";

export type PickRimRarity = "uncommon" | "rare";
/** 钢框主色调, 优先级: 缠根 > 污染 > 激活 > 被动(与老卡面「污染与激活同场时边棱归污染」一致)。 */
export type PickRimTone = "rooted" | "contaminated" | "activated" | "passive";

export interface PickRimLook {
  rarity: PickRimRarity | null;
  tone: PickRimTone | null;
  dim: boolean;
  upgraded: boolean;
}

/** 卡面状态输入: 与 HandCard 的同名 prop 同义。 */
export interface PickFaceStatus {
  playable: boolean;
  unaffordable?: boolean;
  activated?: boolean;
}

export const isPassiveCard = (card: Card) => card.cardType === "passive";

/** 结构性打不出(费用不足、被动卡都不算), 与 HandCard 的 data-unplayable 判定同源。 */
export function isUnplayable(card: Card, status: PickFaceStatus): boolean {
  return !status.playable && !status.unaffordable && !isPassiveCard(card);
}

export function pickRimLook(card: Card, status: PickFaceStatus): PickRimLook {
  const rarity = card.rarity === "uncommon" || card.rarity === "rare" ? card.rarity : null;
  const tone: PickRimTone | null = card.rooted
    ? "rooted"
    : card.contaminated
      ? "contaminated"
      : status.activated
        ? "activated"
        : isPassiveCard(card)
          ? "passive"
          : null;
  return { rarity, tone, dim: isUnplayable(card, status), upgraded: card.upgraded };
}
