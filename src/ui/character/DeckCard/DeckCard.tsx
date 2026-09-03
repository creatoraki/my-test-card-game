import type { CSSProperties } from "react";
import type { Card } from "@/engine";
import { getCharacter } from "@/data";
import { cx } from "@/ui/common/cx";
import { CardSelectFrame } from "@/ui/common/CardSelectFrame";
import { InteractiveHint } from "@/ui/common/InteractiveHint";
import { HandCard } from "@/ui/battle/HandCard";
import s from "./DeckCard.module.css";

interface Props {
  card: Card;
  selected: boolean;
  index: number;
  className?: string;
  focusStyle?: "lift" | "zoom";
  /**
   * 悬浮时在卡的**外侧**浮出四角 L 型边框(common/InteractiveHint)。
   * ⚠ 不是 CardSelectFrame —— 那套是「已选中」(青蓝、常驻、贴着卡内缘走斜角),
   *   这套是「你正指着这张」(天蓝、悬浮才出、直角 L、画在边框外面)。
   * 显隐全由 InteractiveHint 自己读宿主的 :hover / :focus-visible 驱动, 这里只负责
   * 满足它的宿主契约: 挂 data-interactive-hint, 且提示层是本按钮的**直接子元素**。
   */
  hoverHint?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function DeckCard({
  card,
  selected,
  index,
  className,
  focusStyle = "lift",
  hoverHint = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
}: Props) {
  const owner = getCharacter(card.ownerCharId);
  return (
    <button
      className={cx(
        s["deck-card"],
        className,
        focusStyle === "zoom" && s["is-zoom"],
      )}
      type="button"
      style={
        {
          "--owner-color": owner.color,
          "--i": index,
        } as CSSProperties
      }
      {...(hoverHint ? { "data-interactive-hint": "" } : null)}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-pressed={selected}
    >
      <span data-deck-card>
        <HandCard card={card} variant="pile" playable selected={false} />
      </span>
      {selected && <CardSelectFrame />}
      {hoverHint && <InteractiveHint className={s.hint} />}
    </button>
  );
}
