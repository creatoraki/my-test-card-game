// 三选一放大卡面外圈的钢框叠加层: 银色倒角边 + 配图/说明分隔亮线 + 右侧卡口 + 说明区内框。
// HandCard 自带的 3px 边棱在 350 宽下读不出「金属框」, 这里按设计稿在卡面上方补一圈, 不改 HandCard 本体。
// state: hover = 钢框提亮; selected = 整圈转紫, 与外侧霓虹选中框连成一体。纯装饰, 不吃命中。
// 轮廓与卡面 clip-path 同形(左上/右下斜切 CARD_CHAMFER)。
import { useId } from "react";
import { CARD_CHAMFER, CARD_H, CARD_W, chamferBox, toSvgPoints } from "./pickGeometry";
import s from "./PickCardRim.module.css";

const W = CARD_W;
const H = CARD_H;
/** 配图与说明区的分界线(配图是 W×W 的正方形)。 */
const SPLIT = CARD_W;

const BEVEL = toSvgPoints(chamferBox(W, H, CARD_CHAMFER, 1.5));
const GROOVE = toSvgPoints(chamferBox(W, H, CARD_CHAMFER, 4));
const SHEEN = toSvgPoints([[1.5, 34], [1.5, CARD_CHAMFER + 1.5], [CARD_CHAMFER + 1.5, 1.5], [48, 1.5]]);
const NOTCH = toSvgPoints([[W - 3, SPLIT - 12], [W - 3, SPLIT + 12], [W - 13, SPLIT]]);
const TEXT_FRAME = toSvgPoints([
  [9, SPLIT + 10], [9, H - 22], [22, H - 9], [W - 30, H - 9], [W - 9, H - 30], [W - 9, SPLIT + 10],
]);
const TEXT_FRAME_HI = `M${W - 96} ${H - 9} H${W - 40}`;

export function PickCardRim({ state }: { state: "hover" | "selected" | null }) {
  const id = useId();
  const metal = `url(#${id})`;

  return (
    <svg
      className={s.rim}
      data-state={state ?? undefined}
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={W} y2={H}>
          <stop className={s.stopA} offset="0" />
          <stop className={s.stopB} offset="0.3" />
          <stop className={s.stopC} offset="0.62" />
          <stop className={s.stopD} offset="1" />
        </linearGradient>
      </defs>
      <polygon className={s.bevel} points={BEVEL} stroke={metal} />
      <polygon className={s.groove} points={GROOVE} />
      <polyline className={s.sheen} points={SHEEN} />
      <path className={s.split} d={`M4 ${SPLIT} H${W - 4}`} />
      <polygon points={NOTCH} fill={metal} />
      <polyline className={s.textFrame} points={TEXT_FRAME} />
      <path className={s.textFrameHi} d={TEXT_FRAME_HI} />
    </svg>
  );
}
