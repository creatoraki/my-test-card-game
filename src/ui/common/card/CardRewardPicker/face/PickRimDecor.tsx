// 新皮肤卡面的状态线稿层(354×483 设计 px, 与 ../parts/PickCardRim 同坐标): 盖在钢框之上、霓虹选中框之下。
// 老手牌卡面把各种状态画在 14px 斜切的 220×308 小卡上, 放大卡的钢框会把那些边棱整圈盖住, 所以在这里按新框重画:
//   · 激活 = 沿钢框外缘跑动的电青流光 + 常亮外缘辉光(老卡面的「轮廓跑动流光」);
//   · 污染 = 横穿钢框的锈红裂缝与锈点(老卡面的裂缝从卡边长出, 这里让它们咬穿钢框);
//   · 缠根 = 缠绕在钢框左右与底边的藤蔓;
//   · 升级 = 卡名压条右端的金色双箭头(老卡面的凿痕 + 卡名加亮)。
// 纯装饰, aria-hidden + 不吃命中。
import { useId } from "react";
import { CARD_CORNERS, CARD_H, CARD_SPLIT, CARD_W, cornerBox, toSvgPoints, type Point } from "../parts/pickGeometry";
import type { PickRimLook } from "./pickFaceTone";
import s from "./PickRimDecor.module.css";

const W = CARD_W;
const H = CARD_H;
const OUTLINE = toSvgPoints(cornerBox(W, H, CARD_CORNERS));

// 污染裂缝: 每条都从钢框外缘咬进卡内 10~20px, 折线越往里越细(另有一层错位暗影读作裂缝深度)。
const CRACKS: readonly (readonly Point[])[] = [
  [[90, -1], [94, 5], [90, 9], [97, 14], [95, 20]],
  [[256, -1], [252, 6], [257, 10], [250, 16]],
  [[355, 146], [349, 150], [345, 146], [339, 153], [333, 151]],
  [[355, 414], [349, 419], [345, 415], [339, 422]],
  [[-1, 214], [5, 219], [9, 215], [14, 222], [20, 220]],
  [[126, 484], [130, 477], [126, 472], [133, 467], [131, 461]],
  [[342, 471], [336, 466], [339, 460], [331, 455]],
  [[-1, 60], [6, 64], [4, 69], [11, 73]],
];
const RUST_PITS: readonly Point[] = [[40, 3.5], [182, 479.5], [350.5, 300], [3.5, 330], [300, 3.5], [3.5, 420]];

// 缠根藤蔓: 沿左缘 / 右缘 / 底边进出钢框的波浪藤 + 叶片。
const VINES = [
  "M -7 108 C 12 116, 16 134, -1 146 S -10 172, 12 182 S 18 206, -3 218 S -9 240, 8 250",
  "M 361 238 C 342 246, 338 264, 354 276 S 362 300, 342 310 S 336 334, 357 344",
  "M 58 492 C 66 472, 88 474, 96 488 S 122 496, 132 476 S 160 470, 170 490 S 196 496, 206 478",
  "M 300 -8 C 306 10, 324 12, 334 2 S 356 4, 350 22 S 360 44, 346 52",
];
const LEAVES: readonly { x: number; y: number; r: number }[] = [
  { x: 14, y: 126, r: -30 }, { x: -6, y: 166, r: 200 }, { x: 15, y: 196, r: -40 }, { x: 10, y: 244, r: 20 },
  { x: 338, y: 258, r: 210 }, { x: 360, y: 292, r: 20 }, { x: 337, y: 326, r: 200 },
  { x: 80, y: 472, r: -70 }, { x: 146, y: 472, r: -110 }, { x: 190, y: 494, r: 80 },
  { x: 318, y: 14, r: 120 }, { x: 358, y: 30, r: 10 },
];

// 升级双箭头: 卡名压条(配图下沿 54px)右端, 竖直居中。
const TITLE_MID = CARD_SPLIT - 27;
const CHEVRONS = [-6, 6].map((dy) => toSvgPoints([[W - 48, TITLE_MID + dy + 5], [W - 37, TITLE_MID + dy - 6], [W - 26, TITLE_MID + dy + 5]]));

export function PickRimDecor({ look, activated }: { look: PickRimLook; activated: boolean }) {
  const id = useId();
  const blur = `${id}-blur`;
  const contaminated = look.tone === "contaminated";
  const rooted = look.tone === "rooted";
  if (!activated && !contaminated && !rooted && !look.upgraded) return null;

  return (
    <svg
      className={s.decor}
      data-dim={look.dim ? "" : undefined}
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      aria-hidden="true"
    >
      <defs>
        <filter id={blur} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {activated && (
        <g className={s.charge}>
          <polygon className={s.chargeHalo} points={OUTLINE} filter={`url(#${blur})`} />
          <polygon className={s.chargeEdge} points={OUTLINE} />
          <polygon className={s.runnerGlow} points={OUTLINE} pathLength={1} filter={`url(#${blur})`} />
          <polygon className={s.runner} points={OUTLINE} pathLength={1} />
        </g>
      )}

      {contaminated && (
        <g className={s.rust}>
          <g className={s.crackDepth} transform="translate(0.8 0.9)">
            {CRACKS.map((points, index) => <polyline key={index} points={toSvgPoints(points)} />)}
          </g>
          <g className={s.crack}>
            {CRACKS.map((points, index) => <polyline key={index} points={toSvgPoints(points)} />)}
          </g>
          {RUST_PITS.map(([x, y]) => <circle key={`${x}-${y}`} className={s.pit} cx={x} cy={y} r={1.8} />)}
        </g>
      )}

      {rooted && (
        <g className={s.vines}>
          {VINES.map((d) => <path key={`o${d}`} className={s.vineOutline} d={d} />)}
          {VINES.map((d) => <path key={`c${d}`} className={s.vineCore} d={d} />)}
          {VINES.map((d) => <path key={`h${d}`} className={s.vineHi} d={d} />)}
          {LEAVES.map(({ x, y, r }) => (
            <ellipse key={`${x}-${y}`} className={s.leaf} cx={x} cy={y} rx={7} ry={3.4} transform={`rotate(${r} ${x} ${y})`} />
          ))}
        </g>
      )}

      {look.upgraded && (
        <g className={s.upgrade}>
          {CHEVRONS.map((points) => <polyline key={`o${points}`} className={s.chevronOutline} points={points} />)}
          {CHEVRONS.map((points) => <polyline key={`c${points}`} className={s.chevron} points={points} />)}
        </g>
      )}
    </svg>
  );
}
