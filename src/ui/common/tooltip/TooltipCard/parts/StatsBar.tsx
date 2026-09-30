// 底栏: 沙漏 + 竖分隔 + 「标签 数值 · 标签 数值 单位」, 右下角斜条纹与细线; 上沿两侧各一个小箭头。

import { ChamferPanel } from "./ChamferPanel";
import { HourglassIcon } from "./HourglassIcon";
import s from "./StatsBar.module.css";

export type BuffStat = {
  label: string;
  value: number;
  /** 数值后的单位, 如「次行动」「回合」。 */
  suffix?: string;
};

export function StatsBar({ stats }: { stats: BuffStat[] }) {
  return (
    <div className={s.wrap}>
      <svg className={s["chevron-left"]} width="6" height="10" aria-hidden="true">
        <path d="M1 1L5 5L1 9" />
      </svg>
      <svg className={s["chevron-right"]} width="6" height="10" aria-hidden="true">
        <path d="M5 1L1 5L5 9" />
      </svg>
      <ChamferPanel chamfer={7} className={s.bar}>
        <HourglassIcon className={s.hourglass} />
        <span className={s.divider} aria-hidden="true" />
        {/* 条目放不下一行时整条换行; 每条前的「·」在行首被裁掉, 只留在条目之间。 */}
        <span className={s.stats}>
          <span className={s.list}>
            {stats.map((stat) => (
              <span key={stat.label} className={s.stat}>
                <span className={s.label}>{stat.label}</span>
                <b className={s.value}>{stat.value}</b>
                {stat.suffix && <span className={s.label}>{stat.suffix}</span>}
              </span>
            ))}
          </span>
        </span>
        <svg className={s.decor} width="76" height="5" aria-hidden="true">
          <path className={s.stripe} d="M2 0.5H6L4 3.5H0Z" />
          <path className={s.stripe} d="M10 0.5H18L16 3.5H8Z" />
          <path className={s.stripe} d="M22 0.5H30L28 3.5H20Z" />
          <path className={s.stripe} d="M34 0.5H38L36 3.5H32Z" />
          <path className={s.rule} d="M0 4.5H76" />
        </svg>
      </ChamferPanel>
    </div>
  );
}
