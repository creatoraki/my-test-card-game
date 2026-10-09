// 候选卡的紫色霓虹选中框(按设计稿): 压在卡钢框外缘的粗白紫霓虹带 + 顶边小凸台
// + 左右中段亮条 + 底部向上小三角(连接线从这里接出)。
// state: hover = 只亮一道淡紫细线; selected = 全部点亮并缓慢呼吸。纯装饰, 不吃命中。
// 辉光走 SVG 内部的 feGaussianBlur(在 SVG 自身栅格里模糊, 不是 CSS filter 的合成层重采样),
// 平铺加宽描边会出现硬边色带, 读不出设计稿那种柔和霓虹光晕。
import { useId } from "react";
import { CARD_CORNERS, CARD_H, CARD_W, SELECT_OUTSET, cornerBox, toSvgPoints, type Point } from "./pickGeometry";
import s from "./PickSelectFrame.module.css";

/** SVG 画布比卡面四周多出的留白, 容纳外扩框、辉光与底部三角。 */
const PAD = 40;
const W = CARD_W + PAD * 2;
const H = CARD_H + PAD * 2;

const shift = (points: readonly Point[]) => points.map(([x, y]) => [x + PAD, y + PAD] as const);

// 霓虹带外线: 卡轮廓外扩 SELECT_OUTSET; 内线: 卡轮廓内缩 1(压在钢框外半圈上, 两线之间读作一条粗霓虹)。
const FRAME = toSvgPoints(shift(cornerBox(CARD_W, CARD_H, CARD_CORNERS, -SELECT_OUTSET)));
const INNER = toSvgPoints(shift(cornerBox(CARD_W, CARD_H, CARD_CORNERS, 1)));

const x0 = PAD - SELECT_OUTSET;
const y0 = PAD - SELECT_OUTSET;
const x1 = PAD + CARD_W + SELECT_OUTSET;
const y1 = PAD + CARD_H + SELECT_OUTSET;
const midY = PAD + CARD_H / 2;
const midX = PAD + CARD_W / 2;

const TAB = `M${x0 + 56} ${y0 - 4} H${x0 + 74} L${x0 + 78} ${y0}`;
const SIDES = `M${x0 - 5} ${midY - 52} V${midY + 52} M${x1 + 5} ${midY - 52} V${midY + 52}`;
const ARROW = toSvgPoints([[midX - 8, y1 + 17], [midX + 8, y1 + 17], [midX, y1 + 7]]);

export function PickSelectFrame({ state }: { state: "hover" | "selected" | null }) {
  const id = useId();
  const soft = `${id}-soft`;
  const wide = `${id}-wide`;
  return (
    <svg
      className={s.frame}
      data-state={state ?? undefined}
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      style={{ left: -PAD, top: -PAD }}
      aria-hidden="true"
    >
      <defs>
        <filter id={wide} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id={soft} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>
      <g className={s.glow}>
        <polygon className={s.bloom} points={FRAME} filter={`url(#${wide})`} />
        <polygon className={s.halo} points={FRAME} filter={`url(#${soft})`} />
      </g>
      <polygon className={s.band} points={INNER} />
      <polygon className={s.core} points={FRAME} />
      <path className={s.tab} d={TAB} />
      <path className={s.side} d={SIDES} />
      <polygon className={s.arrow} points={ARROW} />
    </svg>
  );
}
