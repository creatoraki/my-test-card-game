import { useEffect, useState } from "react";
import type { Card } from "@/engine";
import { makeCard } from "@/data";
import { CardView } from "@/ui/character/CardView";
import { DeckCard } from "@/ui/character/DeckCard";
import s from "./DeckForgeOverlay.module.css";

interface Props {
  mode: "draw" | "remove";
  pendingDraw: string[] | null;
  deck: Card[];
  minDeckSize: number;
  onPickDraw: (cardDefId: string) => void;
  onRemoveCard: (uid: string) => void;
  onCancelDraw: () => void;
  onClose: () => void;
}

export function DeckForgeOverlay({
  mode,
  pendingDraw,
  deck,
  minDeckSize,
  onPickDraw,
  onRemoveCard,
  onCancelDraw,
  onClose,
}: Props) {
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  useEffect(() => {
    setSelectedUid(null);
  }, [mode]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const selectedCard = deck.find((card) => card.uid === selectedUid) ?? null;

  return (
    <div className={s["forge-overlay"]} role="dialog" aria-modal="true" aria-label={mode === "draw" ? "扩充卡组" : "精简卡组"}>
      <button className={s["forge-backdrop"]} type="button" aria-label="关闭卡组锻造" onClick={onClose} />
      <section className={s["forge-modal"]}>
        <header className={s["forge-head"]}>
          <div>
            <span className={s["forge-kicker"]}>DECK FORGE / {mode === "draw" ? "DRAW" : "REMOVE"}</span>
            <h2 className={s["forge-title"]}>{mode === "draw" ? "扩充卡组" : "精简卡组"}</h2>
            <p className={s["forge-sub"]}>
              {mode === "draw" ? "从三张候选卡中选择一张加入个人卡组。" : `选择一张卡牌，再确认从卡组中移除。至少保留 ${minDeckSize} 张。`}
            </p>
          </div>
          <button className={s["forge-close"]} type="button" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>

        {mode === "draw" ? (
          <div className={s["draw-list"]}>
            {pendingDraw?.map((cardId, index) => (
              <div className={s["draw-choice"]} key={`${cardId}-${index}`}>
                <CardView card={makeCard(cardId)} playable selected={false} onClick={() => onPickDraw(cardId)} />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className={s["remove-list"]}>
              {deck.map((card, index) => (
                <div className={s["remove-choice"]} key={card.uid}>
                  <DeckCard
                    card={card}
                    index={index}
                    selected={card.uid === selectedUid}
                    onClick={() => setSelectedUid(card.uid)}
                  />
                </div>
              ))}
            </div>
            <footer className={s["forge-foot"]}>
              <span>{selectedCard ? `已选：${selectedCard.name}` : "请选择一张要移除的卡牌"}</span>
              <div className={s["forge-actions"]}>
                <button className={s["forge-button"]} type="button" onClick={onClose}>
                  取消
                </button>
                <button
                  className={s["forge-button"]}
                  type="button"
                  disabled={!selectedCard || deck.length <= minDeckSize}
                  onClick={() => {
                    if (selectedCard) onRemoveCard(selectedCard.uid);
                  }}
                >
                  确认删除
                </button>
              </div>
            </footer>
          </>
        )}

        {mode === "draw" && (
          <footer className={s["forge-foot"]}>
            <span>本次扩充已支付经验</span>
            <button className={s["forge-button"]} type="button" onClick={onCancelDraw}>
              放弃
            </button>
          </footer>
        )}
      </section>
    </div>
  );
}
