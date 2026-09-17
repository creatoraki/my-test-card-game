// 头部纯装饰: 标题下划线、右侧四角星与轨道、右下斜条纹(末两根主题色)。
// 设计图上的英文小字已按要求全部去掉, 只保留图形。

import { sparkPath, useSvgId } from "../geometry";
import s from "./HeaderDecor.module.css";

const STRIPES = [12, 20, 28, 36, 44, 52];

export function HeaderDecor() {
  const lineId = useSvgId("bdc-line");
  const starId = useSvgId("bdc-star");

  return (
    <>
      {/* 标题下划线: 设计图 y=338, x 515→1060, 左端三段短划。 */}
      <svg className={s.underline} width="186" height="4" aria-hidden="true">
        <defs>
          <linearGradient id={lineId} x1="0" x2="1">
            <stop offset="0" style={{ stopColor: "var(--accent)" }} />
            <stop offset="0.45" style={{ stopColor: "var(--accent)", stopOpacity: 0.65 }} />
            <stop offset="1" stopColor="#4a7fa3" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect className={s.dash} x="0" y="0.8" width="9" height="2.4" />
        <rect className={s.dash} x="12" y="0.8" width="11" height="2.4" opacity="0.8" />
        <rect className={s["dash-bright"]} x="26" y="0.8" width="30" height="2.4" />
        <rect x="56" y="1.4" width="130" height="1.2" fill={`url(#${lineId})`} />
      </svg>

      {/* 右侧四角星与轨道: 设计图中心 (1305,305)。 */}
      <svg className={s.emblem} viewBox="0 0 100 96" width="100" height="96" aria-hidden="true">
        <defs>
          <linearGradient id={starId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#23405a" />
            <stop offset="1" stopColor="#0b1824" />
          </linearGradient>
        </defs>
        <ellipse className={s.orbit} cx="50" cy="48" rx="44" ry="24" transform="rotate(-32 50 48)" />
        <ellipse className={s["orbit-faint"]} cx="50" cy="48" rx="38" ry="19" transform="rotate(-32 50 48)" />
        <path className={s.star} d={sparkPath(50, 48, 36, 24, 5)} fill={`url(#${starId})`} />
        <path className={s["star-inner"]} d={sparkPath(50, 48, 20, 13, 3)} />
        <circle className={s.node} cx="84" cy="22" r="2.6" />
        <circle className={s.node} cx="16" cy="74" r="2.6" />
        <path className={s["orbit-faint"]} d="M24 66l4 -2l-1 4" />
      </svg>

      {/* 右下斜条纹: 设计图 x 1280→1420, y≈440。 */}
      <svg className={s.stripes} width="62" height="7" aria-hidden="true">
        <path className={s.rule} d="M0 2.5H8M0 5.5H8" />
        {STRIPES.map((x, index) => (
          <path
            key={x}
            className={index >= STRIPES.length - 2 ? s["stripe-accent"] : s.stripe}
            d={`M${x + 3} 0.5H${x + 8}L${x + 5} 6.5H${x}Z`}
          />
        ))}
      </svg>
    </>
  );
}
