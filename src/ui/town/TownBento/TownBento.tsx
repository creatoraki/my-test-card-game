import type { CSSProperties } from "react";
import { BorderGlow } from "@/ui/common/BorderGlow";
import { cx } from "@/ui/common/cx";
import { TOWN_FACILITIES, brickStyle, type TownFacility } from "./facilities";
import s from "./TownBento.module.css";

// 想调观感改这里：正式据点固定使用试验台确认过的默认参数。
const GLOW = {
  edgeSensitivity: 30,
  glowColor: "40 80 80",
  colors: ["#c084fc", "#f472b6", "#38bdf8"],
  backgroundColor: "rgb(20 17 28 / 55%)",
  glass: true,
  glassBlur: 12,
  borderRadius: 8,
  glowRadius: 25,
  glowIntensity: 1,
  coneSpread: 0,
  fillOpacity: 0.25,
} as const;
const PICKED_GLOW_INTENSITY = 1.4;
const BOARD_TILT = 9;
const WALL_SHADOW = 0.6;
const LAYOUT = {
  right: 96,
  bottom: 72,
  width: 980,
  height: 520,
  gap: 12,
  rows: "138px 84px 116px 146px",
  columns: "repeat(12, minmax(0, 1fr))",
} as const;

interface TownBentoProps {
  onOpen: (facility: TownFacility) => void;
  brickClassName?: (id: string) => string | undefined;
  brickStyle?: (id: string) => CSSProperties | undefined;
  pickedId?: string | null;
}

const SIZE_CLASS = {
  lg: s.cardLg,
  md: s.cardMd,
} as const;

export function TownBento({ onOpen, brickClassName, brickStyle: getBrickStyle, pickedId }: TownBentoProps) {
  return (
    <div
      className={s.bento}
      style={
        {
          right: `${LAYOUT.right}px`,
          bottom: `${LAYOUT.bottom}px`,
          width: `${LAYOUT.width}px`,
          height: `${LAYOUT.height}px`,
          gap: `${LAYOUT.gap}px`,
          gridTemplateColumns: LAYOUT.columns,
          gridTemplateRows: LAYOUT.rows,
          "--board-tilt": BOARD_TILT,
          "--wall-shadow": WALL_SHADOW,
        } as CSSProperties
      }
    >
      {TOWN_FACILITIES.map((facility) => {
        const picked = facility.id === pickedId;
        const bodyClass = cx(
          s.cardBody,
          SIZE_CLASS[facility.size],
          facility.inline && s.cardInline,
        );
        return (
          <div
            key={facility.id}
            className={cx(s.brick, brickClassName?.(facility.id))}
            style={{ ...brickStyle(facility.brick, GLOW.borderRadius), ...getBrickStyle?.(facility.id) }}
          >
            <div
              className={s.lift}
              style={
                {
                  "--brick-lift": facility.brick.lift,
                  "--brick-radius": `${GLOW.borderRadius}px`,
                } as CSSProperties
              }
            >
              <BorderGlow
                as="button"
                className={cx(s.card, facility.locked && s.locked)}
                ariaLabel={facility.name}
                onClick={facility.locked ? undefined : () => onOpen(facility)}
                active={picked}
                edgeSensitivity={GLOW.edgeSensitivity}
                glowColor={GLOW.glowColor}
                backgroundColor={GLOW.backgroundColor}
                glass={GLOW.glass}
                glassBlur={GLOW.glassBlur}
                borderRadius={GLOW.borderRadius}
                glowRadius={GLOW.glowRadius}
                glowIntensity={picked ? PICKED_GLOW_INTENSITY : GLOW.glowIntensity}
                coneSpread={GLOW.coneSpread}
                fillOpacity={GLOW.fillOpacity}
                colors={GLOW.colors}
              >
                <span className={bodyClass}>
                  {facility.locked ? <span className={s.lockedTag}>未开放</span> : null}
                  <span className={s.cardIcon}>{facility.icon}</span>
                  <span className={s.cardName}>{facility.name}</span>
                </span>
              </BorderGlow>
            </div>
          </div>
        );
      })}
    </div>
  );
}
