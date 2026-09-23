// 正文面板 / 底栏共用的斜切细边框盒子: 高度随内容变, 所以按实测像素画 path。

import type { ReactNode } from "react";
import { useBoxSize } from "@/ui/common/frame/HudFrame";
import { cx } from "@/ui/common/shared/cx";
import { chamferRect } from "../geometry";
import s from "./ChamferPanel.module.css";

export function ChamferPanel({
  chamfer,
  className,
  children,
}: {
  chamfer: number;
  className?: string;
  children: ReactNode;
}) {
  const { ref, size } = useBoxSize<HTMLDivElement>();
  const { width: w, height: h } = size;

  return (
    <div ref={ref} className={cx(s.panel, className)}>
      {w > 0 && h > 0 && (
        <svg className={s.frame} width={w} height={h} aria-hidden="true">
          <path d={chamferRect(0.5, 0.5, w - 0.5, h - 0.5, chamfer)} />
        </svg>
      )}
      {children}
    </div>
  );
}
