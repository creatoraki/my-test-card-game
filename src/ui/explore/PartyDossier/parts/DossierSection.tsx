// 队员档案里的编号分区: 研究中心 TerminalPanel 的「01 标题 DECO」页眉 + 切角暗板 + 角标,
// 只把主题红换成探索浮层的主题色(--k)。英文 deco 只作装饰(aria-hidden)。
import type { ReactNode } from "react";
import { cx } from "@/ui/common/shared/cx";
import s from "./DossierSection.module.css";

interface Props {
  index: string;
  title: string;
  deco?: string;
  /** 页眉右侧: 读数 / 页签等。 */
  extra?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function DossierSection({ index, title, deco, extra, className, bodyClassName, children }: Props) {
  return (
    <section className={cx(s.section, className)} aria-label={title}>
      <span className={s.frame} aria-hidden="true" />
      <span className={s.corners} aria-hidden="true" />
      <header className={s.head}>
        <span className={s.index} aria-hidden="true">{index}</span>
        <h3 className={s.title}>{title}</h3>
        {deco && <span className={s.deco} aria-hidden="true">{deco}</span>}
        <div className={s.extra}>{extra}</div>
      </header>
      <div className={cx(s.body, bodyClassName)}>{children}</div>
    </section>
  );
}
