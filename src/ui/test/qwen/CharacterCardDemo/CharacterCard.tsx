import type { CSSProperties } from "react";
import { BorderGlow } from "@/ui/common/BorderGlow";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/HoverTooltip";
import { cx } from "@/ui/common/cx";
import { CHARACTER_CARD_GLOW } from "@/ui/character/characterGlow";
import s from "./CharacterCard.module.css";

export interface CharacterCardProps {
  characterId: string;
  name: string;
  emoji: string;
  glowColor: string;
  /** ⚠ 键名与 BorderGlow 的 colors prop 保持一致, 理由见 characterGlow() 的注释。 */
  colors: string[];
  active: boolean;
  disabledReason?: string;
  onToggle: () => void;
  animated?: boolean;
}

export function CharacterCard({
  characterId,
  name,
  emoji,
  glowColor,
  colors,
  active,
  disabledReason,
  onToggle,
  animated = false,
}: CharacterCardProps) {
  const { point, bind: tooltipBind } = useHoverTooltip();
  const cardStyle = { "--char-color": colors[0] } as CSSProperties;

  return (
    <div className={cx(s.slot, active && s.active)} style={cardStyle}>
      <BorderGlow
        className={s.card}
        {...CHARACTER_CARD_GLOW}
        persistent={active}
        followPointer={!active}
        animated={animated}
        glowColor={glowColor}
        colors={colors}
        fillOpacity={active ? 0.3 : 0.2}
      >
        <div className={s.body}>
          <CharacterPortrait characterId={characterId} emoji={emoji} alt={name} className={s.portrait} />
          <div className={s.scrim} aria-hidden="true" />
          <div className={s.info}>
            <span className={s.name}>{name}</span>
            <span className={s.toggleWrap} {...(disabledReason ? tooltipBind : {})}>
              <button
                type="button"
                className={s.toggle}
                disabled={Boolean(disabledReason)}
                aria-label={`${name}${active ? "下阵" : "上阵"}`}
                onClick={onToggle}
              >
                {active ? "下阵" : "上阵"}
              </button>
            </span>
          </div>
        </div>
      </BorderGlow>
      {disabledReason && point ? <HoverTooltip point={point}>{disabledReason}</HoverTooltip> : null}
    </div>
  );
}