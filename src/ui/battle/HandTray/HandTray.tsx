import { memo } from "react";
import type { BattleState, Card } from "@/engine";
import { canPlay } from "@/engine";
import { HandCard } from "@/ui/battle/HandCard";
import type { HandAction } from "@/ui/battle/HandTools";
import s from "./HandTray.module.css";

interface RenderHandEntry {
  card: Card;
  leaving: boolean;
  dealDelay: number;
}

interface Props {
  renderHand: RenderHandEntry[];
  battle: BattleState;
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
          return (
            <HandCard
              key={card.uid}
              card={card}
              dealDelay={entry.dealDelay}
              leaving={leaving}
              playable={!leaving && isPlayerTurn && canPlay(battle, card.uid)}
              actionBadge={handAction}
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
