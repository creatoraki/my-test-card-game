import { NeonPlate, type Chamfer } from "@/ui/common/NeonPlate";
import s from "./ShopBack.module.css";

const DEFAULT_CHAMFER: Chamfer = { tl: 10, tr: 12, br: 12, bl: 10 };

interface Props {
  onClick: () => void;
  label?: string;
  width?: number;
  height?: number;
  chamfer?: Chamfer;
}

// 颜色全部走 --back-* 变量, 默认值即商店的青色原貌; 换皮场景(研究中心)只覆盖变量。
export function ShopBack({ onClick, label = "返回据点", width = 192, height = 58, chamfer = DEFAULT_CHAMFER }: Props) {
  return (
    <button className={s.back} type="button" style={{ width, height }} onClick={onClick}>
      <NeonPlate width={width} height={height} chamfer={chamfer} inset={4} />
      <svg className={s.arrow} viewBox="0 0 28 22" fill="none" aria-hidden="true">
        <g stroke="var(--back-arrow, #5ff3ff)" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
          <path d="M13 3 5 11l8 8M24 3l-8 8 8 8" opacity=".6" className={s.arrowGlow} />
          <path d="M13 3 5 11l8 8M24 3l-8 8 8 8" />
        </g>
      </svg>
      <span className={s.label}>{label}</span>
    </button>
  );
}
