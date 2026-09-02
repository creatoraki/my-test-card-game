import { type CSSProperties, type ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "../styles/cryoKit.module.css";

export const PANEL_OUT_MS = 600;
export const PANEL_OUT_REDUCED_MS = 180;
export const CONTENT_DELAY_MS = 560;
export const STAGGER_MS = 55;

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

const MOTE_COUNT = 8;

interface Props {
  kicker: string;
  title: string;
  size: { w: number; h: number };
  closing: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function CryoPanelShell({ kicker, title, size, closing, onClose, children }: Props) {
  return (
    <div
      className={cn("modal", closing && "is-closing")}
      onClick={onClose}
      style={{ "--panel-w": `${size.w}px`, "--panel-h": `${size.h}px` } as CSSProperties}
    >
      <section
        className={cn("panel")}
        onClick={(event) => event.stopPropagation()}
        style={{ width: `${size.w}px`, height: `${size.h}px`, "--content-delay": `${CONTENT_DELAY_MS}ms` } as CSSProperties}
      >
        <CryoAmbience />
        <div className={cn("panelHead")}>
          <span className={cn("kicker")}>{kicker}</span>
          <h3 className={cn("panelTitle")}>{title}</h3>
          <button className={cn("close")} type="button" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function CryoAmbience() {
  return (
    <div className={cn("ambience")} aria-hidden>
      <span className={cn("fog", "fog-a")} />
      <span className={cn("fog", "fog-b")} />
      <span className={cn("scanlines")} />
      <span className={cn("motes")}>
        {Array.from({ length: MOTE_COUNT }, (_, i) => (
          <span key={i} className={cn("mote")} style={{ "--i": i } as CSSProperties} />
        ))}
      </span>
    </div>
  );
}