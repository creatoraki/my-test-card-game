import { useEffect } from "react";
import type { BattleState, Card } from "@/engine";
import { cardArt } from "@/ui/art/cardArt";
import s from "./PileDrawer.module.css";

type Pile = "draw" | "discard" | "exhaust";

const LABELS: Record<Pile, string> = { draw: "抽牌堆", discard: "弃牌堆", exhaust: "消耗堆" };

export function PileDrawer({ battle, pile, onClose }: { battle: BattleState; pile: Pile | null; onClose: () => void }) {
  useEffect(() => {
    if (!pile) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pile, onClose]);

  if (!pile) return null;
  const cards = battle[pile].map((uid) => battle.cards[uid]).filter(Boolean) as Card[];
  return (
    <div className={s.scrim} role="presentation" onClick={onClose}>
      <section className={s.drawer} role="dialog" aria-modal="true" aria-label={LABELS[pile]} onClick={(event) => event.stopPropagation()}>
        <div className={s.head}>
          <div>
            <span className={s.kicker}>PILE VIEW</span>
            <h2>{LABELS[pile]}</h2>
          </div>
          <button className={s.close} type="button" aria-label="关闭牌堆" onClick={onClose}>×</button>
        </div>
        {cards.length ? (
          <div className={s.grid}>
            {cards.map((card) => {
              const art = cardArt(card.id);
              return (
                <div className={s.card} key={card.uid}>
                  {art ? <img src={art} alt="" /> : <div className={s.noArt}>NO VISUAL</div>}
                  <div className={s.cardName}>{card.name}</div>
                  <span className={s.cost}>{card.cost}</span>
                </div>
              );
            })}
          </div>
        ) : <div className={s.empty}>EMPTY PILE</div>}
      </section>
    </div>
  );
}
