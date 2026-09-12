// 一行属性: 图标 + 标签 + 数值, 下方一条独立的胶囊进度条。
//
// ★ 版面按美术稿 1:1 复刻(稿子 835px 宽 → 设计 px 的换算比 k ≈ 1.6):
//   图标 32px、标签 22px、数值 24px、条高 10px、行距 50px;
//   条的**左端与标签左缘对齐, 右端与数值右缘对齐** —— 它占满第 2、3 列。
// ⚠ 这里没有任何卡片底色: 稿子上属性行就是深蓝玻璃上的白字, 白底卡片是旧版的自创。
// ⚠ ref 是纯展示旋钮(见 common/statGroups.ts), 只决定这条微条画多长, 不参与任何结算。
// ★ 换装预览时多画一段「幽灵条」标出增/减区间, 数值右侧同步挂 +N / -N 色块。

import type { CSSProperties } from "react";
import type { StatBlock } from "@/engine";
import { DetailStatIcon } from "./DetailStatIcon";
import { cx } from "@/ui/common/cx";
import { useCountUp } from "@/ui/hooks/useCountUp";
import s from "./AttrRow.module.css";

interface Props {
  statKey: keyof StatBlock;
  label: string;
  value: number;
  /** 换装预览后的值; 未预览时为 undefined。 */
  next?: number;
  pct?: boolean;
  ref100?: number;
  delay: number;
  /** 三列排布的「特殊属性」组用: 稿子上这一组的行带独立格子底, 且整体收窄一档。 */
  compact?: boolean;
}

export function AttrRow({ statKey, label, value, next, pct, ref100, delay, compact = false }: Props) {
  const shown = useCountUp(Math.round(value), delay);
  const fill = ref100 ? Math.max(0, Math.min(1, value / ref100)) : 0;
  const nextFill = ref100 && next !== undefined ? Math.max(0, Math.min(1, next / ref100)) : fill;
  const delta = next === undefined ? 0 : next - value;
  const hasDelta = Math.abs(delta) >= 0.5;
  return (
    <div
      className={cx(s.attr, statKey === "critDamage" && s["is-critical"], compact && s["is-compact"])}
      style={{
        "--pct": fill,
        "--pct-ghost-start": delta > 0 ? fill : nextFill,
        "--pct-ghost": Math.abs(nextFill - fill),
      } as CSSProperties}
    >
      <DetailStatIcon statKey={statKey} className={s["attr-icon"]} />
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
      <span className={s.bar} aria-hidden="true">
        <i className={s["bar-fill"]} />
        {hasDelta && <i className={cx(s["bar-ghost"], delta > 0 ? s["is-up"] : s["is-down"])} />}
      </span>
    </div>
  );
}
