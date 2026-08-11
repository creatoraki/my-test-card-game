import { POLLUTION_RULES } from "@/engine";
import { cx } from "@/ui/common/cx";
import type { CSSProperties } from "react";
import s from "./PollutionMeter.module.css";

interface Props {
  value: number;
  className?: string;
}

export function PollutionMeter({ value, className }: Props) {
  const current = Math.max(0, Math.min(POLLUTION_RULES.threshold - 1, Math.round(value)));
  const pct = (current / POLLUTION_RULES.threshold) * 100;
  return (
    <div
      className={cx(s["pollution-bar"], className)}
      style={{ "--poll-pct": `${pct}%` } as CSSProperties}
      title={`污染值 ${current}/${POLLUTION_RULES.threshold}`}
    >
      <div className={s["pollution-slot"]} aria-hidden="true" />
      <div className={s["pollution-fill"]} />
      <span className={s["pollution-text"]}>
        {current}/{POLLUTION_RULES.threshold}
      </span>
    </div>
  );
}
