import type { ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "./RailPopover.module.css";

export function RailPopover({
  side,
  size = "md",
  bare = false,
  className,
  children,
}: {
  side: "left" | "right" | "bottom" | "bottom-left" | "bottom-right" | "top" | "top-left" | "top-right";
  size?: "md" | "lg";
  /** 只保留定位与悬停显隐, 外观完全交给内容自绘(如 BuffDetailCard)。 */
  bare?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx(s.popover, s[side], size === "lg" && s.lg, bare && s.bare, className)}>
      {children}
    </div>
  );
}
