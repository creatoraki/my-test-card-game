import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import { OPEN_MS, SLIDE_MS, box, type Rect } from "../cryoMorph/cryoChoreo";
import s from "../styles/cryoKit.module.css";

export const CONTENT_DELAY_MS = 0;
export const STAGGER_MS = 40;

const cn = (...values: Array<string | false | null | undefined>) =>
  cx(...values.map((value) => (typeof value === "string" ? s[value] : value)));

const MOTE_COUNT = 8;

interface Props {
  kicker: string;
  title: string;
  rect: Rect;
  ready: boolean;
  onClose: () => void;
  seed?: ReactNode;
  children: ReactNode;
}

export const CryoPanelShell = forwardRef<HTMLElement, Props>(function CryoPanelShell(
  { kicker, title, rect, ready, onClose, seed, children },
  ref,
) {
  return (
    <div
      className={cn("modal")}
      onClick={onClose}
    >
      <section
        className={cn("panel", !ready && "is-morphing")}
        ref={ref}
        onClick={(event) => event.stopPropagation()}
        style={{ ...box(rect), "--content-delay": `${CONTENT_DELAY_MS}ms`, "--land-delay": `${OPEN_MS}ms`, "--seed-delay": `${SLIDE_MS}ms` } as CSSProperties}
      >
        <CryoAmbience />
        {ready ? (
          <>
            <div className={cn("panelHead")}>
              <span className={cn("kicker")}>{kicker}</span>
              <h3 className={cn("panelTitle")}>{title}</h3>
              <button className={cn("close")} type="button" onClick={onClose} aria-label="关闭">
                ✕
              </button>
            </div>
            {children}
          </>
        ) : (
          <div className={cn("seed")} aria-hidden>
            {seed}
            <strong>{title.split(" · ")[0]}</strong>
          </div>
        )}
      </section>
    </div>
  );
});

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