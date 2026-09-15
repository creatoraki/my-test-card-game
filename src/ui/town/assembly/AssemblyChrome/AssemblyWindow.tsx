import type { CSSProperties, ReactNode } from "react";
import { HudFrame } from "@/ui/common/HudFrame";
import { cx } from "@/ui/common/cx";
import type { SwapPhase } from "@/ui/hooks/useSwapTransition";
import s from "./AssemblyWindow.module.css";

interface Props {
  ariaLabel: string;
  phase: SwapPhase;
  tone?: CSSProperties;
  children: ReactNode;
}

export function AssemblyWindow({ ariaLabel, phase, tone, children }: Props) {
  return (
    <section className={s.window} aria-label={ariaLabel}>
      <HudFrame className={cx(s.frame)} style={tone} label={ariaLabel}>
        <div className={s.page} data-page-phase={phase}>
          {children}
        </div>
      </HudFrame>
    </section>
  );
}
