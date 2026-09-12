// 据点商店场景：氛围层与品牌标识，常驻导航及交易面板由 StockEntries 管理。

import { cx } from "@/ui/common/cx";
import { StockEntries } from "@/ui/town/shop/StockPanels";
import s from "./ShopScene.module.css";

interface Props {
  leaving?: boolean;
  onBack?: () => void;
}

export function ShopScene({ leaving = false, onBack }: Props) {
  return (
    <div
      className={cx(s["sx-root"], leaving && s["is-leaving"])}
      data-shop-root
      data-leaving={leaving ? "" : undefined}
    >
      <div className={s.brand}><strong>星际集市</strong><span>万物皆可交易<br />通往更远的未来</span></div>
      <StockEntries onBack={onBack} />
    </div>
  );
}

export default ShopScene;
