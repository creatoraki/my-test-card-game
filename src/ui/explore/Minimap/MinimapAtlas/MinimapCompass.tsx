// 四角星罗盘 —— 大图左上角徽标与右下角指北针共用。每个尖角分亮暗两面, 模拟设计图的立体星芒。

const LONG = 48;
const SHORT = 20;
const WAIST = 7;

/** 一个尖角的两个半面: 以圆心为原点, 朝 angle 方向伸出。 */
function blade(angle: number, length: number, key: string) {
  const rad = (angle * Math.PI) / 180;
  const tip = [50 + Math.cos(rad) * length, 50 + Math.sin(rad) * length];
  const side = (offset: number) => [
    50 + Math.cos(rad + offset) * WAIST,
    50 + Math.sin(rad + offset) * WAIST,
  ];
  const [l, r] = [side(-Math.PI / 2), side(Math.PI / 2)];
  const pt = (p: number[]) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  return <g key={key}>
    <polygon points={`50,50 ${pt(tip)} ${pt(l)}`} fill="#e6f3ff" />
    <polygon points={`50,50 ${pt(tip)} ${pt(r)}`} fill="#3f8fe8" />
  </g>;
}

export function MinimapCompass({ size, ring = true, className }: { size: number; ring?: boolean; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 100 100" aria-hidden>
    {ring && <>
      <circle cx="50" cy="50" r="33" fill="none" stroke="#5cb6ff" strokeWidth="1.6" opacity="0.8" />
      <circle cx="50" cy="50" r="27" fill="none" stroke="#2f7fd8" strokeWidth="0.8" opacity="0.6" />
    </>}
    {[45, 135, 225, 315].map((angle) => blade(angle, SHORT, `s${angle}`))}
    {[270, 0, 90, 180].map((angle) => blade(angle, LONG, `l${angle}`))}
    <circle cx="50" cy="50" r="2.4" fill="#ffffff" />
  </svg>;
}

export default MinimapCompass;
