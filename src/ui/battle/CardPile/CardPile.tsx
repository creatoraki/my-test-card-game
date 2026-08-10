import { cx } from "@/ui/common/cx";
import s from "./CardPile.module.css";

export type CardPileKind = "draw" | "discard" | "exhaust";

const ICON: Record<Exclude<CardPileKind, "draw">, string> = {
  discard: "♻",
  exhaust: "🔥",
};

interface Props {
  kind: CardPileKind;
  label: string;
  count: number;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
}

export function CardPile({ kind, label, count, className, disabled, onClick }: Props) {
  return (
    <button
      className={cx(s.pile, s[`pile-${kind}`], className)}
      type="button"
      aria-label={`${label} ${count}张`}
      title={`${label} · ${count}张`}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={s.label}>{label}</span>
      <span className={s.stack}>
        {kind !== "draw" && <span className={s.icon} aria-hidden>{ICON[kind]}</span>}
      </span>
      <span className={s.badge}>{count}</span>
    </button>
  );
}