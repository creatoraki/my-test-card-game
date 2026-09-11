import { cardDisplayName, type Card } from "@/engine";
import { DeckCard } from "@/ui/character/DeckCard";
import { HoldButton } from "@/ui/common/HoldButton";
import { GrowthGlyph } from "./GrowthGlyph";
import s from "./GrowthSelection.module.css";

interface Props {
  mode: "draw" | "remove";
  cards: Card[];
  selectedUid: string | null;
  cost: number;
  minDeckSize: number;
  disabled: boolean;
  reason?: string;
  onSelect: (uid: string) => void;
  onConfirm: () => void;
  onDiscard: () => void;
  onBack: () => void;
}

export function GrowthSelection({ mode, cards, selectedUid, cost, minDeckSize, disabled, reason, onSelect, onConfirm, onDiscard, onBack }: Props) {
  const drawing = mode === "draw";
  const selected = cards.find((card) => card.uid === selectedUid);
  return <section className={s.selection} data-mode={mode}>
    <div className={s.header}>
      <button type="button" className={s.back} onClick={onBack}>‹ 返回成长</button>
      <h3><GrowthGlyph kind={mode} />{drawing ? "选择一张加入卡组" : "选择要移除的卡牌"}</h3>
      <span>{drawing ? "候选已保留，可返回后继续选择" : `${cards.length} 张 · 最少保留 ${minDeckSize} 张`}</span>
    </div>
    <div className={s.cards}>
      {cards.map((card, i) => (
        <DeckCard
          key={card.uid}
          card={card}
          index={i}
          selected={card.uid === selectedUid}
          focusStyle={drawing ? "zoom" : "lift"}
          onClick={() => onSelect(card.uid)}
          aria-label={`选择${cardDisplayName(card)}`}
        />
      ))}
      {cards.length === 0 && <p>暂无可选卡牌</p>}
    </div>
    <footer className={s.footer}>
      <div className={s.description}>
        <strong>{selected ? cardDisplayName(selected) : "点击卡牌查看并选中"}</strong>
        <span>{reason ?? (drawing ? "本次经验已支付，确认后将所选卡牌加入卡组" : `本次消耗 ${cost} 经验，移除后剩余 ${Math.max(0, cards.length - 1)} 张`)}</span>
        {!drawing && selected?.cardModule && <span>此卡已装配模组，移除时模组一并消失</span>}
      </div>
      {drawing ? (
        <>
          <button type="button" className={s.discard} disabled={disabled} onClick={onDiscard}>3 张都不要</button>
          <button type="button" className={s.confirm} disabled={disabled || !selected} onClick={onConfirm}><GrowthGlyph kind={mode} />确认加入</button>
        </>
      ) : (
        <HoldButton className={s.confirm} disabled={disabled || !selected} onComplete={onConfirm} aria-label="长按确认删卡">
          <GrowthGlyph kind={mode} />长按确认删卡
        </HoldButton>
      )}
    </footer>
  </section>;
}
