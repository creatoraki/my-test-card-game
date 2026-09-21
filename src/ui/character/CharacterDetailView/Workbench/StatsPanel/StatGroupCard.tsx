// 单个属性分组的玻璃框 —— 标题条(▌标题 · 副标题) + 整条分隔线 + 右上序号水印 + 行插槽。
//
// ★ 框本身不认识属性数据: 行由 StatsPanel 作为 children 传进来, 这里只负责"框"。
// ★ 序号是渲染侧算的(01/02/03), 不进 statGroups 数据 —— 它只是版面装饰。
// ★ 分隔线独立成一行: 稿子上它横跨整个框宽, 不是标题行里的那种"剩余宽度"延伸线。
// ★ 两种排布: 左栏框内行按「两列 × 三行」铺; 右侧竖栏(side)纵向单列, 行带独立格子底。

import { DetailFrame } from "@/ui/common/DetailFrame";
import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "./StatGroupCard.module.css";

interface Props {
  title: string;
  subtitle?: string;
  /** 组序(从 0 起): 决定序号水印与错峰入场的延迟。 */
  index: number;
  /** 右侧通高竖栏: 纵向单列, 占满整个属性区高度。 */
  side?: boolean;
  children: ReactNode;
}

export function StatGroupCard({ title, subtitle, index, side = false, children }: Props) {
  return (
    <section
      className={cx(s.card, side && s["is-side"])}
      style={{ "--i": index } as CSSProperties}
    >
      <DetailFrame subtle />
      <span className={s.ordinal} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <header className={s.head}>
        <h4 className={s.title}>{title}</h4>
        {subtitle && <span className={s.sub}>{subtitle}</span>}
      </header>
      <span className={s.rule} aria-hidden="true" />
      <div className={cx(s.rows, !side && s["is-grid"])}>{children}</div>
    </section>
  );
}
