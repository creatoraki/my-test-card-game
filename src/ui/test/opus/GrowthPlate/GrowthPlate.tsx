// 「培育 / 成熟」两枚 BUFF 图标本体 —— 只画图形, 不带任何 demo 状态。
//
// 画法沿用同一套设计哲学: 64×64 画布、fill=none + stroke=currentColor 的纯线框、
// 粗细分三档(主体 1.55 / 结构 1.25 / 装饰 1.05)、背后一层虚线光环(backdrop)、
// 主体复制一份下移 1.2px 当暗底描边、全枚只留一处实心亮片。
//
// 颜色全部继承 currentColor, 尺寸由外层容器决定 —— 正式 UI 可以直接引用, 不会把 demo 带过去。
import type { ReactNode } from "react";
import {
  CROWN_INNER,
  CROWN_OUTER,
  CROWN_Y,
  CENTER,
  CULTIVATE_CURSOR,
  CULTIVATE_RATIO,
  CULTIVATE_RING_ROTATE,
  FRUIT_R,
  FRUIT_SPARK,
  MATURE_CHECK,
  MATURE_SEPALS,
  MATURE_STEM,
  PETAL_ANGLES,
  PLATE_VIEWBOX,
  RING_R,
  RING_TICKS,
  SOIL_CRACKS,
  SOIL_STRATA,
  SPROUT_BUD,
  SPROUT_LEAF,
  SPROUT_SEAM,
  SPROUT_SPARK,
  SPROUT_STEM,
  SPROUT_VEIN,
  ringDash,
} from "./growthPlateGeometry";
import s from "./GrowthPlate.module.css";

export type GrowthPlateId = "cultivate" | "mature";

export type GrowthPlateSpec = {
  id: GrowthPlateId;
  /** BUFF 名。 */
  name: string;
  /** 角码用的档案编号。 */
  code: string;
  /** 主色。图标本身不认这个值, 由外层写进 color 后继承。 */
  accent: string;
  /** 一句话构图要点, 给陈列台标注用。 */
  note: string;
  backdrop: ReactNode;
  art: ReactNode;
};

/** 两态共用的地面 + 环刻度: 并排时基线对得齐, 一眼看出是同一株的前后两段。 */
function SharedGround({ crack }: { crack?: boolean }) {
  return (
    <>
      {SOIL_STRATA.map((layer) => (
        <path key={layer.key} d={layer.d} strokeWidth={1.15} opacity={layer.opacity} />
      ))}
      {crack ? <path d={SOIL_CRACKS} strokeWidth={1.05} opacity={0.7} /> : null}
      {RING_TICKS.map((tick) => (
        <line
          key={tick.key}
          x1={tick.x1}
          y1={tick.y1}
          x2={tick.x2}
          y2={tick.y2}
          strokeWidth={tick.long ? 1.2 : 0.9}
          opacity={tick.long ? 0.72 : 0.42}
        />
      ))}
    </>
  );
}

export const GROWTH_SPECS: GrowthPlateSpec[] = [
  {
    id: "cultivate",
    name: "培育",
    code: "BUF / 01",
    accent: "#4fd8c8",
    note: "破土的幼芽与未闭合的倒计时环：还差一截。",
    backdrop: (
      <>
        <path d="m32 3 24 29-24 29L8 32Z" strokeWidth={0.9} strokeDasharray="1 3" />
        <path d="M7 40c9 9 41 9 50 0" strokeWidth={0.7} strokeDasharray="1 3" opacity={0.6} />
      </>
    ),
    art: (
      <>
        {/* 未闭合的外环: 断口朝右下, 末端一枚游标点标出"当前进度"。 */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RING_R}
          strokeWidth={1.25}
          strokeDasharray={ringDash(CULTIVATE_RATIO)}
          transform={`rotate(${CULTIVATE_RING_ROTATE} ${CENTER} ${CENTER})`}
        />
        <circle cx={CULTIVATE_CURSOR.x} cy={CULTIVATE_CURSOR.y} r={1.7} fill="currentColor" stroke="none" />
        <SharedGround crack />
        <path d={SPROUT_STEM} strokeWidth={1.35} />
        {/* 两片子叶: 同一条路径 + 水平镜像, 保证完全对称。 */}
        <path d={SPROUT_LEAF} strokeWidth={1.55} />
        <path d={SPROUT_LEAF} strokeWidth={1.55} transform="matrix(-1 0 0 1 64 0)" />
        <path d={SPROUT_VEIN} strokeWidth={1.05} opacity={0.72} />
        <path d={SPROUT_VEIN} strokeWidth={1.05} opacity={0.72} transform="matrix(-1 0 0 1 64 0)" />
        <path d={SPROUT_BUD} strokeWidth={1.55} />
        <path d={SPROUT_SEAM} strokeWidth={1.05} opacity={0.78} />
        <path d={SPROUT_SPARK} fill="currentColor" stroke="none" opacity={0.36} />
      </>
    ),
  },
  {
    id: "mature",
    name: "成熟",
    code: "BUF / 02",
    accent: "#d6f238",
    note: "同一株长成的冠层与闭合完成环：可以收了。",
    backdrop: (
      <>
        <circle cx={32} cy={32} r={28} strokeWidth={0.9} strokeDasharray="1 3" />
        <path
          d="M32 1v4M32 59v4M1 32h4M59 32h4M10 10l3 3M54 10l-3 3M10 54l3-3M54 54l-3-3"
          strokeWidth={0.8}
          opacity={0.66}
        />
      </>
    ),
    art: (
      <>
        {/* 满圈闭合的完成环 + 底部一枚勾记。 */}
        <circle cx={CENTER} cy={CENTER} r={RING_R} strokeWidth={1.25} />
        <SharedGround />
        <path d={MATURE_CHECK} strokeWidth={1.5} />
        <path d={MATURE_STEM} strokeWidth={1.5} />
        <path d={MATURE_SEPALS} strokeWidth={1.15} opacity={0.78} />
        {/* 六向冠层: 角度阵列生成, 不手写 6 份 path。 */}
        {PETAL_ANGLES.map((deg) => (
          <path
            key={`outer-${deg}`}
            d={CROWN_OUTER}
            strokeWidth={1.55}
            transform={`rotate(${deg} ${CENTER} ${CROWN_Y})`}
          />
        ))}
        {PETAL_ANGLES.map((deg) => (
          <path
            key={`inner-${deg}`}
            d={CROWN_INNER}
            strokeWidth={1.05}
            opacity={0.62}
            transform={`rotate(${deg + 30} ${CENTER} ${CROWN_Y})`}
          />
        ))}
        <circle cx={CENTER} cy={CROWN_Y} r={FRUIT_R} strokeWidth={1.35} />
        <path d={FRUIT_SPARK} fill="currentColor" stroke="none" opacity={0.42} />
      </>
    ),
  },
];

/** 按 id 取图标定义; 取不到时退回第一枚, 保证渲染层永远拿得到东西。 */
export function findGrowthSpec(id: GrowthPlateId): GrowthPlateSpec {
  return GROWTH_SPECS.find((spec) => spec.id === id) ?? GROWTH_SPECS[0];
}

/** 主体线框。复制一份下移 1.2px 作暗底 —— 压在亮背景上也不会糊。 */
export function GrowthPlateArt({ spec }: { spec: GrowthPlateSpec }) {
  return (
    <svg
      className={s.artwork}
      viewBox={`0 0 ${PLATE_VIEWBOX} ${PLATE_VIEWBOX}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={`${spec.name}图标`}
    >
      <g className={s.artShadow} transform="translate(0 1.2)">
        {spec.art}
      </g>
      <g>{spec.art}</g>
    </svg>
  );
}

/** 背后的虚线光环层, 纯装饰。 */
export function GrowthPlateBackdrop({ spec }: { spec: GrowthPlateSpec }) {
  return (
    <svg
      className={s.backdrop}
      viewBox={`0 0 ${PLATE_VIEWBOX} ${PLATE_VIEWBOX}`}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {spec.backdrop}
    </svg>
  );
}
