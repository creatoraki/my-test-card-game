// 小地图道路 —— 每条路叠三层 SVG 描边: 模糊外光 → 亮蓝管壁 → 深蓝细芯, 做出设计图的「空心霓虹管」。
// 实线 = 两端都去过的路; 虚线 = 只知道存在、还没走过的路。

import { useId } from "react";
import type { PlacedLink } from "./minimapLayout";
import s from "./MinimapRoutes.module.css";

export function MinimapRoutes({
  links,
  width,
  height,
  road,
}: {
  links: PlacedLink[];
  width: number;
  height: number;
  /** 管壁粗细(px)。 */
  road: number;
}) {
  const glowId = `route-glow-${useId().replace(/:/g, "")}`;
  return <svg className={s.routes} width={width} height={height} aria-hidden>
    <defs>
      <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={road * 0.7} />
      </filter>
    </defs>
    {links.map((link) => {
      const key = `${link.from}|${link.to}`;
      return link.solid
        ? <g key={key}>
          <path d={link.d} className={s.glow} strokeWidth={road * 2.2} filter={`url(#${glowId})`} />
          <path d={link.d} className={s.tube} strokeWidth={road} />
          <path d={link.d} className={s.core} strokeWidth={Math.max(1.5, road * 0.34)} />
        </g>
        : <g key={key} className={s.faint}>
          <path d={link.d} className={s.tube} strokeWidth={road * 0.7} strokeDasharray={`${road * 1.6} ${road * 1.4}`} />
        </g>;
    })}
  </svg>;
}

export default MinimapRoutes;
