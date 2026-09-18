import { NAV_BAR } from "./navigationFrameGeometry";
import { ACCENT, DEEP, HOT, PALE } from "./navigationFrameTones";

// 选中卡底色沿 x 的主色透明度（实测：亮条旁最浓，约 1/3 处已接近透明，右端略回升）。
const FILL_STOPS: [number, number][] = [
  [0, 0.55], [0.03, 0.5], [0.07, 0.38], [0.1, 0.28], [0.14, 0.26],
  [0.29, 0.18], [0.37, 0.11], [0.6, 0.04], [0.8, 0.03], [1, 0.06],
];

interface Props {
  id: string;
  width: number;
  /** 选中卡高度。 */
  cardHeight: number;
  /** 槽位高度。 */
  height: number;
  outline: string;
}

export function NavigationFrameDefs({ id, width: w, cardHeight: ch, height: h, outline }: Props) {
  return (
    <defs>
      <linearGradient id={`${id}-fill`} x1="0" y1="0" x2={w} y2="0" gradientUnits="userSpaceOnUse">
        {FILL_STOPS.map(([offset, opacity]) => (
          <stop key={offset} offset={offset} stopColor={ACCENT} stopOpacity={opacity} />
        ))}
      </linearGradient>
      <linearGradient id={`${id}-floor`} x1="0" y1="0" x2="0" y2={ch} gradientUnits="userSpaceOnUse">
        <stop offset=".7" stopColor={ACCENT} stopOpacity="0" />
        <stop offset="1" stopColor={ACCENT} stopOpacity=".06" />
      </linearGradient>
      <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2={w * 0.2} y2={ch} gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" stopOpacity=".07" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${id}-bar`} x1="0" y1="0" x2="0" y2={ch} gradientUnits="userSpaceOnUse">
        <stop stopColor={`color-mix(in srgb, ${HOT} 70%, ${ACCENT})`} />
        <stop offset=".22" stopColor={`color-mix(in srgb, ${HOT} 80%, ${PALE})`} />
        <stop offset=".45" stopColor={PALE} />
        <stop offset=".7" stopColor={`color-mix(in srgb, ${PALE} 70%, ${HOT})`} />
        <stop offset="1" stopColor={PALE} />
      </linearGradient>
      <linearGradient id={`${id}-bleed`} x1={NAV_BAR} y1="0" x2={NAV_BAR + 12} y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor={ACCENT} stopOpacity=".55" />
        <stop offset="1" stopColor={ACCENT} stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${id}-line`} x1="0" y1="0" x2="0" y2={h} gradientUnits="userSpaceOnUse">
        <stop stopColor={`color-mix(in srgb, ${ACCENT} 18%, #b8b3b3)`} stopOpacity=".62" />
        <stop offset="1" stopColor="#b8b6b6" stopOpacity=".45" />
      </linearGradient>
      <clipPath id={`${id}-clip`}><path d={outline} /></clipPath>
      <filter id={`${id}-blur`} x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="2.2" /></filter>
      <filter id={`${id}-soft`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4.5" /></filter>
      <linearGradient id={`${id}-deep`} x1="0" y1="0" x2={w} y2="0" gradientUnits="userSpaceOnUse">
        <stop stopColor={DEEP} stopOpacity=".2" />
        <stop offset="1" stopColor={DEEP} stopOpacity=".1" />
      </linearGradient>
    </defs>
  );
}
