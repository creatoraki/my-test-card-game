import type { ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "./VictoryPlaque.module.css";

export interface VictoryPlaqueProps {
  label: string;
  readout?: ReactNode;
  titleId?: string;
  pulse?: boolean;
  className?: string;
}

export function VictoryPlaque({ label, readout, titleId, pulse = false, className }: VictoryPlaqueProps) {
  return (
    <div className={cx(s.plaque, className)} aria-label={label}>
      <span className={s.label} id={titleId}>
        {[...label].map((character, index) => (
          <span key={`${character}-${index}`} className={s.char} aria-hidden="true">
            {character}
          </span>
        ))}
      </span>
      {readout != null && (
        <span className={s.readout} data-pulse={pulse ? "true" : undefined}>
          {readout}
        </span>
      )}
    </div>
  );
}
