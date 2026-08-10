import type { ReactNode } from "react";
import s from "./RailPopover.module.css";

export function RailPopover({ side, children }: { side: "left" | "right"; children: ReactNode }) {
  return <div className={`${s.popover} ${side === "left" ? s.left : s.right}`}>{children}</div>;
}
