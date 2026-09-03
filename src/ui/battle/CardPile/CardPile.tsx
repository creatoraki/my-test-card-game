import { cx } from "@/ui/common/cx";
import s from "./CardPile.module.css";

export type CardPileKind = "draw" | "discard" | "exhaust";

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
      className={cx(s.pile, s[`pile-${kind}`], count === 0 && s.empty, className)}
      type="button"
      aria-label={`${label} ${count}张`}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={s.stack}>
        <span className={s.under} aria-hidden />
        <span className={s.top}>
          <span className={s.back} aria-hidden />
          <span className={s.mark} aria-hidden />
          <span className={s.edge} aria-hidden />
          <span className={s.sheen} aria-hidden />
        </span>
      </span>
      <span className={s.label}>{label}</span>
      {/* <span className={s.badge}>{count}</span> */}
    </button>
  );
}