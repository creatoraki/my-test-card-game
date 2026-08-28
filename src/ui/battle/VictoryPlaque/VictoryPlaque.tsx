import { cx } from "@/ui/common/cx";
import s from "./VictoryPlaque.module.css";

export interface VictoryPlaqueProps {
  label: string;
  variant?: "boon" | "loot" | "backpack";
  titleId?: string;
  className?: string;
}

export function VictoryPlaque({ label, variant = "boon", titleId, className }: VictoryPlaqueProps) {
  return (
    <div className={cx(s.plaque, s[variant], className)} aria-label={label}>
      <span className={s.label} id={titleId}>
        {[...label].map((character, index) => (
          <span key={`${character}-${index}`} className={s.char} aria-hidden="true">
            {character}
          </span>
        ))}
      </span>
    </div>
  );
}
