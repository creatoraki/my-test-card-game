import type { ReactNode } from "react";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/tooltip/HoverTooltip";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
import { HudGlyph, type HudGlyphName } from "./HudGlyphs";
import s from "./HudChip.module.css";

interface Props {
  glyph?: HudGlyphName;
  tone: "cyan" | "gold" | "blue";
  label: string;
  value: ReactNode;
  tipTitle: string;
  tipDesc: string;
}

/** 标签与大读数沿用详情信息层级，保留键盘和鼠标悬浮说明。 */
export function HudChip({ glyph, tone, label, value, tipTitle, tipDesc }: Props) {
  const { point, bind } = useHoverTooltip("vertical");

  return (
    <div className={s.chip} data-tone={tone} tabIndex={0} {...bind}>
      <span className={s.heading}>
        {glyph && <HudGlyph name={glyph} className={s.icon} />}
        <span>{label}</span>
      </span>
      <strong className={s.value}>{value}</strong>
      {point && (
        <HoverTooltip point={point}>
          <TooltipCard title={tipTitle} desc={tipDesc} />
        </HoverTooltip>
      )}
    </div>
  );
}
