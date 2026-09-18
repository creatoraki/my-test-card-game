import { NeonPlate, type Chamfer } from "@/ui/common/NeonPlate";
import s from "./ShopBrand.module.css";

const DEFAULT_CHAMFER: Chamfer = { tl: 14, tr: 8, br: 14, bl: 6 };

interface Props {
  label?: string;
  width?: number;
  height?: number;
  chamfer?: Chamfer;
}

// 左上场景铭牌：颜色走 --brand-* 变量，默认值为商店金色。
export function ShopBrand({ label = "商店", width = 205, height = 86, chamfer = DEFAULT_CHAMFER }: Props) {
  return (
    <div className={s.brand} style={{ width, height }}>
      <NeonPlate width={width} height={height} chamfer={chamfer} />
      <strong className={s.label}>{label}</strong>
    </div>
  );
}
