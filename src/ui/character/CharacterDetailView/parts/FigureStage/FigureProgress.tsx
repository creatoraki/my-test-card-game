import { ExperienceBar } from "@/ui/common/bar/ExperienceBar/ExperienceBar";
import s from "./FigureProgress.module.css";

interface Props {
  level: number;
  exp: number;
  cost: number | null;
  disabled: boolean;
  onUpgrade: () => void;
}

export function FigureProgress({ level, exp, cost, disabled, onUpgrade }: Props) {
  const full = cost == null;
  const ready = cost != null && exp >= cost;

  return (
    <div className={s.progress}>
      <div className={s.actions}>
        <div className={s.level} aria-label={`卡组等级${level}级`}>
          <span>卡组</span><strong>{level}</strong><span>级</span>
          <span className={s.diamond} aria-hidden="true">◇</span>
        </div>
        <div className={s["upgrade-wrap"]}>
          <button
            type="button"
            className={s.upgrade}
            disabled={disabled}
            onClick={onUpgrade}
            aria-label={full ? "打开卡组成长，卡组已满级" : ready ? "打开卡组成长，经验已足够升级" : "打开卡组成长"}
          >
            <span>{full ? "成长" : "升级"}</span>
            <svg viewBox="0 0 24 28" aria-hidden="true" fill="none">
              <path d="m4 13 8-8 8 8M4 23l8-8 8 8" stroke="currentColor" strokeWidth="2.5" />
            </svg>
          </button>
          {ready && <span className={s.notice} aria-hidden="true">↑</span>}
        </div>
      </div>
      <ExperienceBar exp={exp} cost={cost} />
    </div>
  );
}
