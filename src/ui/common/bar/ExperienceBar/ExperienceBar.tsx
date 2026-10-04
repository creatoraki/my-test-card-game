import s from "./ExperienceBar.module.css";
import { cx } from "@/ui/common/shared/cx";

/** 详情页与编队页共用的升级经验条。 */
export function ExperienceBar({ exp, cost, compact = false }: { exp: number; cost: number | null; compact?: boolean }) {
  const full = cost == null;
  const progress = cost == null || cost <= 0 ? 1 : Math.max(0, Math.min(1, exp / cost));

  return (
    <div className={cx(s.experience, compact && s.compact)}>
      {!compact && <span>经验</span>}
      <div className={s.track} role="progressbar" aria-label="卡组升级经验"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}
        aria-valuetext={full ? `已满级，剩余经验${exp}` : `${exp} / ${cost}`}>
        <span className={s.fill} style={{ transform: `scaleX(${progress})` }} />
        {compact && <span className={s.inside}>{full ? `${exp} · 满级` : `${exp} / ${cost}`}</span>}
      </div>
      {!compact && <span className={s.amount}>{full ? `${exp} · 满级` : `${exp} / ${cost}`}</span>}
    </div>
  );
}
