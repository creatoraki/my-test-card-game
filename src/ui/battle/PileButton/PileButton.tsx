import type { ReactNode } from "react";
import s from "./PileButton.module.css";

export function PileButton({
  label,
  count,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  count: number;
  icon: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button className={s.button} type="button" aria-label={`${label} ${count}张`} title={`${label} · ${count}张`} disabled={disabled} onClick={onClick}>
      <span className={s.icon} aria-hidden>{icon}</span>
      <span className={s.count}>{count}</span>
      <span className={s.label}>{label}</span>
    </button>
  );
}
