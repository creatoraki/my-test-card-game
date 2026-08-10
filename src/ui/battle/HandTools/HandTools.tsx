import type { BattleState } from "@/engine";
import s from "./HandTools.module.css";

export type HandAction = "redraw" | "discard" | null;

interface Props {
  battle: BattleState;
  handAction: HandAction;
  isPlayerTurn: boolean;
  animating: boolean;
  onToggle: (action: Exclude<HandAction, null>) => void;
}

export function HandTools({ battle, handAction, isPlayerTurn, animating, onToggle }: Props) {
  const canUseHandActions = isPlayerTurn && !animating && battle.hand.length > 0;
  const redrawAvailable = canUseHandActions && battle.redrawsThisRound < 1;

  return (
    <section className={s.toolGrid} aria-label="手牌操作" onClick={(event) => event.stopPropagation()}>
      <button
        className={`${s.toolButton} ${handAction === "redraw" ? s.active : ""}`}
        type="button"
        aria-label="换牌"
        title={battle.redrawsThisRound >= 1 ? "本回合已换牌" : "换牌：选择一张手牌替换"}
        disabled={!redrawAvailable}
        onClick={() => onToggle("redraw")}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14.8-4.2L3 9m0-5v5h5M4 13a8 8 0 0 0 14.8 4.2L21 15m0 5v-5h-5" /></svg>
        <span>换牌</span>
      </button>
      <button
        className={`${s.toolButton} ${handAction === "discard" ? s.active : ""}`}
        type="button"
        aria-label="丢弃"
        title="丢弃：选择一张手牌置入弃牌堆"
        disabled={!canUseHandActions}
        onClick={() => onToggle("discard")}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></svg>
        <span>丢弃</span>
      </button>
    </section>
  );
}