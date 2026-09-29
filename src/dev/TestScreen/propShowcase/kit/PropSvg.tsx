import { useId, type ReactNode } from "react";
import { BRASS, GLASS, PAINT, STEEL } from "./palette";
import { grimeTexture, GRIME_TEXTURE_SIZE } from "./grimeTexture";
import s from "./kit.module.css";

/** 一层 SVG 内的 id 工具：每层独立前缀，同屏多份(含呼吸光副本)互不覆盖。 */
export interface Kit {
  id(name: string): string;
  url(name: string): string;
}

type Stops = readonly (readonly [number, string])[];

function Linear({ id, stops, horizontal = false }: { id: string; stops: Stops; horizontal?: boolean }) {
  return <linearGradient id={id} x1="0" y1="0" x2={horizontal ? 1 : 0} y2={horizontal ? 0 : 1}>
    {stops.map(([offset, color]) => <stop key={offset} offset={offset} stopColor={color} />)}
  </linearGradient>;
}

/** 所有物件共用的材质：objectBoundingBox 渐变，一套定义可套在任意尺寸面板上。 */
function KitDefs({ kit }: { kit: Kit }) {
  const grime = grimeTexture();
  return <defs>
    <Linear id={kit.id("steelV")} stops={[[0, STEEL.s4], [0.12, STEEL.s3], [0.7, STEEL.s2], [1, STEEL.s1]]} />
    <Linear id={kit.id("steelDarkV")} stops={[[0, STEEL.s3], [0.25, STEEL.s2], [1, STEEL.s0]]} />
    <Linear id={kit.id("steelLightV")} stops={[[0, STEEL.s5], [0.2, STEEL.s4], [1, STEEL.s2]]} />
    <Linear id={kit.id("cylinder")} horizontal stops={[[0, STEEL.s1], [0.22, STEEL.s4], [0.34, STEEL.s5], [0.55, STEEL.s3], [1, STEEL.s0]]} />
    <Linear id={kit.id("brassV")} stops={[[0, BRASS.b4], [0.3, BRASS.b3], [0.7, BRASS.b2], [1, BRASS.b1]]} />
    <Linear id={kit.id("brassCyl")} horizontal stops={[[0, BRASS.b0], [0.25, BRASS.b2], [0.4, BRASS.b4], [0.62, BRASS.b2], [1, BRASS.b0]]} />
    <Linear id={kit.id("paintV")} stops={[[0, PAINT.p4], [0.2, PAINT.p3], [0.75, PAINT.p2], [1, PAINT.p1]]} />
    <Linear id={kit.id("paintCyl")} horizontal stops={[[0, PAINT.p1], [0.3, PAINT.p3], [0.42, PAINT.p4], [0.7, PAINT.p2], [1, PAINT.p0]]} />
    <Linear id={kit.id("glassV")} stops={[[0, GLASS.g2], [0.35, GLASS.g1], [0.85, GLASS.g0], [1, GLASS.g1]]} />
    <Linear id={kit.id("glassLit")} stops={[[0, GLASS.g3], [0.4, GLASS.g2], [1, GLASS.g1]]} />
    <linearGradient id={kit.id("fadeDown")} x1="0" y1="0" x2="0" y2="1">
      <stop offset={0} stopColor="#000" stopOpacity={0} />
      <stop offset={1} stopColor="#000" stopOpacity={0.55} />
    </linearGradient>
    <linearGradient id={kit.id("sheen")} x1="0" y1="0" x2="0" y2="1">
      <stop offset={0} stopColor="#fff" stopOpacity={0.32} />
      <stop offset={1} stopColor="#fff" stopOpacity={0} />
    </linearGradient>
    <radialGradient id={kit.id("screen")} cx="0.5" cy="0.45" r="0.75">
      <stop offset={0} stopColor="#0f4146" />
      <stop offset={0.7} stopColor="#072427" />
      <stop offset={1} stopColor="#03100f" />
    </radialGradient>
    <filter id={kit.id("bloom")} x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur in="SourceGraphic" stdDeviation={2.2} result="b" />
      <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <filter id={kit.id("bloomWide")} x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur in="SourceGraphic" stdDeviation={6} />
    </filter>
    <pattern id={kit.id("grime")} width={GRIME_TEXTURE_SIZE} height={GRIME_TEXTURE_SIZE} patternUnits="userSpaceOnUse">
      {grime && <image href={grime} width={GRIME_TEXTURE_SIZE} height={GRIME_TEXTURE_SIZE} />}
    </pattern>
    <pattern id={kit.id("hazard")} width={10} height={10} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width={10} height={10} fill="#16191b" />
      <rect width={5} height={10} fill="#caa03c" />
    </pattern>
    <pattern id={kit.id("scanlines")} width={3} height={3} patternUnits="userSpaceOnUse">
      <rect width={3} height={1.2} fill="#000" opacity={0.35} />
    </pattern>
  </defs>;
}

function KitLayer({ width, height, className, children }: {
  width: number;
  height: number;
  className: string;
  children: (kit: Kit) => ReactNode;
}) {
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const kit: Kit = {
    id: (name) => `k${base}-${name}`,
    url: (name) => `url(#k${base}-${name})`,
  };
  return <svg className={className} viewBox={`0 0 ${width} ${height}`} width={width} height={height} overflow="visible">
    <KitDefs kit={kit} />
    {children(kit)}
  </svg>;
}

/**
 * 物件画布：静态底图一层 + 发光动效一层。
 * 动效层单独合成，呼吸/闪烁只重绘这一层，不牵动细节繁多的底图；呼吸光副本只取底图。
 */
export function PropSvg({ width, height, live = true, base, glow }: {
  width: number;
  height: number;
  live?: boolean;
  base: (kit: Kit) => ReactNode;
  glow?: (kit: Kit) => ReactNode;
}) {
  return <>
    <KitLayer width={width} height={height} className={s.layer}>{base}</KitLayer>
    {live && glow && <KitLayer width={width} height={height} className={`${s.layer} ${s.live}`}>{glow}</KitLayer>}
  </>;
}
