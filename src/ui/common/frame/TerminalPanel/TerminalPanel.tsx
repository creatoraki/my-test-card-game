// 研究中心三栏共用的编号面板: 「01 角色选择 OPERATOR」式页眉 + 切角暗板 + 红色角标。
// 英文 deco 只作装饰(aria-hidden), 可读信息一律走中文 title。
import type { ReactNode } from "react";
import { cx } from "@/ui/common/shared/cx";
import s from "./TerminalPanel.module.css";

interface Props {
  /** 两位编号, 如 "01"。 */
  index: string;
  title: string;
  /** 标题后的英文装饰字。 */
  deco?: string;
  /** 页眉右侧: 计数等读数; 缺省画一道短横。 */
  extra?: ReactNode;
  /** 页眉下分隔线的样式: 红色高亮(详情栏) / 暗灰 / 不画。 */
  rule?: "hot" | "dim" | "none";
  ariaLabel: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function TerminalPanel({
  index,
  title,
  deco,
  extra,
  rule = "dim",
  ariaLabel,
  className,
  bodyClassName,
  children,
}: Props) {
  return (
    <section className={cx(s.panel, className)} aria-label={ariaLabel}>
      <span className={s.frame} aria-hidden="true" />
      <span className={s.corners} aria-hidden="true" />
      <header className={s.header} data-rule={rule}>
        <span className={s.index} aria-hidden="true">{index}</span>
        <h3 className={s.title}>{title}</h3>
        {deco && <span className={s.deco} aria-hidden="true">{deco}</span>}
        <span className={s.extra}>{extra ?? <i className={s.dash} aria-hidden="true" />}</span>
      </header>
      <div className={cx(s.body, bodyClassName)}>{children}</div>
    </section>
  );
}
