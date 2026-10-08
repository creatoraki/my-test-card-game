// 「属性装备」页下半: 三组只读面板属性, 一组一列, 列间细竖线分隔, 不加组框。
// ★ 分组来自 common/statGroups.ts(与角色详情页同一份)。
// ★ preview 非空时(悬停候选), 每行在数值后标出换装后的差值。
import type { ReactNode } from "react";
import type { StatBlock } from "@/engine";
import { StatIcon } from "@/ui/common/icon/StatIcon";
import { STAT_GROUPS, type StatRow } from "@/ui/common/shared/statGroups";
import s from "./StatsBoard.module.css";

export function StatsBoard({ stats, preview }: { stats: StatBlock; preview: StatBlock | null }) {
  return (
    <div className={s.board}>
      {STAT_GROUPS.map((group) => (
        <section key={group.title} className={s.group}>
          <header className={s.head}>
            <StatGroupGlyph title={group.title} className={s.glyph} />
            <h4 className={s.title}>{group.title}</h4>
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
    <div className={s.row}>
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

// 三组标题的琥珀图标: 生存与输出 = 爱心, 命中与暴击 = 准星, 特殊属性 = 叠层。按组标题登记, 未登记的不画。
const GLYPHS: Record<string, ReactNode> = {
  生存与输出: (
    <path d="M16 27 5.6 16.8A6.6 6.6 0 0 1 16 8.6a6.6 6.6 0 0 1 10.4 8.2Z M10 15.5h3.5l1.6-3 2.4 6 1.6-3H22" />
  ),
  命中与暴击: (
    <>
      <circle cx="16" cy="16" r="9" />
      <circle cx="16" cy="16" r="3.2" />
      <path d="M16 3v6M16 23v6M3 16h6M23 16h6" />
    </>
  ),
  特殊属性: (
    <>
      <path d="M16 5 28 11 16 17 4 11Z" />
      <path d="M4 16.5 16 22.5 28 16.5" />
      <path d="M4 22 16 28 28 22" />
    </>
  ),
};

function StatGroupGlyph({ title, className }: { title: string; className?: string }) {
  const glyph = GLYPHS[title];
  if (!glyph) return null;
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {glyph}
    </svg>
  );
}
