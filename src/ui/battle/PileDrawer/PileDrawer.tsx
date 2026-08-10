import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { BattleState, Card } from "@/engine";
import { HandCard } from "@/ui/battle/HandCard";
import s from "./PileDrawer.module.css";

type Pile = "draw" | "discard" | "exhaust";

const LABELS: Record<Pile, string> = { draw: "抽牌堆", discard: "弃牌堆", exhaust: "消耗堆" };

export function PileDrawer({ battle, pile, onClose }: { battle: BattleState; pile: Pile | null; onClose: () => void }) {
  const [shown, setShown] = useState<Pile | null>(pile);
  const [closing, setClosing] = useState(false);
  const [hover, setHover] = useState<{ uid: string; x: number; y: number } | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setShown(pile);
    setClosing(false);
    setHover(null);
  }, [pile]);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    setHover(null);
    closeTimerRef.current = setTimeout(onClose, 150);
  };

  useEffect(() => {
    if (!shown) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && requestClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shown, closing, onClose]);

  if (!shown) return null;
  const pileCards = battle[shown].map((uid) => battle.cards[uid]).filter(Boolean) as Card[];
  const cards = [...pileCards].sort(
    (a, b) => a.name.localeCompare(b.name, "zh-Hans-CN") || a.uid.localeCompare(b.uid),
  );
  const hoveredCard = hover ? cards.find((card) => card.uid === hover.uid) : undefined;

  const handleCellEnter = (event: MouseEvent<HTMLDivElement>, card: Card) => {
    const scrimEl = scrimRef.current;
    if (!scrimEl) return;
    const scrimRect = scrimEl.getBoundingClientRect();
    const cellRect = event.currentTarget.getBoundingClientRect();
    const k = scrimRect.width / scrimEl.offsetWidth;
    setHover({
      uid: card.uid,
      x: (cellRect.left - scrimRect.left) / k,
      y: (cellRect.top - scrimRect.top) / k,
    });
  };

  return (
    <div ref={scrimRef} className={s.scrim} data-state={closing ? "out" : "in"} role="presentation" onClick={requestClose}>
      <section className={s.drawer} role="dialog" aria-modal="true" aria-label={LABELS[shown]} onClick={(event) => event.stopPropagation()}>
        <div className={s.head}>
          <div>
            <span className={s.kicker}>PILE VIEW</span>
            <h2>{LABELS[shown]} · {cards.length}</h2>
          </div>
          <button className={s.close} type="button" aria-label="关闭牌堆" onClick={requestClose}>×</button>
        </div>
        {cards.length ? (
          <div className={s.grid} data-pile-grid>
            {cards.map((card, index) => (
              <div
                className={s.cell}
                key={card.uid}
                onMouseEnter={(event) => handleCellEnter(event, card)}
                onMouseLeave={() => hover?.uid === card.uid && setHover(null)}
              >
                <HandCard
                  card={card}
                  variant="pile"
                  playable
                  selected={false}
                  dealDelay={Math.min(index, 14) * 22}
                />
              </div>
            ))}
          </div>
        ) : <div className={s.empty}>EMPTY PILE</div>}
      </section>
      {hoveredCard && hover && (
        <div className={s.magnify} data-pile-magnify style={{ left: hover.x, top: hover.y }}>
          <HandCard card={hoveredCard} variant="pile" playable selected={false} />
        </div>
      )}
    </div>
  );
}
