import type { ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "./RailPopover.module.css";

export function RailPopover({
  side,
  size = "md",
  className,
  children,
}: {
  side: "left" | "right" | "bottom" | "bottom-left" | "bottom-right" | "top" | "top-left" | "top-right";
  size?: "md" | "lg";
  className?: string;
  children: ReactNode;
}) {
  return <div className={cx(s.popover, s[side], size === "lg" && s.lg, className)}>{children}</div>;
}
