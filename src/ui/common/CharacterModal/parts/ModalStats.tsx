// 档案中栏: 只读属性表。分组与条长旋钮来自 common/statGroups.ts(与角色详情页同一份)。

import type { CSSProperties } from "react";
import type { StatBlock } from "@/engine";
import { StatIcon } from "@/ui/common/StatIcon";
import { STAT_GROUPS, statFill, type StatRow } from "@/ui/common/statGroups";
import { cx } from "@/ui/common/cx";
import s from "../CharacterModal.module.css";

export function ModalStats({ stats }: { stats: StatBlock }) {
  return (
    <div className={s["cm-stats"]}>
      <span className={s["cm-block-title"]}>面板属性 · 只读</span>
      <div className={s["cm-stat-groups"]}>
        {STAT_GROUPS.map((group) => (
          <div key={group.title} className={cx(s["cm-stat-group"], group.wide && s["is-wide"])}>
            <span className={s["cm-stat-group-title"]}>{group.title}</span>
            <div className={cx(s["cm-stat-rows"], s["is-two-col"])}>
              {group.rows.map((row) => (
                <AttrRow key={row.key} row={row} value={stats[row.key]} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttrRow({ row, value }: { row: StatRow; value: number }) {
  return (
    <div className={s["cm-attr"]} style={{ "--pct": statFill(value, row) } as CSSProperties}>
      <StatIcon statKey={row.key} className={s["cm-attr-icon"]} />
      <span className={s["cm-attr-label"]}>{row.label}</span>
      <strong className={s["cm-attr-value"]}>
        {Math.round(value)}
        {row.pct ? "%" : ""}
      </strong>
    </div>
  );
}
