// 候选卡的紫色霓虹选中框(按设计稿逐线量取, 2026-10-09 第五轮): 近白紫霓虹芯直接压在卡钢框外缘上
// (顶边高出 2px) + 钢框内缘一道亮紫线 + 顶边小凸台与浮动短划 + 左右侧短亮条 + 底部向上小三角(连接线从这里接出)。
// state: hover = 只亮一道淡紫细线; selected = 全部点亮并缓慢呼吸。纯装饰, 不吃命中。
// 辉光走 SVG 内部的 feGaussianBlur(在 SVG 自身栅格里模糊, 不是 CSS filter 的合成层重采样),
// 平铺加宽描边会出现硬边色带, 读不出设计稿那种柔和霓虹光晕。
import { useId } from "react";
import { CARD_CORNERS, CARD_H, CARD_W, SELECT_TOP_LIFT, cornerBox, toSvgPoints, type Point } from "./pickGeometry";
import s from "./PickSelectFrame.module.css";

/** SVG 画布比卡面四周多出的留白, 容纳辉光与底部三角。 */
const PAD = 40;
const W = CARD_W + PAD * 2;
const H = CARD_H + PAD * 2;

const shift = (points: readonly Point[]) => points.map(([x, y]) => [x + PAD, y + PAD] as const);

// 霓虹芯: 压在卡轮廓上(设计稿量取: 整体右移 1px, 顶边高出 SELECT_TOP_LIFT, 底边低 1px)。
const CORE_PTS = cornerBox(CARD_W, CARD_H, CARD_CORNERS).map(
  ([x, y]) => [x + 1, y === 0 ? -SELECT_TOP_LIFT : y === CARD_H ? CARD_H + 1 : y] as const,
);
// 右下切角: 霓虹芯与内线之间的一块粉紫亮板 + 内侧一道近白斜亮条。
const BR_FILL = toSvgPoints(shift([[CARD_W - 30, CARD_H], [CARD_W - 15, CARD_H], [CARD_W + 1, CARD_H - 16], [CARD_W + 1, CARD_H - 31]]));
const BR_SLAB = `M${PAD + CARD_W - 38} ${PAD + CARD_H - 12} L${PAD + CARD_W - 15} ${PAD + CARD_H - 35}`;
const FRAME = toSvgPoints(shift(CORE_PTS));
// 钢框内缘亮紫线: 左右与底边在卡内 7.5px, 顶边 3.5px。
const BAND_PTS = cornerBox(CARD_W - 15, CARD_H - 11, { tl: 9, tr: 9, br: 13, bl: 5 }).map(
  ([x, y]) => [x + 7.5, y + 3.5] as const,
);
const INNER = toSvgPoints(shift(BAND_PTS));

const top = PAD - SELECT_TOP_LIFT;
const midX = PAD + CARD_W / 2;
const bottom = PAD + CARD_H;

// 顶边凸台(左起 162–179)与浮动短划(256–272)。
const TAB = `M${PAD + 158} ${top} L${PAD + 162} ${top - 5} H${PAD + 179} L${PAD + 183} ${top}`;
const DASH = `M${PAD + 256} ${top - 7} H${PAD + 272}`;
// 侧边短亮条: 左上 / 左中 / 右中(设计稿量取, 卡内 y)。
const SIDES = [
  `M${PAD - 3} ${PAD + 12} V${PAD + 40}`,
  `M${PAD - 3} ${PAD + 263} V${PAD + 295}`,
  `M${PAD + CARD_W + 3} ${PAD + 218} V${PAD + 251}`,
].join(" ");
// 底部向上小三角: 尖 (中线, 卡底 + 9), 底边 (±10, 卡底 + 21)。
const ARROW = toSvgPoints([[midX - 10, bottom + 21], [midX + 10, bottom + 21], [midX, bottom + 9]]);

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
      <polygon className={s.brFill} points={BR_FILL} />
      <path className={s.brSlab} d={BR_SLAB} />
      <polygon className={s.band} points={INNER} />
      <polygon className={s.core} points={FRAME} />
      <path className={s.tab} d={TAB} />
      <path className={s.dash} d={DASH} />
      <path className={s.side} d={SIDES} />
      <polygon className={s.arrow} points={ARROW} />
    </svg>
  );
}
