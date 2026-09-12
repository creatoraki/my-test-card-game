// 商店与仓库共用的右侧详情栏外壳。

import type { ReactNode } from "react";
import s from "./ShopDetailAside.module.css";

interface Props {
  /** 空态时显示的标题与提示；有内容时只渲染 children。 */
  heading?: string;
  empty?: string;
  children?: ReactNode;
}

export function ShopDetailAside({ heading, empty, children }: Props) {
  if (children !== null && children !== undefined && children !== false) {
    return (
      <aside className={s.detail}>
        <div className={s.content}>{children}</div>
      </aside>
    );
  }

  return (
    <aside className={s.detail}>
      {heading && <h3 className={s.heading}>{heading}</h3>}
      {empty && <p className={s.empty}>{empty}</p>}
    </aside>
  );
}
