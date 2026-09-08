// 卡架上的一个货位: 纯展示型卡面 —— 只有卡面,
// 不带购买按钮; 点击只负责选中, 购买动作收敛在右侧详情栏。

import { useMemo } from "react";
import { makeCard } from "@/data";
import type { CardShopSlot } from "@/store/cardShopSlice";
import { cx } from "@/ui/common/cx";
import { InteractiveHint } from "@/ui/common/InteractiveHint";
import { DeckCard } from "@/ui/character/DeckCard";
import s from "./CardShopSlotCard.module.css";

interface Props {
  slot: CardShopSlot;
  index: number;
  selected: boolean;
  onSelect: (key: string) => void;
}

export function CardShopSlotCard({ slot, index, selected, onSelect }: Props) {
  const card = useMemo(
    () => ({ ...makeCard(slot.cardDefId), ownerCharId: slot.charId }),
    [slot.cardDefId, slot.charId],
  );
  return (
    <div className={cx(s.slot, slot.sold && s["is-sold"])}>
      <div className={s.frame} data-interactive-hint>
        <DeckCard
          card={card}
          index={index}
          selected={selected}
          className={s.card}
          hintClassName={s.hint}
          focusStyle="zoom"
          aria-label={slot.sold ? `${card.name}，已售出` : `${card.name}，售价 ${slot.price} 居民积分`}
          onClick={() => onSelect(slot.key)}
        />
        <InteractiveHint className={s.hint} />
        {slot.sold && <span className={s.soldMask}>已售出</span>}
      </div>
    </div>
  );
}
