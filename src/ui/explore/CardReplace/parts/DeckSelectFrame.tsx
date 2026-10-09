// 卡组网格的琥珀金选中框: 跟随 HandCard 轮廓(左上 / 右下 14px 斜切), 外圈近白金霓虹芯 + 内缘细金线,
// 两个斜切角加粗亮条, 右上 / 左下短角件。挂在卡面的缩放层里, 以卡面原始 220×308 为坐标系, 随卡一起缩放。
// 未选中时隐藏, 父级悬停时(按 data-select-frame 选中)只亮一道淡金细线; 选中 = 全部点亮并缓慢呼吸。纯装饰, 不吃命中。
// 辉光走 SVG 内部 feGaussianBlur, 平铺加宽描边读不出柔光。
import { useId } from "react";
import { CARD_CHAMFER, CARD_H, CARD_W } from "./deckGeometry";
import s from "./DeckSelectFrame.module.css";

const PAD = 24;
const W = CARD_W + PAD * 2;
const H = CARD_H + PAD * 2;

/** 卡轮廓外扩 out px 后的八边形(左上 / 右下斜切)。 */
function outline(out: number) {
  const c = CARD_CHAMFER + out * 0.4;
  const l = PAD - out;
  const t = PAD - out;
  const r = PAD + CARD_W + out;
  const b = PAD + CARD_H + out;
  return `${l + c},${t} ${r},${t} ${r},${b - c} ${r - c},${b} ${l},${b} ${l},${t + c}`;
}

const CORE = outline(3);
const INNER = outline(-2);
const L = PAD - 3;
const T = PAD - 3;
const R = PAD + CARD_W + 3;
const B = PAD + CARD_H + 3;
const C = CARD_CHAMFER + 1.2;
// 斜切角亮条 + 右上 / 左下角件
const ACCENTS = [
  `M${L} ${T + C + 26} V${T + C} L${L + C} ${T} H${L + C + 26}`,
  `M${R} ${B - C - 26} V${B - C} L${R - C} ${B} H${R - C - 26}`,
  `M${R - 22} ${T} H${R} V${T + 22}`,
  `M${L} ${B - 22} V${B} H${L + 22}`,
];

export function DeckSelectFrame({ selected }: { selected: boolean }) {
  const blur = useId();
  return (
    <svg className={s.frame} data-select-frame data-selected={selected ? "" : undefined} viewBox={`0 0 ${W} ${H}`}
      style={{ left: -PAD, top: -PAD, width: W, height: H }} aria-hidden>
      <defs>
        <filter id={blur} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <g className={s.glow} filter={`url(#${blur})`}>
        <polygon points={CORE} />
        {ACCENTS.map((d) => <path key={d} d={d} />)}
      </g>
      <polygon className={s.core} points={CORE} />
      <polygon className={s.inner} points={INNER} />
      <g className={s.accents}>
        {ACCENTS.map((d) => <path key={d} d={d} />)}
      </g>
    </svg>
  );
}
