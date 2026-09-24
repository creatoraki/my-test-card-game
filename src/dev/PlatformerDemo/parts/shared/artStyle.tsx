// 统一画风：扁平矢量 + 双色赛璐璐阴影。
// 世界层物体统一 3px 墨色描边；背景层按远近递减描边并向雾色混合（大气透视）。

export const INK = "#1f2d33";

export const STROKE = {
  world: 3,
  near: 2.5,
  mid: 2,
} as const;

export const PALETTE = {
  ivory: "#ece6d4",
  ivoryShade: "#c9c1a8",
  ivoryLight: "#fbf8ee",
  teal: "#2f4a4f",
  tealShade: "#1f3438",
  tealLight: "#4b6d72",
  cyan: "#3fe0e6",
  cyanDeep: "#1ea7b1",
  copper: "#b87345",
  copperShade: "#86502c",
  copperLight: "#e0a06a",
  leaf: "#4f8f3a",
  leafShade: "#386b29",
  leafLight: "#86c552",
  moss: "#6d9a3c",
  rock: "#8b8a78",
  rockShade: "#6a6a5c",
  rockLight: "#a9a893",
  water: "#bfefff",
  mist: "#e4f5ff",
  cloud: "#ffffff",
  cloudShade: "#d6eaf6",
  skyTop: "#79bfe9",
  skyMid: "#b5e1f5",
  skyLow: "#eaf8ff",
  fog: "#cfe6f0",
} as const;

/** 世界层通用描边属性。 */
export function outline(width: number = STROKE.world, color: string = INK) {
  return {
    stroke: color,
    strokeWidth: width,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
  };
}

function toRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** 两色线性混合，t=0 为 a，t=1 为 b。 */
export function mix(a: string, b: string, t: number): string {
  const ca = toRgb(a);
  const cb = toRgb(b);
  const channel = (i: number) => Math.round(ca[i] + (cb[i] - ca[i]) * t).toString(16).padStart(2, "0");
  return `#${channel(0)}${channel(1)}${channel(2)}`;
}

/** 大气透视：向雾色混合。 */
export function fogged(color: string, amount: number): string {
  return mix(color, PALETTE.fog, amount);
}

export const GLOW_FILTER = "url(#eco-glow)";
export const SOFT_GLOW_FILTER = "url(#eco-glow-soft)";

/** 全局共享的发光滤镜定义，页面只挂一次。 */
export function ArtDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <filter id="eco-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="eco-glow-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}
