import { memo } from "react";
import type { BattleState, Card } from "@/engine";
import { cardCost, playBlockReason, starlightPayment } from "@/engine";
import { HandCard } from "@/ui/battle/HandCard";
import type { HandAction } from "@/ui/battle/HandTools";
import s from "./HandTray.module.css";

interface RenderHandEntry {
  card: Card;
  leaving: boolean;
  purged: boolean;
  dealDelay: number;
}

interface Props {
  renderHand: RenderHandEntry[];
  battle: BattleState;
  discardingUids: Set<string>;
  isPlayerTurn: boolean;
  handAction: HandAction;
  selectedUid: string | null;
  playingOutUid: string | null;
  onCardClick: (uid: string) => void;
  onCardAction: (uid: string) => void;
  onCardExited: (uid: string) => void;
}

export const HandTray = memo(function HandTray({
  renderHand,
  battle,
  discardingUids,
  isPlayerTurn,
  handAction,
  selectedUid,
  playingOutUid,
  onCardClick,
  onCardAction,
  onCardExited,
}: Props) {
  return (
    <div className={s["hand-panel"]}>
      <div className={s["hand-tray"]} data-hand-tray data-hand-action={handAction ?? undefined}>
        <span className={s["hand-tray-rail"]} aria-hidden="true" />
        {renderHand.length === 0 && battle.hand.length === 0 && (
          <div className={s["empty-hand"]}>NO CARDS</div>
        )}
        {renderHand.map((entry) => {
          const { card } = entry;
          const leaving = entry.leaving || card.uid === playingOutUid;
          const purged = entry.purged;
          const block = leaving || !isPlayerTurn ? "other" : playBlockReason(battle, card.uid);
          return (
            <HandCard
              key={card.uid}
              card={card}
              dealDelay={entry.dealDelay}
              leaving={leaving}
              discarding={discardingUids.has(card.uid)}
              purged={purged}
              playable={block === null}
              unaffordable={block === "mana"}
              actionBadge={handAction}
              cost={cardCost(battle, card)}
              starPay={starlightPayment(battle, card)}
              selected={card.uid === selectedUid}
              onExited={onCardExited}
              onClick={onCardClick}
              onAction={onCardAction}
            />
          );
        })}
      </div>
    </div>
  );
});
