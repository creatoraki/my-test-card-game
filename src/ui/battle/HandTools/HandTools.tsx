import type { BattleState } from "@/engine";
import { DiscardIcon, RedrawIcon } from "./icons";
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
        <RedrawIcon />
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
        <DiscardIcon />
        <span>丢弃</span>
      </button>
    </section>
  );
}