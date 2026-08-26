// ★ 插画区的默认画面 ★ —— 只在调用方没传 art 时兜底。
//
// 画的是「地平线上的废墟天际线」: 远层剪影压低、近层剪影贴底, 中间夹一条地平线光带,
// 把 .scenePlaceholder 下半部(光球以下)填实, 同时把光球衬成地平线上方的光源。
//
// ⚠ 两条硬约束, 改画面时不要破坏:
//   · 颜色一律 currentColor —— 容器 .skyline 把 --event-accent 灌进 color, 各浮层换主色时画面跟着换。
//     任何写死的亮色都会在换主色时穿帮(深色底 #0a1013 是"背光剪影"的黑, 不算主色, 可以写死)。
//   · x > 226 的右下区块必须压到 y ≥ 306 —— 那块被 .sceneCaption(事件档案 / XXX)占着,
//     楼体或窗口光点探进去就会把小字糊掉。
import { useId } from "react";
import s from "./SceneArt.module.css";

/** 远层天际线 —— 低矮、起伏小, 只做纵深。 */
const FAR_SKYLINE =
  "M0,212 L0,196 L18,196 L18,186 L34,186 L34,200 L52,200 L52,178 L66,178 L66,190 " +
  "L88,190 L88,172 L104,172 L104,192 L126,192 L126,182 L146,182 L146,198 L168,198 " +
  "L168,176 L186,176 L186,194 L206,194 L206,184 L226,184 L226,200 L248,200 L248,190 " +
  "L268,190 L268,202 L292,202 L292,194 L310,194 L310,204 L330,204 L330,212 Z";

/** 近层废墟 —— 方正、高差大; 右段(x>226)刻意压低给右下角小字让位。 */
const NEAR_SKYLINE =
  "M0,330 L0,252 L14,252 L14,240 L30,240 L30,262 L44,262 L44,228 L62,228 L62,246 " +
  "L78,246 L78,236 L96,236 L96,258 L112,258 L112,222 L132,222 L132,244 L150,244 " +
  "L150,234 L166,234 L166,256 L182,256 L182,242 L200,242 L200,264 L214,264 L214,250 " +
  "L226,250 L226,312 L252,312 L252,308 L272,308 L272,318 L298,318 L298,310 L320,310 " +
  "L320,320 L330,320 L330,330 Z";

/** 窗口光点 —— [x, y, 透明度], 只落在 x < 220 的近层楼体上。 */
const WINDOWS: [number, number, number][] = [
  [18, 248, 0.55], [24, 248, 0.3], [18, 258, 0.42], [24, 259, 0.62],
  [48, 236, 0.68], [55, 236, 0.35], [48, 247, 0.5], [55, 248, 0.28],
  [117, 230, 0.7], [124, 230, 0.4], [117, 241, 0.33], [124, 242, 0.58], [117, 252, 0.45],
  [171, 263, 0.5], [176, 264, 0.3],
  [204, 271, 0.44],
];

/** 前景浮尘 —— [cx, cy, r]。 */
const MOTES: [number, number, number][] = [
  [60, 300, 1.1], [104, 292, 0.8], [150, 306, 1], [196, 296, 0.75], [212, 286, 0.9],
];

export function SceneSkyline() {
  const uid = useId();
  const glowId = `sceneArtGlow-${uid}`;

  return (
    <svg className={s.skyline} viewBox="0 0 330 330" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={glowId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="48%" stopColor="currentColor" stopOpacity="0.2" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 地平线光带 —— 剪影的底光, 也是整块画面的视觉分界。 */}
      <rect x="0" y="152" width="330" height="118" fill={`url(#${glowId})`} />

      {/* 远层 / 近层剪影 */}
      <path d={FAR_SKYLINE} fill="currentColor" opacity="0.16" />
      <path d={NEAR_SKYLINE} fill="#0a1013" stroke="currentColor" strokeWidth="1" className={s.nearEdge} />

      {/* 窗口光点 */}
      <g className={s.windows}>
        {WINDOWS.map(([x, y, opacity]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="1.6" height="2.8" fill="currentColor" opacity={opacity} />
        ))}
      </g>

      {/* 天线杆 + 顶灯 */}
      <g stroke="currentColor" strokeWidth="0.7" opacity="0.7">
        <line x1="122" y1="222" x2="122" y2="206" />
        <line x1="53" y1="228" x2="53" y2="216" />
      </g>
      <circle cx="122" cy="205" r="1.3" fill="currentColor" className={s.beacon} />
      <circle cx="53" cy="215" r="1" fill="currentColor" opacity="0.6" />

      {/* 目标点标注 —— ▽ + 引线, 落在 x=88 那栋楼顶。 */}
      <g className={s.marker}>
        <path d="M82,158 L94,158 L88,168 Z" fill="currentColor" opacity="0.75" />
        <line x1="88" y1="170" x2="88" y2="234" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 4" opacity="0.45" />
      </g>

      {/* 底部刻度尺 —— HUD 读数感, 压在近层剪影之上。 */}
      <g stroke="currentColor" strokeWidth="0.6" opacity="0.32">
        <line x1="22" y1="300" x2="150" y2="300" />
        {[22, 38, 54, 70, 86, 102, 118, 134, 150].map((x, index) => (
          <line key={x} x1={x} y1="300" x2={x} y2={index % 2 === 0 ? 295 : 297} />
        ))}
      </g>

      {/* 扫描线 —— 在地平线附近极慢往复。 */}
      <g className={s.scanLine}>
        <line x1="8" y1="212" x2="322" y2="212" stroke="currentColor" strokeWidth="0.8" />
      </g>

      {/* 前景浮尘 */}
      <g className={s.motes}>
        {MOTES.map(([cx, cy, r]) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="currentColor" opacity="0.5" />
        ))}
      </g>
    </svg>
  );
}
