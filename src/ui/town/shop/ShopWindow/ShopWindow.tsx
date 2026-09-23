import type { ReactNode } from "react";
import { cx } from "@/ui/common/shared/cx";
import { DetailFrame } from "@/ui/common/frame/DetailFrame";
import s from "./ShopWindow.module.css";

interface Props {
  className?: string;
  /** 覆盖内容区内边距等; 研究中心三栏页按自己的设计稿收窄。 */
  contentClassName?: string;
  ariaLabel: string;
  frameTone?: "gold" | "teal" | "red" | "med" | "theme";
  header: ReactNode;
  children: ReactNode;
}

export function ShopWindow({
  className,
  contentClassName,
  ariaLabel,
  frameTone = "gold",
  header,
  children,
}: Props) {
  return (
    <section className={cx(s.window, className)} aria-label={ariaLabel}>
      <DetailFrame tone={frameTone} />
      <div className={s.inner}>
        {header}
        <div className={cx(s.content, contentClassName)}>{children}</div>
      </div>
    </section>
  );
}

export default ShopWindow;
