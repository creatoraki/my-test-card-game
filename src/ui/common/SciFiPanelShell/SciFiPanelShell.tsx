import { useEffect, type CSSProperties, type ReactNode } from "react";
import { playSfx } from "@/ui/audio";
import { SciFiPanel, type SciFiPanelColors } from "@/ui/common/SciFiPanel";
import { cx } from "@/ui/common/cx";
import s from "./SciFiPanelShell.module.css";

export const SCIFI_POP_IN_MS = 380;
export const SCIFI_POP_OUT_MS = 240;

export interface SciFiPanelShellProps {
  rect: { x: number; y: number; w: number; h: number };
  kicker?: string;
  title: string;
  status?: ReactNode;
  closeLabel: string;
  onClose: () => void;
  closing?: boolean;
  leaving?: boolean;
  from?: "left" | "right";
  headExtra?: ReactNode;
  colors?: Partial<SciFiPanelColors>;
  background?: CSSProperties["background"];
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}

export function SciFiPanelShell({
  rect,
  kicker,
  title,
  status,
  closeLabel,
  onClose,
  closing = false,
  leaving = false,
  from = "right",
  headExtra,
  colors,
  background,
  className,
  contentClassName,
  children,
}: SciFiPanelShellProps) {
  useEffect(() => {
    playSfx("panel");
  }, []);

  const style = {
    left: `${rect.x}px`,
    top: `${rect.y}px`,
    width: `${rect.w}px`,
    height: `${rect.h}px`,
    "--pop-from": from === "left" ? "-48px" : "48px",
    ...(colors?.armor ? { "--sfp-armor": colors.armor } : {}),
    ...(colors?.trim ? { "--sfp-trim": colors.trim } : {}),
    ...(colors?.energy ? { "--sfp-energy": colors.energy } : {}),
    ...(colors?.accent ? { "--sfp-accent": colors.accent } : {}),
    ...(colors?.highlight ? { "--sfp-highlight": colors.highlight } : {}),
    ...(colors?.circuit ? { "--sfp-circuit": colors.circuit } : {}),
  } as CSSProperties;

  return (
    <div
      className={cx(s.root, from === "left" ? s["from-left"] : s["from-right"], closing && s.closing, leaving && s.leaving, className)}
      style={style}
      role="dialog"
      aria-modal="false"
      aria-labelledby={`${title}-panel-title`}
      data-closing={closing || undefined}
    >
      <SciFiPanel
        className={s.panel}
        colors={colors}
        background={background}
        width="100%"
        height="100%"
        contentClassName={cx(s.content, contentClassName)}
      >
        <header className={s.header}>
          <div className={s.headerTitle}>
            {kicker && <span className={s.kicker}>{kicker}</span>}
            <h2 id={`${title}-panel-title`}>{title}</h2>
          </div>
          <div className={s.headerActions}>
            {status}
            {headExtra}
            <button
              className={s.close}
              type="button"
              data-sfx="back"
              onClick={onClose}
              aria-label={closeLabel}
            >
              <CloseIcon />
            </button>
          </div>
        </header>
        <div className={s.body}>{children}</div>
      </SciFiPanel>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" />
      <path d="M4 4h4M4 4v4M20 20h-4M20 20v-4" opacity=".5" />
    </svg>
  );
}
