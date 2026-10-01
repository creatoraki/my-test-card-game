// 「属性装备」页下半: 三组只读面板属性, 一组一列。
// ★ 分组与条长旋钮来自 common/statGroups.ts(与角色详情页同一份)。
// ★ preview 非空时(悬停候选 / 有待换上装备), 每行在数值后标出换装后的差值。
import type { CSSProperties } from "react";
import type { StatBlock } from "@/engine";
import { StatIcon } from "@/ui/common/icon/StatIcon";
import { STAT_GROUPS, statFill, type StatRow } from "@/ui/common/shared/statGroups";
import s from "./StatsBoard.module.css";

export function StatsBoard({ stats, preview }: { stats: StatBlock; preview: StatBlock | null }) {
  return (
    <div className={s.board}>
      {STAT_GROUPS.map((group) => (
        <section key={group.title} className={s.group}>
          <header className={s.head}>
            <h4 className={s.title}>{group.title}</h4>
            {group.subtitle && <span className={s.sub}>{group.subtitle}</span>}
          </header>
          <div className={s.rows}>
            {group.rows.map((row) => (
              <Row key={row.key} row={row} value={stats[row.key]} next={preview?.[row.key]} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Row({ row, value, next }: { row: StatRow; value: number; next?: number }) {
  const delta = next === undefined ? 0 : Math.round(next) - Math.round(value);
  const unit = row.pct ? "%" : "";
  return (
    <div className={s.row} style={{ "--pct": statFill(next ?? value, row) } as CSSProperties}>
      <StatIcon statKey={row.key} className={s.icon} />
      <span className={s.label}>{row.label}</span>
      <strong className={s.value}>
        {Math.round(value)}
        {unit}
      </strong>
      {delta !== 0 && (
        <span className={s.delta} data-down={delta < 0 || undefined}>
          {delta > 0 ? `+${delta}` : delta}
        </span>
      )}
    </div>
  );
}
