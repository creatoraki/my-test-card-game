import { POLLUTION_RULES } from "@/engine";
import { cx } from "@/ui/common/cx";
import s from "./PollutionMeter.module.css";

interface Props {
  value: number;
  compact?: boolean;
  bar?: boolean;
  className?: string;
}

export function PollutionMeter({ value, compact, bar, className }: Props) {
  const current = Math.max(0, Math.min(POLLUTION_RULES.threshold - 1, Math.round(value)));
  const pct = (current / POLLUTION_RULES.threshold) * 100;
  return (
    <div
      className={cx(s["pollution-meter"], compact && s.compact, bar && s.bar, className)}
      title={`污染值 ${current}/${POLLUTION_RULES.threshold}`}
    >
      <div className={s["pollution-head"]}>
        <span className={s["pollution-label"]}>污染</span>
        <strong>
          {current}/{POLLUTION_RULES.threshold}
        </strong>
      </div>
      <div className={s["pollution-track"]} aria-hidden="true">
        <span className={s["pollution-fill"]} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
