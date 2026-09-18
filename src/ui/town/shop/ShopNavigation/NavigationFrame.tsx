import { useId } from "react";
import { NAV_BAR, NAV_LINE_X, navigationCardPaths, navigationIdlePaths, type NavStroke } from "./navigationFrameGeometry";
import { NavigationFrameDefs } from "./NavigationFrameDefs";
import { ACCENT, FLARE, HOT, TONE } from "./navigationFrameTones";
import s from "./NavigationFrame.module.css";

// 导航牌：未选中为无底板的分隔线行（左右竖线 + 顶部分隔线，末行补底线与右下切角），
// 选中为槽位上部的切角玻璃卡（左亮条 + 分段描边 + 右下热光折角）。两层同时渲染，靠 data-active 过渡。
interface Props {
  width: number;
  /** 槽位高度；选中卡比槽位短 NAV_SLOT_INSET。 */
  height: number;
  active?: boolean;
  /** 是否为整组最后一行（未选中时补底线与右下切角）。 */
  last?: boolean;
}

function Strokes({ list }: { list: NavStroke[] }) {
  return (
    <>
      {list.map((item) => (
        <path key={item.d} d={item.d} stroke={TONE[item.tone]} strokeOpacity={item.opacity} strokeWidth={item.width} />
      ))}
    </>
  );
}

export function NavigationFrame({ width: w, height: h, active = false, last = false }: Props) {
  const id = useId();
  const ref = (name: string) => `url(#${id}-${name})`;
  const card = navigationCardPaths(w, h);
  const idle = navigationIdlePaths(w, h, last);
  const ch = card.height;
  return (
    <svg className={s.frame} width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden="true" data-active={active || undefined}>
      <NavigationFrameDefs id={id} width={w} cardHeight={ch} height={h} outline={card.outline} />

      <g className={s.idle}>
        <rect className={s.idleFill} y={idle.lineTop} width={w} height={idle.lineBottom - idle.lineTop} />
        <rect x={NAV_LINE_X - 0.6} y={idle.lineTop} width="1.2" height={idle.lineBottom - idle.lineTop} fill={ref("line")} />
        <Strokes list={idle.strokes} />
        {idle.chamfer && (
          <>
            <path d={idle.chamfer} stroke={ACCENT} strokeWidth="3" opacity=".35" filter={ref("blur")} />
            <path d={idle.chamfer} stroke={ACCENT} strokeOpacity=".8" strokeWidth="1.2" />
          </>
        )}
      </g>

      <g className={s.active}>
        <rect x="-10" width="12" height={ch} fill={ACCENT} opacity=".35" filter={ref("soft")} />
        <path d={card.outline} fill={ref("deep")} />
        <path d={card.outline} fill={ref("fill")} />
        <path d={card.outline} fill={ref("floor")} />
        <path d={card.sheen} fill={ref("sheen")} />
        <g clipPath={ref("clip")}>
          <rect x={NAV_BAR} width="12" height={ch} fill={ref("bleed")} />
          <path d={card.hot} stroke={ACCENT} strokeWidth="7" opacity=".35" filter={ref("soft")} />
        </g>
        <Strokes list={card.strokes} />
        <path d={card.hot} stroke={HOT} strokeWidth="4.5" opacity=".6" filter={ref("blur")} />
        <path d={card.flare} stroke={FLARE} strokeWidth="2.2" strokeLinecap="square" />
        <rect x="-1" width={NAV_BAR + 2} height={ch} fill={ACCENT} opacity=".6" filter={ref("blur")} />
        <rect width={NAV_BAR} height={ch} fill={ref("bar")} />
      </g>
    </svg>
  );
}
