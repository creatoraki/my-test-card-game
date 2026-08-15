import { cx } from "@/ui/common/cx";
import s from "./ExploreCommandBar.module.css";

export interface ExploreCommandBarProps {
  tone: "probe" | "leave";
  label: string;
  onClick: () => void;
}

export function ExploreCommandBar({ tone, label, onClick }: ExploreCommandBarProps) {
  return (
    <div className={cx(s["command-anchor"], s[`is-${tone}`])}>
      <span className={s["command-ring"]} aria-hidden />
      <button type="button" className={s["command"]} onClick={onClick}>
        <span className={s["command-label"]}>{label}</span>
      </button>
    </div>
  );
}

export default ExploreCommandBar;
