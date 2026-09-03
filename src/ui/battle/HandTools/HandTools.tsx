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
  const redrawLeft = Math.max(0, redrawLimit - battle.redrawsThisRound);
  const waitLeft = Math.max(0, waitLimit - battle.waitsThisRound);
  const redrawAvailable = canUseHandActions && battle.redrawsThisRound < redrawLimit;
  const canWait = isPlayerTurn && !animating && battle.waitsThisRound < waitLimit;

  return (
    <section className={s.toolGrid} aria-label="行动操作" onClick={(event) => event.stopPropagation()}>
      <button
        className={`${s.toolButton} ${handAction === "redraw" ? s.active : ""}`}
        type="button"
        aria-label={`换牌，本回合剩余 ${redrawLeft} 次`}
        disabled={!redrawAvailable}
        onClick={() => onToggle("redraw")}
      >
        <RedrawIcon />
        {/* 图标右下角的剩余次数角标 */}
        <span className={s.useBadge} data-empty={redrawLeft === 0 || undefined}>
          {redrawLeft}
        </span>
        <span className={s.label}>换牌</span>
      </button>
      <button
        className={`${s.toolButton} ${handAction === "discard" ? s.active : ""}`}
        type="button"
        aria-label="丢弃"
        disabled={!canUseHandActions}
        onClick={() => onToggle("discard")}
      >
        <DiscardIcon />
        <span className={s.label}>丢弃</span>
      </button>
      <button
        className={s.toolButton}
        type="button"
        aria-label={`待机，本回合剩余 ${waitLeft} 次`}
        disabled={!canWait}
        onClick={onWait}
      >
        <WaitIcon />
        {/* 图标右下角的剩余次数角标 */}
        <span className={s.useBadge} data-empty={waitLeft === 0 || undefined}>
          {waitLeft}
        </span>
        <span className={s.label}>待机</span>
      </button>
    </section>
  );
}