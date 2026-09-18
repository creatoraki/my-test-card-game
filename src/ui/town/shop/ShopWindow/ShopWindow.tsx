import type { ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import { DetailFrame } from "@/ui/common/DetailFrame";
import s from "./ShopWindow.module.css";

interface Props {
  className?: string;
  ariaLabel: string;
  frameTone?: "gold" | "teal" | "red" | "med";
  header: ReactNode;
  children: ReactNode;
}

export function ShopWindow({ className, ariaLabel, frameTone = "gold", header, children }: Props) {
  return (
    <section className={cx(s.window, className)} aria-label={ariaLabel}>
      <DetailFrame tone={frameTone} />
      <div className={s.inner}>
        {header}
        <div className={s.content}>{children}</div>
      </div>
    </section>
  );
}

export default ShopWindow;
