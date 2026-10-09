// 三选一放大卡面外圈的钢框叠加层(按设计稿): 7px 银色倒角钢框 + 配图/说明分界亮线 + 右侧卡口螺钉件
// + 说明区内框(右下斜切) + 右下角刻纹与切角亮条 + 说明区右侧短竖标。
// HandCard 自带的 3px 边棱在 350 宽下读不出「金属框」, 这里盖在卡面上方补一圈, 不改 HandCard 本体;
// 卡面 clip-path 由 CardPickSlot.module.css 改成与本框同形(四角不同斜切), 卡角不会从框外露出。
// state: hover = 钢框提亮; selected = 钢框转暗紫金属, 右下刻纹与切角亮条转亮紫(外侧再由霓虹框包住)。
import { useId } from "react";
import { CARD_CORNERS, CARD_H, CARD_RIM, CARD_W, cornerBox, toSvgPoints, type Point } from "./pickGeometry";
import s from "./PickCardRim.module.css";

const W = CARD_W;
const H = CARD_H;
/** 配图与说明区的分界线(配图是 W×W 的正方形)。 */
const SPLIT = CARD_W;

const pathOf = (points: readonly Point[]) => `M${toSvgPoints(points).replace(/ /g, " L")} Z`;

// 钢框本体: 外轮廓 − 内缩 RIM 的轮廓(evenodd 挖空)。
const RING = `${pathOf(cornerBox(W, H, CARD_CORNERS))} ${pathOf(cornerBox(W, H, CARD_CORNERS, CARD_RIM))}`;
const EDGE_HI = toSvgPoints(cornerBox(W, H, CARD_CORNERS, 0.75));
const GROOVE = toSvgPoints(cornerBox(W, H, CARD_CORNERS, 3.5));
const EDGE_IN = toSvgPoints(cornerBox(W, H, CARD_CORNERS, CARD_RIM));
const SHEEN = toSvgPoints([[1, 60], [1, CARD_CORNERS.tl + 1], [CARD_CORNERS.tl + 1, 1], [120, 1]]);

// 说明区内框: 左右各内缩 12, 上沿压在分界线下 8px, 右下斜切 20。
const TEXT_FRAME_PTS: Point[] = [
  [12, SPLIT + 8], [W - 12, SPLIT + 8], [W - 12, H - 32], [W - 32, H - 12], [12, H - 12],
];
const TEXT_FRAME = toSvgPoints(TEXT_FRAME_PTS);
// 内框与钢框之间的暗槽: 钢框内轮廓在分界线以下的部分 − 说明区内框(evenodd), 读作说明区下沉一级。
const RIM_IN = cornerBox(W, H, CARD_CORNERS, CARD_RIM);
const WELL = `${pathOf([[CARD_RIM, SPLIT], [W - CARD_RIM, SPLIT], ...RIM_IN.slice(3, 7)])} ${pathOf(TEXT_FRAME_PTS)}`;
// 右侧卡口: 一块楔形钢件卡在分界线上, 中间一颗螺钉。
const NOTCH = toSvgPoints([
  [W - CARD_RIM, SPLIT - 18], [W - 22, SPLIT - 5], [W - 22, SPLIT + 9], [W - CARD_RIM, SPLIT + 22],
]);
// 右下切角亮条: 沿外框右下斜口内侧 3.5px。
const BR = CARD_CORNERS.br;
const BR_SLAB = toSvgPoints([[W - 3.5, H - BR - 4], [W - BR - 4, H - 3.5]]);
// 说明区右下的斜向刻纹(两道 + 一道底横)。
const BR_DECO = [
  `M${W - 76} ${H - 18} L${W - 64} ${H - 30}`,
  `M${W - 66} ${H - 18} L${W - 54} ${H - 30}`,
  `M${W - 96} ${H - 18} H${W - 44}`,
].join(" ");
const SIDE_MARK = `M${W - 17} ${SPLIT + 52} V${SPLIT + 88}`;

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
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={W * 0.6} y2={H}>
          <stop className={s.stopA} offset="0" />
          <stop className={s.stopB} offset="0.28" />
          <stop className={s.stopC} offset="0.6" />
          <stop className={s.stopD} offset="1" />
        </linearGradient>
      </defs>

      <path className={s.well} d={WELL} fillRule="evenodd" />
      <polygon className={s.textFrame} points={TEXT_FRAME} />
      <path className={s.split} d={`M${CARD_RIM} ${SPLIT} H${W - CARD_RIM}`} />
      <path className={s.splitShade} d={`M${CARD_RIM} ${SPLIT + 1.5} H${W - CARD_RIM}`} />
      <path className={s.deco} d={BR_DECO} />
      <path className={s.sideMark} d={SIDE_MARK} />

      <path className={s.ring} d={RING} fill={metal} fillRule="evenodd" />
      <polygon className={s.groove} points={GROOVE} />
      <polygon className={s.edgeHi} points={EDGE_HI} />
      <polygon className={s.edgeIn} points={EDGE_IN} />
      <polyline className={s.sheen} points={SHEEN} />
      <polyline className={s.slab} points={BR_SLAB} />

      <polygon className={s.notch} points={NOTCH} fill={metal} />
      <circle className={s.screw} cx={W - 15} cy={SPLIT + 2} r={2.6} />
    </svg>
  );
}
