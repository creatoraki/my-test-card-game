import type { Card } from "@/engine";
import type { ItemStack } from "@/items/types";
import { canEquipModule } from "@/data";
import { DeckCard } from "@/ui/character/DeckCard";
import { cx } from "@/ui/common/cx";
import s from "./AssemblyDeckStrip.module.css";

interface Props {
  deck: Card[];
  selectedUid: string | null;
  moduleStacks: ItemStack[];
  onSelect: (uid: string) => void;
}

export function AssemblyDeckGrid({ deck, selectedUid, moduleStacks, onSelect }: Props) {
  return (
    <section className={s.gridPanel} data-assembly-deck-grid aria-label="卡组浏览">
      <div className={s.heading}>
        <span className={s.kicker}>CARD DECK</span>
        <span className={s.count}>{deck.length} 张</span>
      </div>
      {deck.length ? (
        <div className={s.track} role="list">
          {deck.map((card, index) => {
            const usable = Boolean(card.cardModule) || moduleStacks.some((stack) => canEquipModule(card, stack.itemId));
            return (
              <div
                key={card.uid}
                className={cx(s.card, !usable && s.dimmed)}
                role="listitem"
                data-installed={card.cardModule ? "true" : undefined}
              >
                <DeckCard
                  card={card}
                  selected={card.uid === selectedUid}
                  index={index}
                  onClick={() => onSelect(card.uid)}
                />
                {card.cardModule && <span className={s.moduleMark} aria-label="已装配模组" />}
              </div>
            );
          })}
        </div>
      ) : (
        <p className={s.empty}>当前角色没有卡牌</p>
      )}
    </section>
  );
}