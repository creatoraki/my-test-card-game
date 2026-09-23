// 终端面板左侧的生存日刻度盘: 外圈慢转的虚线环 + 刻度环 + 中央日数。
// ⚠ 设计 px; 盘面 132×132, 与 StationHud.module.css 的首列宽度是同一个事实。

import s from "./DayDial.module.css";

const TICKS = Array.from({ length: 48 }, (_, i) => i);

export function DayDial({ day }: { day: number }) {
  return (
    <div className={s.dial}>
      <svg className={s.art} viewBox="0 0 132 132" fill="none" aria-hidden="true">
        <circle className={s.orbit} cx="66" cy="66" r="60" />
        <g className={s.ticks}>
          {TICKS.map((i) => (
            <line
              key={i}
              x1="66"
              y1={i % 4 === 0 ? 11 : 13}
              x2="66"
              y2="17"
              transform={`rotate(${i * 7.5} 66 66)`}
              data-major={i % 4 === 0 || undefined}
            />
          ))}
        </g>
        <circle className={s.core} cx="66" cy="66" r="44" />
        <path className={s.arc} d="M28 44 A44 44 0 0 1 66 22" />
        <path className={s.arc} d="M104 88 A44 44 0 0 1 66 110" />
      </svg>
      <span className={s.deco}>DAY</span>
      <strong className={s.num}>{day}</strong>
      <span className={s.label}>生存日</span>
    </div>
  );
}
