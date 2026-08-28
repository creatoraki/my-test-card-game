import type { ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "./VictoryButton.module.css";

export interface VictoryButtonProps {
  tone?: "neutral" | "primary" | "danger" | "continue";
  size?: "md" | "lg";
  ring?: boolean;
  blocked?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}

export function VictoryButton({
  tone = "neutral",
  size = "md",
  ring = false,
  blocked = false,
  disabled = false,
  className,
  onClick,
  children,
}: VictoryButtonProps) {
  return (
    <span
      className={cx(
        s.anchor,
        s[tone],
        size === "lg" && s.lg,
        blocked && s.isBlocked,
        disabled && s.isDisabled,
        className,
      )}
    >
      <span className={s.glow} aria-hidden="true" />
      {ring && !blocked && !disabled && <span className={s.ring} aria-hidden="true" />}
      <button
        type="button"
        className={s.button}
        disabled={disabled}
        aria-disabled={blocked || undefined}
        onClick={onClick}
      >
        <span className={s.label}>{children}</span>
      </button>
    </span>
  );
}
