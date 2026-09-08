import { useMemo, type CSSProperties } from "react";
import { getCharacter, makeCard } from "@/data";
import type { CharacterState } from "@/store/townStore";
import type { CardShopSlot } from "@/store/cardShopSlice";
import { DeckCard } from "@/ui/character/DeckCard";
import s from "./CardShopPanel.module.css";

const RARITY_LABEL = {
  common: "普通",
  uncommon: "罕见",
  rare: "稀有",
} as const;

interface Props {
  slot: CardShopSlot;
  character: CharacterState | undefined;
  index: number;
  affordable: boolean;
  onBuy: (key: string) => void;
}

export function CardShopSlotCard({ slot, character, index, affordable, onBuy }: Props) {
  const card = useMemo(
    () => ({ ...makeCard(slot.cardDefId), ownerCharId: slot.charId }),
    [slot.cardDefId, slot.charId],
  );
  const owner = character ? getCharacter(character.charId) : null;
  const disabled = slot.sold || !affordable;
  const buttonLabel = slot.sold ? "已售出" : affordable ? `购买，售价 ${slot.price} 居民积分` : "积分不足";

  return (
    <article className={`${s.slot} ${slot.sold ? s["is-sold"] : ""}`}>
      <div className={s.cardFrame}>
        <DeckCard card={card} index={index} selected={false} focusStyle="zoom" />
        {slot.sold && <div className={s.soldMask}>已售出</div>}
      </div>
      <div className={s.slotMeta}>
        <span className={s.owner} style={{ "--owner-color": owner?.color } as CSSProperties}>
          {owner?.name ?? "未知角色"}
        </span>
        <span className={s.rarity}>{RARITY_LABEL[slot.rarity]}</span>
        <button
          className={`${s.buy} ${!affordable && !slot.sold ? s["is-poor"] : ""}`}
          type="button"
          disabled={disabled}
          aria-label={buttonLabel}
          onClick={() => onBuy(slot.key)}
        >
          {slot.sold ? "已售出" : affordable ? `${slot.price} 积分` : "积分不足"}
        </button>
      </div>
    </article>
  );
}
