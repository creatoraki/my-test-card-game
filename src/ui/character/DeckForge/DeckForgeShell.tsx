import type { CSSProperties, ReactNode } from "react";
import { ModalReveal, modalRevealVars } from "@/ui/common/ModalReveal";
import { cx } from "@/ui/common/cx";
import { forgeMorphVars, type ForgeView } from "./forgeMorph";
import s from "./DeckForgeShell.module.css";

interface Props {
  view: ForgeView;
  phase: "idle" | "out" | "in";
  closing: boolean;
  busy: boolean;
  ariaLabel: string;
  className?: string;
  style?: CSSProperties;
  onBackdrop: () => void;
  children: ReactNode;
}

export function DeckForgeShell({
  view,
  phase,
  closing,
  busy,
  ariaLabel,
  className,
  style,
  onBackdrop,
  children,
}: Props) {
  return (
    <div
      className={cx(s.shell, className)}
      data-closing={closing ? "true" : undefined}
      data-phase={phase}
      style={{ ...modalRevealVars(), ...forgeMorphVars(view), ...style }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <button
        className={s.backdrop}
        type="button"
        disabled={busy}
        aria-label="关闭卡组锻造"
        onClick={onBackdrop}
      />
      <ModalReveal closing={closing} className={s.reveal}>
        <section className={s.modal} data-forge-modal>
          <div className={s.body}>{children}</div>
        </section>
      </ModalReveal>
    </div>
  );
}
