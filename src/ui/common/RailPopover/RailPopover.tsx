import type { ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "./RailPopover.module.css";

export function RailPopover({
  side,
  className,
  children,
}: {
  side: "left" | "right" | "bottom" | "bottom-left" | "bottom-right" | "top" | "top-left" | "top-right";
  className?: string;
  children: ReactNode;
}) {
  return <div className={cx(s.popover, s[side], className)}>{children}</div>;
}