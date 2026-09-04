// 右列: 升阶后属性可能变化的范围。纯文字两列(当前 / 升阶后)。
// 区间怎么算的见 ../upgradeRange.ts —— 这里只负责画。

import { cx } from "@/ui/common/cx";
import { signedValue, type StatRangeRow, type UpgradeRangePreview } from "../upgradeRange";
import s from "./EquipGainColumn.module.css";

interface Props {
  preview: UpgradeRangePreview | null;
  /** preview 为空时的说明(未选中 / 已满阶 / 无模型)。 */
  emptyText: string;
}

function unit(row: StatRangeRow): string {
  return row.percent ? "%" : "";
}

function rangeText(row: StatRangeRow): string {
  const suffix = unit(row);
  if (row.min === row.max) return `${signedValue(row.min)}${suffix}`;
  return `${signedValue(row.min)}${suffix} ~ ${signedValue(row.max)}${suffix}`;
}

export function EquipGainColumn({ preview, emptyText }: Props) {
  return (
    <section className={s.column} aria-label="升阶后属性范围">
      <header className={s.heading}>
        <span className={s.kicker}>升阶收益</span>
      </header>

      {preview ? (
        <>
          <div className={s.table} role="table">
            <div className={cx(s.row, s.head)} role="row">
              <span role="columnheader">属性</span>
              <span role="columnheader">当前</span>
              <span role="columnheader">升阶后</span>
            </div>
            {preview.rows.map((row) => (
              <div
                key={row.stat}
                className={cx(s.row, row.capped && s.capped, row.drawback && s.drawback)}
                role="row"
              >
                <span className={s.label} role="cell">
                  {row.label}
                  {row.capped && <em className={s.cap}>已封顶</em>}
                </span>
                <span className={s.current} role="cell">
                  {signedValue(row.current)}
                  {unit(row)}
                </span>
                <span className={s.next} role="cell">
                  {rangeText(row)}
                </span>
              </div>
            ))}
          </div>

          <p className={s.foot}>
            本次升阶投入 {preview.budgetMin === preview.budgetMax
              ? preview.budgetMin
              : `${preview.budgetMin}~${preview.budgetMax}`} 点模型值，按词条权重随机分配；
            单条不会超过该阶模型的上限。
          </p>
        </>
      ) : (
        <p className={s.empty}>{emptyText}</p>
      )}
    </section>
  );
}
