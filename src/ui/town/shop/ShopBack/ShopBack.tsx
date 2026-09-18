import type { Chamfer } from "@/ui/common/NeonPlate/plateGeometry";
import { BackFrame } from "./BackFrame";
import s from "./ShopBack.module.css";

const DEFAULT_CHAMFER: Chamfer = { tl: 8, tr: 8, br: 14, bl: 6 };

interface Props {
  onClick: () => void;
  label?: string;
  /** 英文副标题，装饰用。 */
  subLabel?: string;
  width?: number;
  height?: number;
  chamfer?: Chamfer;
}

// 左下返回按钮：颜色全部走 --rail-* 变量，各场景主题只覆盖变量。
export function ShopBack({
  onClick,
  label = "返回据点",
  subLabel = "BACK TO BASE",
  width = 210,
  height = 75,
  chamfer = DEFAULT_CHAMFER,
}: Props) {
  return (
    <button className={s.back} type="button" style={{ width, height }} onClick={onClick}>
      <BackFrame width={width} height={height} chamfer={chamfer} />
      <svg className={s.arrow} viewBox="0 0 30 28" fill="none" aria-hidden="true">
        <g stroke="var(--rail-accent, #ff3b4e)" strokeWidth="3.2" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M14 3 4 14l10 11M26 3 16 14l10 11" opacity=".7" className={s.arrowGlow} />
          <path d="M14 3 4 14l10 11M26 3 16 14l10 11" />
        </g>
      </svg>
      <span className={s.text}>
        <span className={s.label}>{label}</span>
        <span className={s.sub}>{subLabel}</span>
      </span>
    </button>
  );
}
