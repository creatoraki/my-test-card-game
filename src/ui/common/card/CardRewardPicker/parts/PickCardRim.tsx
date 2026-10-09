// 三选一放大卡面外圈的钢框叠加层(按设计稿逐线量取, 2026-10-09 第五轮):
// 6px 钢框(外缘受光线 / 中段暗槽 / 内缘受光线 / 内缘暗线), 底边另有一道下沉暗色底座;
// 左上、右上两块暗色角板, 右上切角外侧一道归属色反光; 配图/说明分界亮线 + 右侧楔形卡口;
// 左下钢框加宽成护角, 右下底座提亮; 说明区右侧一道暗内线 + 右下斜切内线。
// HandCard 自带的 3px 边棱在 354 宽下读不出「金属框」, 这里盖在卡面上方补一圈, 不改 HandCard 本体;
// 卡面 clip-path 由 CardPickSlot.module.css 改成与本框同形(四角不同斜切), 卡角不会从框外露出。
// state: hover = 钢框提亮; selected = 钢框转暗紫金属(外缘再由霓虹框压住)。
// 卡牌状态(face/pickFaceTone.ts 派生): rarity = 钢框工艺(罕见蚀刻纹 + 蓝钢卡口宝石 / 稀有抛光香槟银 + 金卡口宝石 + 斜口角板);
// tone = 状态配色(缠根苔绿 / 污染锈红 / 激活电青 / 被动石板蓝); dim = 打不出时整圈断电压暗; upgraded = 分界线转金。
import { useId } from "react";
import {
  CARD_CORNERS,
  CARD_H,
  CARD_SPLIT,
  CARD_W,
  cornerBox,
  insetPolygon,
  toSvgPoints,
  type Point,
} from "./pickGeometry";
import type { PickRimLook } from "../face/pickFaceTone";
import s from "./PickCardRim.module.css";

const W = CARD_W;
const H = CARD_H;
const SPLIT = CARD_SPLIT;

const pathOf = (points: readonly Point[]) => `M${toSvgPoints(points).replace(/ /g, " L")} Z`;

const OUTER = cornerBox(W, H, CARD_CORNERS);
/**
 * 钢框内缘(顺时针): 左右上 7px; 右下内切角(比外切角大, 角上钢板加厚); 底边 9px;
 * 左下护角处内缘先内收到 x=12、底边抬到 471。
 */
const INNER: readonly Point[] = [
  [15, 7], [W - 15, 7], [W - 7, 15], [W - 7, H - 31], [W - 29, H - 9],
  [56, H - 9], [53, H - 12], [17, H - 12], [12, H - 17], [12, 435], [7, 430], [7, 15],
];

const RING = `${pathOf(OUTER)} ${pathOf(INNER)}`;
// 外缘受光线: 左缘 → 左上 → 顶边 → 右上 → 右缘 → 右下切角(底边是暗底座, 不画受光线)。
const EDGE_HI = toSvgPoints([
  [1, H - 8], [1, 12.4], [12.4, 1], [W - 12.4, 1], [W - 1, 12.4], [W - 1, H - 16.4], [W - 16.4, H - 1],
]);
const GROOVE = toSvgPoints(cornerBox(W, H, CARD_CORNERS, 3.2));
const BEVEL = toSvgPoints(insetPolygon(INNER, -2.4));
const EDGE_IN = toSvgPoints(INNER);
// 底边受光线: 压在内缘下 2.5px, 到右下底座前斜下一级; 其下一道暗缝, 再往外是 4px 暗色底座。
const BASE_HI = toSvgPoints([[14, H - 6.6], [W - 55, H - 6.6], [W - 49, H - 1.6]]);
const BASE_GAP = `M8 ${H - 5.2} H${W - 56}`;
const FOOT = `M8 ${H - 2.4} H${W - 18}`;

// 左上暗角板: 钢框内切角与一道斜线之间。
const PLATE_TL: readonly Point[] = [[15, 7], [34, 7], [7, 34], [7, 15]];
// 右上暗角板(带两颗小铆钉)。
const PLATE_TR: readonly Point[] = [[W - 29, 7], [W - 15, 7], [W - 7, 15], [W - 7, 29]];
// 右上切角外侧的归属色反光条。
const GLINT = toSvgPoints([[W - 11, -2.5], [W + 2.5, 11]]);

// 外缘受光线在配图段亮、说明段转暗(设计稿说明段只剩内缘受光线)。
const HI_SPLIT = SPLIT / H;

// 分界亮线: 左缘内侧 → 卡口尖。
const NOTCH_TIP = W - 27;
const NOTCH: readonly Point[] = [[NOTCH_TIP, SPLIT], [W - 7, SPLIT - 20], [W - 7, SPLIT + 18]];
// 说明区右侧暗内线 + 右下斜切内线。
const TEXT_EDGE = toSvgPoints([[W - 11.5, SPLIT + 20], [W - 11.5, H - 38], [W - 37, H - 12]]);
// 右下钢板上一道斜向刻纹。
const BR_HATCH = `M${W - 26} ${H - 9} L${W - 7} ${H - 28}`;

// 卡口宝石(罕见 / 稀有): 取代卡口螺丝的菱形宝石, 稀有更大。
const gemAt = (r: number) => toSvgPoints([[W - 13, SPLIT - r], [W - 13 + r * 0.8, SPLIT], [W - 13, SPLIT + r], [W - 13 - r * 0.8, SPLIT]]);
const GEM_UNCOMMON = gemAt(4.6);
const GEM_RARE = gemAt(6);
// 稀有卡斜口内侧的加固角板(左上 / 右下), 压在钢框内缘上。
const GUSSET_TL = toSvgPoints([[8, 8], [26, 8], [8, 26]]);
const GUSSET_BR = toSvgPoints([[W - 8, H - 33], [W - 8, H - 10], [W - 31, H - 10]]);

const NO_LOOK: PickRimLook = { rarity: null, tone: null, dim: false, upgraded: false };

export function PickCardRim({ state, look = NO_LOOK }: { state: "hover" | "selected" | null; look?: PickRimLook }) {
  const id = useId();
  const metal = `url(#${id}-metal)`;
  const clip = `url(#${id}-clip)`;
  const etch = `url(#${id}-etch)`;
  // 蚀刻纹密度: 稀有比罕见更密(与老卡面 .r-uncommon 7px / .r-rare 5px 同一思路)。
  const etchStep = look.rarity === "rare" ? 4 : 6;

  return (
    <svg
      className={s.rim}
      data-state={state ?? undefined}
      data-rarity={look.rarity ?? undefined}
      data-tone={look.tone ?? undefined}
      data-dim={look.dim ? "" : undefined}
      data-upgraded={look.upgraded ? "" : undefined}
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-metal`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={W * 0.6} y2={H}>
          <stop className={s.stopA} offset="0" />
          <stop className={s.stopB} offset="0.3" />
          <stop className={s.stopC} offset="0.65" />
          <stop className={s.stopD} offset="1" />
        </linearGradient>
        <linearGradient id={`${id}-hi`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={H}>
          <stop className={s.hiTop} offset="0" />
          <stop className={s.hiTop} offset={HI_SPLIT - 0.02} />
          <stop className={s.hiLow} offset={HI_SPLIT + 0.03} />
          <stop className={s.hiLow} offset="0.94" />
          <stop className={s.hiTop} offset="0.98" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <polygon points={toSvgPoints(OUTER)} />
        </clipPath>
        {look.rarity && (
          <pattern id={`${id}-etch`} patternUnits="userSpaceOnUse" width={etchStep} height={etchStep} patternTransform="rotate(45)">
            <rect className={s.etchLine} width="1" height={etchStep} />
          </pattern>
        )}
      </defs>

      <polyline className={s.textEdge} points={TEXT_EDGE} />
      <path className={s.split} d={`M7 ${SPLIT} H${NOTCH_TIP}`} />
      <path className={s.splitShade} d={`M7 ${SPLIT + 1.5} H${NOTCH_TIP}`} />

      <polygon className={s.plate} points={toSvgPoints(PLATE_TL)} />
      <polyline className={s.plateEdge} points={toSvgPoints([PLATE_TL[1], PLATE_TL[2]])} />
      <polygon className={s.plate} points={toSvgPoints(PLATE_TR)} />
      <polyline className={s.plateEdge} points={toSvgPoints([PLATE_TR[0], PLATE_TR[3]])} />
      <circle className={s.rivet} cx={W - 15} cy={13} r={1.6} />
      <circle className={s.rivet} cx={W - 11} cy={19} r={1.6} />

      <g clipPath={clip}>
        <path className={s.ring} d={RING} fill={metal} fillRule="evenodd" />
        {look.rarity && <path className={s.etch} d={RING} fill={etch} fillRule="evenodd" />}
        <path className={s.foot} d={FOOT} />
        <polygon className={s.groove} points={GROOVE} />
        <polyline className={s.edgeHi} points={EDGE_HI} stroke={`url(#${id}-hi)`} />
        <polygon className={s.bevel} points={BEVEL} />
        <polyline className={s.baseHi} points={BASE_HI} />
        <path className={s.baseGap} d={BASE_GAP} />
        <polygon className={s.edgeIn} points={EDGE_IN} />
        <path className={s.hatch} d={BR_HATCH} />
      </g>

      <polygon className={s.notch} points={toSvgPoints(NOTCH)} fill={metal} />
      <polyline className={s.notchEdge} points={toSvgPoints([NOTCH[1], NOTCH[0], NOTCH[2]])} />
      {look.rarity === "rare" && (
        <>
          <polygon className={s.gusset} points={GUSSET_TL} />
          <polygon className={s.gusset} points={GUSSET_BR} />
        </>
      )}
      {look.rarity ? (
        <polygon className={s.gem} points={look.rarity === "rare" ? GEM_RARE : GEM_UNCOMMON} />
      ) : (
        <circle className={s.screw} cx={W - 13} cy={SPLIT} r={2.2} />
      )}
      <polyline className={s.glint} points={GLINT} />
    </svg>
  );
}
