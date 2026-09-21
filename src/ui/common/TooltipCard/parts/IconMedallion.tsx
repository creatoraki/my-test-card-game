// 头部左侧的状态图标区域，素材直接铺在 128×128 的定位盒内。

import type { ReactNode } from "react";
import s from "./IconMedallion.module.css";

export function IconMedallion({ children }: { children: ReactNode }) {
  return (
    <div className={s.medallion} aria-hidden="true">
      <div className={s.core}>{children}</div>
    </div>
  );
}
