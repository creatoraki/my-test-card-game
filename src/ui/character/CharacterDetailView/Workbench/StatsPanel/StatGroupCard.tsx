// 单个属性分组的玻璃框 —— 标题条(▌标题 · 副标题) + 整条分隔线 + 右上序号水印 + 行插槽。
//
// ★ 框本身不认识属性数据: 行由 StatsPanel 作为 children 传进来, 这里只负责"框"。
// ★ 序号是渲染侧算的(01/02/03), 不进 statGroups 数据 —— 它只是版面装饰。
// ★ 分隔线独立成一行: 稿子上它横跨整个框宽, 不是标题行里的那种"剩余宽度"延伸线。

import { DetailFrame } from "@/ui/common/DetailFrame";
import type { CSSProperties, ReactNode } from "react";
import { cx } from "@/ui/common/cx";
import s from "./StatGroupCard.module.css";

// 宽组序号左侧的手写感装饰小字。⚠ 纯版面装饰, 不进 statGroups —— 那份数据是与角色档案
// Modal 共用的真相点, 只放属性语义, 不放某一处版面的花字。
const WIDE_WATERMARK = "驶向未来";

interface Props {
  title: string;
  subtitle?: string;
  /** 组序(从 0 起): 决定序号水印与错峰入场的延迟。 */
  index: number;
  /** 横跨整行、内部三列的宽组。 */
  wide?: boolean;
  children: ReactNode;
}

export function StatGroupCard({ title, subtitle, index, wide = false, children }: Props) {
  return (
    <section
      className={cx(s.card, wide && s["is-wide"])}
      style={{ "--i": index } as CSSProperties}
    >
      <DetailFrame subtle />
      {wide && <span className={s.watermark} aria-hidden="true">{WIDE_WATERMARK}</span>}
      <span className={s.ordinal} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
      <header className={s.head}>
        <h4 className={s.title}>{title}</h4>
        {wide && subtitle && <span className={s.sub}>{subtitle}</span>}
      </header>
      <span className={s.rule} aria-hidden="true" />
      <div className={cx(s.rows, wide && s["is-two-col"])}>{children}</div>
    </section>
  );
}
