import type { CSSProperties } from "react";
import type { Card } from "@/engine";
import { getCharacter } from "@/data";
import { cx } from "@/ui/common/cx";
import { InteractiveHint } from "@/ui/common/InteractiveHint";
import { HandCard } from "@/ui/battle/HandCard";
import s from "./DeckCard.module.css";

interface Props {
  card: Card;
  /** 已选中时点亮四角发光框并提升层级, 不驱动卡牌位移。 */
  selected: boolean;
  index: number;
  /** 激活态: 该卡此刻有额外收益(培育完成 / 费用降低 / 星辉可抵扣), 卡面走通电边棱、双层辉光、
   * 外扩脉冲波、轮廓跑动流光、卡内能量扫掠、整卡呼吸与费用水晶能量环。 */
  activated?: boolean;
  className?: string;
  /** 覆盖四角提示框的几何与配色(--ihint-* 变量), 供不同设施调色。 */
  hintClassName?: string;
  "aria-label"?: string;
  focusStyle?: "lift" | "zoom" | "none";
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
  activated,
  className,
  hintClassName,
  "aria-label": ariaLabel,
  focusStyle = "lift",
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
        focusStyle === "none" && s["is-static"],
        selected && s["is-selected"],
      )}
      type="button"
      style={
        {
          "--owner-color": owner.color,
          "--i": index,
        } as CSSProperties
      }
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      aria-label={ariaLabel}
      aria-pressed={selected}
    >
      <span data-deck-card>
        <HandCard card={card} variant="pile" playable selected={false} activated={activated} />
      </span>
      <InteractiveHint active={selected} className={cx(s["select-hint"], hintClassName)} />
    </button>
  );
}
