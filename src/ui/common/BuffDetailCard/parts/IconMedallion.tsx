// 头部左侧的图标徽章: 外圈虚线弧 + 暗环 + 主题色主环 + 上下左右四角星 + 散落光点, 中心圆内放状态图。
// 设计图中徽章中心 (272,297)、主环直径 ~290、尖刺外沿跨度 ~320, 按 k=0.339 缩放。

import type { ReactNode } from "react";
import { sparkPath } from "../geometry";
import s from "./IconMedallion.module.css";

const C = 64;
const SPARKS = [
  [C, C - 49],
  [C + 49, C],
  [C, C + 49],
  [C - 49, C],
] as const;
const DOTS = [
  [22, 20, 1.2],
  [16, 40, 0.9],
  [104, 16, 1.1],
  [112, 30, 0.8],
  [96, 110, 1],
  [26, 104, 0.9],
  [120, 58, 0.7],
] as const;

export function IconMedallion({ children }: { children: ReactNode }) {
  return (
    <div className={s.medallion} aria-hidden="true">
      <svg className={s.back} viewBox="0 0 128 128" width="128" height="128">
        <circle className={s.halo} cx={C} cy={C} r="60" strokeDasharray="1.5 3.5" />
        <path className={s.halo} d="M14 46A52 52 0 0 1 46 14M82 114A52 52 0 0 0 114 82" />
        <circle className={s.dim} cx={C} cy={C} r="55" />
        {DOTS.map(([x, y, r]) => (
          <circle key={`${x}-${y}`} className={s.dot} cx={x} cy={y} r={r} />
        ))}
      </svg>
      <div className={s.core}>{children}</div>
      <svg className={s.front} viewBox="0 0 128 128" width="128" height="128">
        <circle className={s.ring} cx={C} cy={C} r="47" />
        <circle className={s["ring-inner"]} cx={C} cy={C} r="43.5" />
        {SPARKS.map(([x, y], index) => (
          <path
            key={index}
            className={s.spark}
            d={index % 2 === 0 ? sparkPath(x, y, 11, 5, 1.6) : sparkPath(x, y, 5, 11, 1.6)}
          />
        ))}
      </svg>
    </div>
  );
}
