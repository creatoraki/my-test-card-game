// 终端面板里的一枚读数芯片: 图标 + (可选)标签 + 数值, 悬浮出组件式说明浮卡。
// ★ tone 决定图标与强调色; dim = 数值为 0 时压暗, alert = 需要注意(如有阵亡)时转红。

import type { ReactNode } from "react";
import { HoverTooltip, useHoverTooltip } from "@/ui/common/HoverTooltip";
import { TooltipCard } from "@/ui/common/TooltipCard";
import { cx } from "@/ui/common/cx";
import { HudGlyph, type HudGlyphName } from "./HudGlyphs";
import s from "./HudChip.module.css";

export type HudChipTone = "cyan" | "gold" | "green" | "blue" | "red" | "violet";

interface Props {
  glyph: HudGlyphName;
  tone: HudChipTone;
  label?: string;
  value: ReactNode;
  tipTitle: string;
  tipDesc: string;
  /** big = 资源行的大号读数; 默认是队伍行的小胶囊。 */
  variant?: "big" | "pill";
  dim?: boolean;
  alert?: boolean;
}

export function HudChip({ glyph, tone, label, value, tipTitle, tipDesc, variant = "pill", dim, alert }: Props) {
  const { point, bind } = useHoverTooltip("vertical");

  return (
    <span
      className={cx(s.chip, s[variant], dim && s["is-dim"], alert && s["is-alert"])}
      data-tone={tone}
      tabIndex={0}
      {...bind}
    >
      <HudGlyph name={glyph} className={s.icon} />
      {label && <span className={s.label}>{label}</span>}
      <strong className={s.value}>{value}</strong>
      {point && (
        <HoverTooltip point={point}>
          <TooltipCard title={tipTitle} desc={tipDesc} />
        </HoverTooltip>
      )}
    </span>
  );
}
