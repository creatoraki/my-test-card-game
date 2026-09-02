import type { CSSProperties } from "react";
import { BorderGlow } from "@/ui/common/BorderGlow";
import { CharacterPortrait } from "@/ui/common/CharacterPortrait";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/HoverTooltip";
import { cx } from "@/ui/common/cx";
import s from "./CharacterCard.module.css";

export interface CharacterCardProps {
  characterId: string;
  name: string;
  emoji: string;
  glowColor: string;
  gradientColors: string[];
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
  gradientColors,
  active,
  disabledReason,
  onToggle,
  animated = false,
}: CharacterCardProps) {
  const { point, bind } = useHoverTooltip();
  const cardStyle = { "--char-color": gradientColors[0] } as CSSProperties;

  return (
    <div className={cx(s.slot, active && s.slotActive)} style={cardStyle}>
      <BorderGlow
        className={s.card}
        persistent={active}
        animated={animated}
        glowColor={glowColor}
        colors={gradientColors}
        backgroundColor="#0b1216"
        borderRadius={12}
        glowRadius={28}
        glowIntensity={1.08}
        coneSpread={18}
        fillOpacity={0.28}
      >
        <div className={s.body}>
          <CharacterPortrait characterId={characterId} emoji={emoji} alt={name} className={s.portrait} />
          <div className={s.veil} aria-hidden="true" />
          <div className={s.info}>
            <span className={s.name}>{name}</span>
            <span className={cx(s.state, active && s.stateActive)}>{active ? "已上阵" : "待命"}</span>
            <span className={s.toggleWrap} {...(disabledReason ? bind : {})}>
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