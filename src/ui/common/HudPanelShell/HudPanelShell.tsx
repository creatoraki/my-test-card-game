import { useEffect, type CSSProperties, type ReactNode, type Ref } from "react";
import { playSfx } from "@/ui/audio";
import { box, COLLAPSE_MS, OPEN_MS, PANEL_COLLAPSE_CLASS, SLIDE_MS, type Rect } from "@/ui/common/panelMorph";
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
          // 遮罩淡出与折叠同长 —— 入口砖滑回的那段时间容器已经该退干净了。
          "--veil-out-ms": `${COLLAPSE_MS}ms`,
          "--collapse-ms": `${COLLAPSE_MS}ms`,
          "--land-delay": `${OPEN_MS}ms`,
          "--seed-delay": `${SLIDE_MS}ms`,
        } as CSSProperties
      }
    >
      <section
        ref={morph.ref}
        className={cx(s.panel, closing && PANEL_COLLAPSE_CLASS)}
        data-closing={closing}
        onClick={(event) => event.stopPropagation()}
        style={box(morph.rect) as CSSProperties}
      >
        {morph.ready || closing ? (
          <HudFrame className={cx(s.frame, morph.ready && s.isLanded)} label={label}>
            {children}
          </HudFrame>
        ) : (
          <>
            <i className={s.morphSkin} aria-hidden="true" />
            <div className={s.seed} aria-hidden="true">
              {morph.seed}
              <strong>{morph.seedLabel ?? label}</strong>
            </div>
          </>
        )}

        {(morph.ready || closing) && (
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" />
    </svg>
  );
}
