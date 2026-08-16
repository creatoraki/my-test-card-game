import s from "./CombatantView.module.css";

interface Props {
  value: number;
}

function tierOf(value: number): "high" | "mid" | "low" {
  if (value >= 85) return "high";
  if (value >= 60) return "mid";
  return "low";
}

export function HitChanceBadge({ value }: Props) {
  const rounded = Math.round(value);
  return (
    <div
      className={s["hit-chance"]}
      data-tier={tierOf(value)}
      aria-label={`命中率 ${rounded}%`}
    >
      ⌖ {rounded}%
    </div>
  );
}