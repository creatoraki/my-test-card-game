import { BrandEmblem } from "./BrandEmblem";
import s from "./ShopBrand.module.css";

interface Props {
  label?: string;
  /** 英文副标题，装饰用。 */
  subLabel?: string;
}

// 左上场景铭牌：徽标 + 场景名（中文主标题 / 英文副标题）+ 带刻度的分隔线；颜色走 --rail-* 变量。
export function ShopBrand({ label = "商店", subLabel = "SHOP" }: Props) {
  return (
    <div className={s.brand}>
      <BrandEmblem />
      <div className={s.text}>
        <strong className={s.label}>{label}</strong>
        <span className={s.sub}>{subLabel}</span>
      </div>
      <i className={s.rule} aria-hidden="true" />
    </div>
  );
}
