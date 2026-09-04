import { useEffect, type CSSProperties, type ReactNode, type Ref } from "react";
import { playSfx } from "@/ui/audio";
import { box, CLOSE_MS, OPEN_MS, SLIDE_MS, type Rect } from "@/ui/common/panelMorph";
import { HudFrame } from "@/ui/common/HudFrame";
import { cx } from "@/ui/common/cx";
import s from "./HudPanelShell.module.css";

interface Props {
  closing?: boolean;
  onClose: () => void;
  label: string;
  morph: {
    ref: Ref<HTMLElement>;
    rect: Rect;
    ready: boolean;
    seed?: ReactNode;
    seedLabel?: string;
  };
  children: ReactNode;
}

export function HudPanelShell({ closing = false, onClose, label, morph, children }: Props) {
  useEffect(() => {
    playSfx("panel");
  }, []);

  const morphPhase = closing ? "closing" : morph.ready ? "open" : "opening";

  return (
    <div
      className={cx(s.modal, s.morphModal)}
      data-morph={morphPhase}
      onClick={onClose}
      style={
        {
          "--veil-in-ms": `${SLIDE_MS}ms`,
          "--veil-out-ms": `${CLOSE_MS}ms`,
          "--land-delay": `${OPEN_MS}ms`,
          "--seed-delay": `${SLIDE_MS}ms`,
        } as CSSProperties
      }
    >
      <section
        ref={morph.ref}
        className={s.panel}
        data-closing={closing}
        onClick={(event) => event.stopPropagation()}
        style={box(morph.rect) as CSSProperties}
      >
        {morph.ready ? (
          <HudFrame className={s.frame} label={label}>
            {children}
          </HudFrame>
        ) : (
          <div className={s.seed} aria-hidden="true">
            {morph.seed}
            <strong>{morph.seedLabel ?? label}</strong>
          </div>
        )}

        {morph.ready && (
          <button
            className={s.closeButton}
            type="button"
            data-sfx="back"
            onClick={onClose}
            aria-label={`关闭${label}`}
          >
            <CloseIcon />
          </button>
        )}
        <i className={s.land} aria-hidden="true" />
      </section>
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