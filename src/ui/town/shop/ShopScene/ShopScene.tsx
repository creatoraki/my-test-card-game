// 据点商店场景：氛围层与品牌标识，常驻导航及交易面板由 StockEntries 管理。

import { cx } from "@/ui/common/cx";
import { StockEntries } from "@/ui/town/shop/StockPanels";
import { ShopBack } from "@/ui/town/shop/ShopBack";
import { ShopSidebar } from "@/ui/town/shop/ShopSidebar";
import theme from "../shopTheme.module.css";
import s from "./ShopScene.module.css";
import { ShopBrand } from "./ShopBrand";

interface Props {
  leaving?: boolean;
  onBack?: () => void;
}

export function ShopScene({ leaving = false, onBack }: Props) {
  return (
    <div
      className={cx(theme.theme, s["sx-root"], leaving && s["is-leaving"])}
      data-shop-root
      data-leaving={leaving ? "" : undefined}
    >
      <ShopSidebar />
      <ShopBrand label="商店" subLabel="TRADING POST" />
      <StockEntries onBack={onBack} />
      {onBack && <ShopBack onClick={onBack} />}
    </div>
  );
}

export default ShopScene;
