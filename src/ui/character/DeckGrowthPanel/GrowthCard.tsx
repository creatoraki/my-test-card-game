import type { Card } from "@/engine";
import { cardDisplayName } from "@/engine";
import { cardArt } from "@/ui/art/cardArt";
import { useCardText } from "@/ui/common/cardText";
import { CardTextRich } from "@/ui/common/CardTextRich";
import { GrowthGlyph } from "./GrowthGlyph";
import s from "./GrowthCard.module.css";

interface Props {
  card: Card;
  selected?: boolean;
  onSelect?: () => void;
  compact?: boolean;
}

/** 固定字号的成长面板卡面；复用素材查表和效果文案，不缩小战斗卡片。 */
export function GrowthCard({ card, selected = false, onSelect, compact = false }: Props) {
  const text = useCardText(card);
  const art = cardArt(card.id);
  const rarity = card.rarity ?? "common";
  const label = { basic: "基础", common: "普通", uncommon: "罕见", rare: "稀有" }[rarity];
  const content = <>
    <div className={s.art}>
      {art ? <img src={art} alt="" draggable={false} /> : <GrowthGlyph kind="growth" />}
      <span className={s.rarity}>{label}</span>
      <span className={s.cost}>{card.cardType === "passive" ? "被动" : `${card.cost} 费`}</span>
      <strong className={s.name}>{cardDisplayName(card)}</strong>
    </div>
    {!compact && <div className={s.text}><CardTextRich text={text} /></div>}
    {!compact && card.cardModule && <span className={s.module}>已装配模组</span>}
  </>;
  return onSelect ? (
    <button type="button" className={s.card} data-rarity={rarity} data-selected={selected} aria-pressed={selected} aria-label={`选择${cardDisplayName(card)}`} onClick={onSelect}>{content}</button>
  ) : <div className={s.card} data-rarity={rarity} data-compact={compact}>{content}</div>;
}
