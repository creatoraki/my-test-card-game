// 徽章外框的**可变槽位** —— 四向尖顶饰 + 刻度环。骨架(各圈半径/线宽)住在 BadgeRim,
// 这里只管"每枚徽章长什么花样", 三档一一对应:
//   compass 罗盘菱形 + 16 道长短交替刻度  → 启程(基础方案)
//   spike   箭簇倒钩 + 8 长羽 8 短羽交错   → 先手(起手爆发)
//   gear    梯形齿块 + 12 道钟面齿牙       → 守时(节奏循环)
// ⚠ 坐标系是 BadgeRim 约定的 viewBox "-100 -100 200 200": 原点在圆心, 正上方为 -y。
//   各花样都跨 r=92(外发丝) 与 r=87(底盘) 之间那圈, 尾部的 `M0-70v8` 把尖顶接回内盘。

import type { BadgeRimTone } from "./BadgeRim";

export type BadgeRimMotif = "compass" | "spike" | "gear";

interface MotifProps {
  tone: BadgeRimTone;
  /** 金属边缘渐变的 url(#…), 由 BadgeRim 下发 —— 尖顶描边与各圈共用同一条渐变。 */
  edge: string;
}

const QUADRANTS = [0, 90, 180, 270];

function CompassMotif({ tone, edge }: MotifProps) {
  return (
    <>
      {QUADRANTS.map((angle) => (
        <g key={angle} transform={`rotate(${angle})`} stroke={edge}>
          <path d="M-15-85 0-99 15-85 0-71Z" fill={tone.bed} strokeWidth="2" />
          <path d="M0-96 5-85 0-76-5-85Z" fill={tone.gem} strokeWidth=".8" />
          <path d="m-27-81 12-11h30l12 11M0-70v8" strokeWidth="1" />
        </g>
      ))}
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} d="M0-77v6" transform={`rotate(${i * 22.5})`}
          stroke={tone.tick} strokeWidth={i % 2 ? ".7" : "1.2"} />
      ))}
    </>
  );
}

function SpikeMotif({ tone, edge }: MotifProps) {
  return (
    <>
      {QUADRANTS.map((angle) => (
        <g key={angle} transform={`rotate(${angle})`} stroke={edge}>
          <path d="M0-99 8-82 3-80 3-71-3-71-3-80-8-82Z" fill={tone.bed} strokeWidth="1.8" />
          <path d="M0-94 3.4-84 0-78-3.4-84Z" fill={tone.gem} strokeWidth=".7" />
          <path d="M-8-82-17-73M8-82 17-73M0-71v9" strokeWidth="1.1" />
        </g>
      ))}
      {Array.from({ length: 16 }, (_, i) =>
        i % 2 ? (
          <path key={i} d="M0-76v4" transform={`rotate(${i * 22.5})`} stroke={tone.tick} strokeWidth=".7" />
        ) : (
          <path key={i} d="M0-79v8M-3-75 0-79 3-75" transform={`rotate(${i * 22.5})`}
            stroke={tone.tick} strokeWidth="1.1" />
        ),
      )}
    </>
  );
}

function GearMotif({ tone, edge }: MotifProps) {
  return (
    <>
      {QUADRANTS.map((angle) => (
        <g key={angle} transform={`rotate(${angle})`} stroke={edge}>
          <path d="M-10-97h20l6 16h-32Z" fill={tone.bed} strokeWidth="1.8" />
          <path d="M0-93 4.5-87 0-81-4.5-87Z" fill={tone.gem} strokeWidth=".7" />
          <path d="M-19-81h38M0-70v8" strokeWidth="1.1" />
        </g>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={i % 3 ? "M0-77v5" : "M0-78v7"} transform={`rotate(${i * 30})`}
          stroke={tone.tick} strokeWidth={i % 3 ? ".7" : "1.4"} />
      ))}
    </>
  );
}

export const RIM_MOTIFS: Record<BadgeRimMotif, (props: MotifProps) => JSX.Element> = {
  compass: CompassMotif,
  spike: SpikeMotif,
  gear: GearMotif,
};
