import type { BattleState } from "@/engine";
import { partyRedrawLimit, partyWaitLimit } from "@/engine";
import { DiscardIcon, RedrawIcon, WaitIcon } from "./icons";
import s from "./HandTools.module.css";

export type HandAction = "redraw" | "discard" | null;

interface Props {
  battle: BattleState;
  handAction: HandAction;
  isPlayerTurn: boolean;
  animating: boolean;
  onToggle: (action: Exclude<HandAction, null>) => void;
  onWait: () => void;
}

export function HandTools({ battle, handAction, isPlayerTurn, animating, onToggle, onWait }: Props) {
  const canUseHandActions = isPlayerTurn && !animating && battle.hand.length > 0;
  const redrawLimit = partyRedrawLimit(battle);
  const waitLimit = partyWaitLimit(battle);
  const redrawAvailable = canUseHandActions && battle.redrawsThisRound < redrawLimit;
  const canWait = isPlayerTurn && !animating && battle.waitsThisRound < waitLimit;

  return (
    <section className={s.toolGrid} aria-label="行动操作" onClick={(event) => event.stopPropagation()}>
      <button
        className={`${s.toolButton} ${handAction === "redraw" ? s.active : ""}`}
        type="button"
        aria-label="换牌"
        title={`本回合换牌 ${battle.redrawsThisRound}/${redrawLimit}`}
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
      <button
        className={s.toolButton}
        type="button"
        aria-label="待机"
        title={`本回合待机 ${battle.waitsThisRound}/${waitLimit} · 推进 1 时刻`}
        disabled={!canWait}
        onClick={onWait}
      >
        <WaitIcon />
        <span>待机</span>
      </button>
    </section>
  );
}