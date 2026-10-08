// 候选卡的紫色霓虹选中框: 双描边切角框 + 左右中段短亮条 + 底部向上小三角。
// state: hover = 只亮一道淡紫主线; selected = 全部点亮并缓慢呼吸。纯装饰, 不吃命中。
// 辉光同外框: 多层加宽低透明描边, 不用滤镜(理由见 PickFrame 文件头)。
import { CARD_H, CARD_W, SELECT_CHAMFER, SELECT_OUTSET, toSvgPoints } from "./pickGeometry";
import s from "./PickSelectFrame.module.css";

/** SVG 画布比卡面四周多出的留白, 容纳外扩框、辉光与底部三角。 */
const PAD = 24;
const W = CARD_W + PAD * 2;
const H = CARD_H + PAD * 2;

const x0 = PAD - SELECT_OUTSET;
const y0 = PAD - SELECT_OUTSET;
const x1 = PAD + CARD_W + SELECT_OUTSET;
const y1 = PAD + CARD_H + SELECT_OUTSET;
const c = SELECT_CHAMFER;
const small = 8;

const FRAME = toSvgPoints([
  [x0 + c, y0], [x1 - small, y0], [x1, y0 + small], [x1, y1 - c],
  [x1 - c, y1], [x0 + small, y1], [x0, y1 - small], [x0, y0 + c],
]);
// 内亮线内缩 2.5: 外扩只有 4px, 内线恰好落在卡缘外 1.5px, 与卡面钢框(选中时转紫)贴成一组双线。
const innerInset = 2.5;
const INNER = toSvgPoints([
  [x0 + c + 1, y0 + innerInset], [x1 - small - 1, y0 + innerInset], [x1 - innerInset, y0 + small + 1], [x1 - innerInset, y1 - c - 1],
  [x1 - c - 1, y1 - innerInset], [x0 + small + 1, y1 - innerInset], [x0 + innerInset, y1 - small - 1], [x0 + innerInset, y0 + c + 1],
]);
const midY = PAD + CARD_H / 2;
const midX = PAD + CARD_W / 2;
const SIDE_L = `M${x0 - 5} ${midY - 44} V${midY + 44}`;
const SIDE_R = `M${x1 + 5} ${midY - 44} V${midY + 44}`;
const ARROW = toSvgPoints([[midX - 8, y1 + 13], [midX + 8, y1 + 13], [midX, y1 + 5]]);

export function PickSelectFrame({ state }: { state: "hover" | "selected" | null }) {
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
      <g className={s.glow}>
        <polygon className={s.halo} points={FRAME} />
        <polygon className={s.mid} points={FRAME} />
      </g>
      <polygon className={s.core} points={FRAME} />
      <polygon className={s.inner} points={INNER} />
      <path className={s.side} d={`${SIDE_L} ${SIDE_R}`} />
      <polygon className={s.arrow} points={ARROW} />
    </svg>
  );
}
