// 小队徽章的金属外框 —— 三枚基础徽章**共用的同一套骨架**: 外发丝 r=92 → 底盘 r=87 →
// 虚线环 r=79 → 内盘 r=70 → 内细环 r=62, 外加四向尖顶饰与刻度环(花样见 BadgeRimMotifs)。
//
// ★ 它不带 <svg> 根, 只吐一组图元 + 自己的 <defs>, 由调用方的 SVG 承载;
//   约定父级 viewBox 为 "-100 -100 200 200" 且根节点 fill="none"(尖顶的托架线靠继承来的 none 才不被填黑)。
// ★ 本组件是从 TalentEmblem 里原样抽出来的: 金色一档(voyage)的停点/半径/线宽全部照旧,
//   所以启程徽章的渲染结果与抽取前完全一致 —— 这是改动的回归基线, 调 GOLD 那一档前先想清楚。
// ⚠ 配色显式写死, 不用 color-mix(): 它在 SVG 呈现属性里的支持面不可靠。

import { useId } from "react";
import { RIM_MOTIFS, type BadgeRimMotif } from "./BadgeRimMotifs";

export interface BadgeRimTone {
  /** 金属边缘线性渐变的五档停点(偏移 0 / .28 / .5 / .72 / 1), 外环与内盘描边共用。 */
  edge: [string, string, string, string, string];
  /** 内盘 r=70 的径向渐变三档(偏移 0 / .6 / 1)。 */
  body: [string, string, string];
  /** 底盘 r=87 的填充(固定 .86 不透明度)。 */
  plate: string;
  /** 虚线环 r=79。 */
  dash: string;
  /** 内细环 r=62。 */
  inner: string;
  /** 最外那道发丝 r=92。 */
  hair: string;
  /** 尖顶饰的托座填充。 */
  bed: string;
  /** 尖顶饰中央宝石的亮色填充。 */
  gem: string;
  /** 刻度环。 */
  tick: string;
}

const EDGE_STOPS = [0, 0.28, 0.5, 0.72, 1];
const BODY_STOPS = [0, 0.6, 1];

export const RIM_TONES: Record<string, BadgeRimTone> = {
  // 启程 —— 抽取前 TalentEmblem 的原值, 不要动。
  voyage: {
    edge: ["#a37439", "#fff0bd", "#b07a37", "#ffe6ac", "#8a5b27"],
    body: ["#705025", "#2e2319", "#0b1015"],
    plate: "#080c11",
    dash: "#e5c17c",
    inner: "#f2d99d",
    hair: "#ad803e",
    bed: "#3c2a19",
    gem: "#fff0bc",
    tick: "#eed79c",
  },
  // 先手 —— 赤铜红金, 跟 BADGE_THEMES.vanguard(#ff7167 / #842f32 / #ffd4df)同一族。
  vanguard: {
    edge: ["#8f3a33", "#ffd8cf", "#a8453c", "#ffc3b6", "#6e2a27"],
    body: ["#6b2a2a", "#2c1a1b", "#100a0d"],
    plate: "#12070a",
    dash: "#e59a8c",
    inner: "#ffc9bd",
    hair: "#ad5a4e",
    bed: "#3c1a19",
    gem: "#ffd9cf",
    tick: "#eda394",
  },
  // 守时 —— 寒钢冰蓝, 跟 BADGE_THEMES.clockwork(#49cfff / #12618b / #d6f4ff)同一族。
  clockwork: {
    edge: ["#2c6a8f", "#d7f3ff", "#3a7fa5", "#b6e6ff", "#1b4d69"],
    body: ["#1f5876", "#152530", "#070f16"],
    plate: "#04101a",
    dash: "#7fc9e8",
    inner: "#bfe9fb",
    hair: "#4a8aa8",
    bed: "#12303f",
    gem: "#d8f4ff",
    tick: "#93d3ee",
  },
};

export function rimToneOf(badgeId: string): BadgeRimTone {
  return RIM_TONES[badgeId] ?? RIM_TONES.voyage;
}

export function rimMotifOf(badgeId: string): BadgeRimMotif {
  if (badgeId === "vanguard") return "spike";
  if (badgeId === "clockwork") return "gear";
  return "compass";
}

export function BadgeRim({
  tone = RIM_TONES.voyage,
  motif = "compass",
}: { tone?: BadgeRimTone; motif?: BadgeRimMotif }) {
  const id = useId();
  const Motif = RIM_MOTIFS[motif];
  const edge = `url(#${id})`;

  return (
    <>
      <defs>
        <linearGradient id={id}>
          {tone.edge.map((color, i) => <stop key={i} offset={EDGE_STOPS[i]} stopColor={color} />)}
        </linearGradient>
        <radialGradient id={`${id}-body`}>
          {tone.body.map((color, i) => <stop key={i} offset={BODY_STOPS[i]} stopColor={color} />)}
        </radialGradient>
      </defs>
      <circle r="87" fill={tone.plate} fillOpacity=".86" stroke={edge} strokeWidth="2" />
      <circle r="79" stroke={tone.dash} strokeWidth="1" strokeDasharray="37 6 3 6" />
      <circle r="70" fill={`url(#${id}-body)`} stroke={edge} strokeWidth="3" />
      <circle r="62" stroke={tone.inner} strokeWidth=".8" />
      <circle r="92" stroke={tone.hair} strokeWidth=".7" />
      <Motif tone={tone} edge={edge} />
    </>
  );
}
