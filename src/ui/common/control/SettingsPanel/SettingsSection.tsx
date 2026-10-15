import { type ReactNode } from "react";
import s from "./SettingsPanel.module.css";

/** 带小标题的一组设置行。 */
export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={s.section}>
      <span className={s.eyebrow}>{title}</span>
      {children}
    </div>
  );
}
