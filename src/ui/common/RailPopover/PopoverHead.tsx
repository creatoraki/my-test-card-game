import type { ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "./PopoverHead.module.css";

export function PopoverHead({
  icon,
  name,
  meta,
  className,
  iconClassName,
}: {
  icon: ReactNode;
  name: ReactNode;
  meta?: ReactNode;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div className={cx(s.head, className)}>
      <span className={cx(s.icon, iconClassName)} aria-hidden="true">{icon}</span>
      <div className={s.text}>
        <strong className={s.name}>{name}</strong>
        {meta && <span className={s.meta}>{meta}</span>}
      </div>
    </div>
  );
}
