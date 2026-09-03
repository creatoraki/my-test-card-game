// 属性面板 —— 三组只读面板属性。
//
// ★ 角色不设等级也不加点(角色养成设计.md 第一章), 故这里刻意没有任何 ＋ 按钮:
//   这些数字进游戏后只由装备与羁绊改变。
// ★ 分组与 ref 旋钮住在 common/statGroups.ts —— 与角色档案 Modal 共用同一份, 两处不各写一遍。
//   ⚠ ref 是**纯展示旋钮**: 只决定底部那条微条画多长, 不参与任何结算。

import type { CSSProperties } from "react";
import type { StatBlock } from "@/engine";
import { StatIcon } from "@/ui/common/StatIcon";
import { REF_DEFAULT_PCT, STAT_GROUPS } from "@/ui/common/statGroups";
import { cx } from "@/ui/common/cx";
import { useCountUp } from "@/ui/hooks/useCountUp";
import s from "./StatsPanel.module.css";

// 内容错峰入场的起点(ms)与步长。⚠ 与 StatsPanel.module.css 里 statGroupIn 的
// animation-delay 算式是同两个数, 改一处要改两处 —— JS 这边只有数值滚动的起跑时间要对齐。
const CONTENT_DELAY_MS = 160;
const STAGGER_MS = 55;

export function StatsPanel({ stats, preview = null }: { stats: StatBlock; preview?: StatBlock | null }) {
  return (
    <div className={s.groups}>
      {STAT_GROUPS.map((group, gi) => (
        <div
          key={group.title}
          className={cx(s.group, group.wide && s["is-wide"])}
          style={{ "--i": gi } as CSSProperties}
        >
          <span className={s["group-title"]}>{group.title}</span>
          <div className={cx(s.rows, group.wide && s["is-two-col"])}>
            {group.rows.map((row) => (
              <AttrRow
                key={row.key}
                statKey={row.key}
                label={row.label}
                value={stats[row.key]}
                next={preview?.[row.key]}
                pct={row.pct}
                ref100={row.ref ?? (row.pct ? REF_DEFAULT_PCT : undefined)}
                delay={CONTENT_DELAY_MS + gi * STAGGER_MS}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// 一行属性: 图标 + 标签 + 滚动数值 + 底边一条占比微条。
// ⚠ 条画在行的底边而不是单独占一行 —— 每行再多一行高度会撑爆这一栏。
function AttrRow({
  statKey,
  label,
  value,
  next,
  pct,
  ref100,
  delay,
}: {
  statKey: keyof StatBlock;
  label: string;
  value: number;
  next?: number;
  pct?: boolean;
  ref100?: number;
  delay: number;
}) {
  const shown = useCountUp(Math.round(value), delay);
  const fill = ref100 ? Math.max(0, Math.min(1, value / ref100)) : 0;
  const nextFill = ref100 && next !== undefined ? Math.max(0, Math.min(1, next / ref100)) : fill;
  const delta = next === undefined ? 0 : next - value;
  const hasDelta = Math.abs(delta) >= 0.5;
  return (
    <div
      className={s.attr}
      style={{
        "--pct": fill,
        "--pct-next": nextFill,
        "--pct-ghost-start": delta > 0 ? fill : nextFill,
        "--pct-ghost": Math.abs(nextFill - fill),
      } as CSSProperties}
    >
      <StatIcon statKey={statKey} className={s["attr-icon"]} />
      <span className={s["attr-label"]}>{label}</span>
      <strong className={s["attr-value"]}>
        {shown}
        {pct ? "%" : ""}
        {hasDelta && (
          <span className={cx(s.delta, delta > 0 ? s["is-up"] : s["is-down"])}>
            {delta > 0 ? "+" : ""}{Math.round(delta)}
          </span>
        )}
      </strong>
      {hasDelta && <span className={cx(s["attr-ghost"], delta > 0 ? s["is-up"] : s["is-down"])} aria-hidden="true" />}
    </div>
  );
}
