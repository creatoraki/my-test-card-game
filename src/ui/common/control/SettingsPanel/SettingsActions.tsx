import { type ReactNode } from "react";
import s from "./SettingsPanel.module.css";

export function SettingsActions({ children }: { children: ReactNode }) {
  return (
    <div className={s.section}>
      <span className={s.eyebrow}>系统操作</span>
      <div className={s.actions}>{children}</div>
    </div>
  );
}
