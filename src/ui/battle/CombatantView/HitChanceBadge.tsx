import s from "./CombatantView.module.css";

interface Props {
  value: number;
  damage?: number | null;
}

function tierOf(value: number): "high" | "mid" | "low" {
  if (value >= 85) return "high";
  if (value >= 60) return "mid";
  return "low";
}

export function HitChanceBadge({ value, damage }: Props) {
  const rounded = Math.round(value);
  const damageText = damage == null ? "" : `${Math.max(0, Math.round(damage))}`;
  return (
    <div
      className={s["hit-chance"]}
      data-tier={tierOf(value)}
      aria-label={damageText ? `预期伤害 ${damageText}，命中率 ${rounded}%` : `命中率 ${rounded}%`}
    >
      {damageText ? `${damageText}(${rounded}%)` : `${rounded}%`}
    </div>
  );
}