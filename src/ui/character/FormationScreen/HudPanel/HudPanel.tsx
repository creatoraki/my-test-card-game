import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "./HudPanel.module.css";

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function HudPanel({ children, className, style }: Props) {
  return (
    <div className={cx(s.panel, className)} style={style}>
      <span className={s.surface} aria-hidden="true" />
      <div className={s.content}>{children}</div>
    </div>
  );
}
