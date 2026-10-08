// 装备仓库顶部的羁绊筛选条: 「全部」+ 候选里出现过的每个羁绊(带件数), 单选, 再点一次取消。
// 芯片配色与物品格右上角的羁绊色签同源(bondAccent), 玩家看到颜色就能对上格子。

import type { CSSProperties } from "react";
import type { BondDef } from "@/data/roster/bonds";
import { bondAccent } from "@/ui/common/bond/BondTag";
import { cx } from "@/ui/common/shared/cx";
import s from "./BondFilterBar.module.css";

/** 没有羁绊的装备归到这一项。 */
export const NO_BOND = "__none";

export interface BondFilterOption {
  id: string;
  def?: BondDef;
  count: number;
}

export function BondFilterBar({
  options,
  total,
  value,
  onChange,
}: {
  options: BondFilterOption[];
  total: number;
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div className={s.bar} role="group" aria-label="按羁绊筛选">
      <button
        type="button"
        className={cx(s.chip, value === null && s.isOn)}
        aria-pressed={value === null}
        onClick={() => onChange(null)}
      >
        全部 <b>{total}</b>
      </button>
      {options.map(({ id, def, count }) => (
        <button
          key={id}
          type="button"
          className={cx(s.chip, value === id && s.isOn)}
          style={def ? ({ "--chip-color": bondAccent(def) } as CSSProperties) : undefined}
          aria-pressed={value === id}
          onClick={() => onChange(value === id ? null : id)}
        >
          {def?.name ?? "无羁绊"} <b>{count}</b>
        </button>
      ))}
    </div>
  );
}
