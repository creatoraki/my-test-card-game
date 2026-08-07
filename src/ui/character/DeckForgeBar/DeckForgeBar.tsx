import { cx } from "@/ui/common/cx";
import s from "./DeckForgeBar.module.css";

export interface DeckForgeCosts {
  draw: number;
  remove: number;
  upgrade: number | null;
}

interface Props {
  costs: DeckForgeCosts;
  exp: number;
  deckLevel: number;
  deckSize: number;
  minDeckSize: number;
  canDraw: boolean;
  canRemove: boolean;
  canUpgrade: boolean;
  onDraw: () => void;
  onRemove: () => void;
  onUpgrade: () => void;
  drawDisabledReason?: string;
  className?: string;
}

export function DeckForgeBar({
  costs,
  deckLevel,
  canDraw,
  canRemove,
  canUpgrade,
  onDraw,
  onRemove,
  onUpgrade,
  drawDisabledReason,
  className,
}: Props) {
  return (
    <div className={cx(s["forge-bar"], className)} aria-label="卡组锻造操作">
      <button
        className={cx(s["forge-action"], s["is-draw"])}
        type="button"
        disabled={!canDraw}
        title={!canDraw ? drawDisabledReason ?? "经验不足，或当前已有待处理候选" : undefined}
        onClick={onDraw}
      >
        <span className={s["forge-action-name"]}>扩充卡组</span>
        <span className={s["forge-action-cost"]}>{costs.draw} 经验</span>
      </button>
      <button
        className={cx(s["forge-action"], s["is-remove"])}
        type="button"
        disabled={!canRemove}
        onClick={onRemove}
      >
        <span className={s["forge-action-name"]}>精简卡组</span>
        <span className={s["forge-action-cost"]}>{costs.remove} 经验</span>
      </button>
      <button
        className={cx(s["forge-action"], s["is-upgrade"])}
        type="button"
        disabled={!canUpgrade}
        onClick={onUpgrade}
      >
        <span className={s["forge-action-name"]}>升级卡组</span>
        <span className={s["forge-action-cost"]}>
          {costs.upgrade == null ? `已满级 Lv.${deckLevel}` : `${costs.upgrade} 经验`}
        </span>
      </button>
    </div>
  );
}
