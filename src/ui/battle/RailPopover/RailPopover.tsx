import type { ReactNode } from "react";
import s from "./RailPopover.module.css";

export function RailPopover({ side, children }: { side: "left" | "right" | "bottom"; children: ReactNode }) {
  return <div className={`${s.popover} ${s[side]}`}>{children}</div>;
}
