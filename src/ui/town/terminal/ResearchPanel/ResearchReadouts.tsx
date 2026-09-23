// 研究中心页眉右侧: 英文装饰字 + 红色斜线 + 三组「图标 / 标签 / 红色大数字」读数, 组间竖线分隔。
import { Fragment, type ReactNode } from "react";
import s from "./ResearchReadouts.module.css";

export interface Readout {
  icon: ReactNode;
  label: string;
  value: string;
}

interface Props {
  /** 副标题后的英文装饰字。 */
  deco: string;
  readouts: Readout[];
}

export function ResearchReadouts({ deco, readouts }: Props) {
  return (
    <div className={s.readouts}>
      <span className={s.deco} aria-hidden="true">{deco}</span>
      <span className={s.slash} aria-hidden="true" />
      {readouts.map((readout, index) => (
        <Fragment key={readout.label}>
          {index > 0 && <span className={s.divider} aria-hidden="true" />}
          <div className={s.readout}>
            <span className={s.icon}>{readout.icon}</span>
            <span className={s.label}>{readout.label}</span>
            <strong className={s.value}>{readout.value}</strong>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
