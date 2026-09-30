// 小地图道路 —— 每条路叠三层 SVG 描边: 模糊外光 → 亮蓝管壁 → 深蓝细芯, 做出设计图的「空心霓虹管」。
// 实线 = 两端都去过的路; 虚线 = 只知道存在、还没走过的路。
// 四档强调(由弱到强):
//   faint  未走过且不与当前房相连 —— 淡虚线;
//   walked 走过但不与当前房相连 —— 略压暗, 把视线让给出口;
//   exit   当前房间的出口 —— 更亮更粗, 白色流光由当前房向外缓流;
//   target 脚下传送门通往的那条出口 —— 转金色, 流光加速并与目标格同频呼吸。

import { useId } from "react";
import type { PlacedLink } from "./minimapLayout";
import s from "./MinimapRoutes.module.css";

type RouteMode = "faint" | "walked" | "exit" | "target";

const MODE_ORDER: Record<RouteMode, number> = { faint: 0, walked: 1, exit: 2, target: 3 };

function modeOf(link: PlacedLink, targetId: string | null): RouteMode {
  if (link.active) return link.to === targetId ? "target" : "exit";
  return link.solid ? "walked" : "faint";
}

export function MinimapRoutes({
  links,
  width,
  height,
  road,
  targetId,
}: {
  links: PlacedLink[];
  width: number;
  height: number;
  /** 管壁粗细(px)。 */
  road: number;
  targetId: string | null;
}) {
  const glowId = `route-glow-${useId().replace(/:/g, "")}`;
  // 强调越高越后画, 保证出口与目标路压在最上层。
  const routes = links
    .map((link) => ({ link, mode: modeOf(link, targetId) }))
    .sort((a, b) => MODE_ORDER[a.mode] - MODE_ORDER[b.mode]);
  const period = road * 3;

  return <svg className={s.routes} width={width} height={height} aria-hidden>
    <defs>
      <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation={road * 0.7} />
      </filter>
    </defs>
    {routes.map(({ link, mode }) => {
      const key = `${link.from}|${link.to}`;
      if (mode === "faint") {
        return <g key={key} className={s.faint}>
          <path d={link.d} className={s.tube} strokeWidth={road * 0.7} strokeDasharray={`${road * 1.6} ${road * 1.4}`} />
        </g>;
      }
      const emphasis = mode === "exit" || mode === "target";
      return <g key={key} className={s[mode]} data-unwalked={!link.solid || undefined}>
        <path d={link.d} className={s.glow} strokeWidth={road * (emphasis ? 2.8 : 2.2)} filter={`url(#${glowId})`} />
        <path d={link.d} className={s.tube} strokeWidth={road * (emphasis ? 1.2 : 1)} />
        <path d={link.d} className={s.core} strokeWidth={Math.max(1.5, road * 0.34)} />
        {emphasis && <path
          d={link.d}
          className={s.flow}
          strokeWidth={Math.max(2, road * 0.5)}
          strokeDasharray={`${road * 0.9} ${period - road * 0.9}`}
        >
          {/* dashoffset 由一个周期递减到 0, 光点沿 from → to 前进。 */}
          <animate
            attributeName="stroke-dashoffset"
            from={period}
            to={0}
            dur={mode === "target" ? "0.5s" : "1.2s"}
            repeatCount="indefinite"
          />
        </path>}
      </g>;
    })}
  </svg>;
}

export default MinimapRoutes;
