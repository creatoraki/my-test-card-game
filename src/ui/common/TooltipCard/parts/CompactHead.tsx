// 紧凑头部(高 62): 标题 + 可选副信息 + 左下下划线短划 + 右侧斜条纹。
// 用于没有图标的普通说明类悬浮 —— 装饰语汇与大头部一致, 只是去掉徽章和星形徽记。

import type { ReactNode } from "react";
import { useSvgId } from "../geometry";
import s from "./CompactHead.module.css";

const STRIPES = [12, 20, 28, 36, 44, 52];

export function CompactHead({ title, meta }: { title?: ReactNode; meta?: ReactNode }) {
  const lineId = useSvgId("tch-line");
  return (
    <div className={s.head}>
      <div className={s.name}>{title}</div>
      {meta && <div className={s.meta}>{meta}</div>}

      <svg className={s.underline} width="150" height="4" aria-hidden="true">
        <defs>
          <linearGradient id={lineId} x1="0" x2="1">
            <stop offset="0" style={{ stopColor: "var(--accent)" }} />
            <stop offset="0.45" style={{ stopColor: "var(--accent)", stopOpacity: 0.65 }} />
            <stop offset="1" stopColor="#4a7fa3" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect className={s.dash} x="0" y="0.8" width="8" height="2.4" />
        <rect className={s.dash} x="11" y="0.8" width="10" height="2.4" opacity="0.8" />
        <rect className={s["dash-bright"]} x="24" y="0.8" width="26" height="2.4" />
        <rect x="50" y="1.4" width="100" height="1.2" fill={`url(#${lineId})`} />
      </svg>

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
    </div>
  );
}
