// 据点商店场景：保留标题块与三条抽屉入口，具体面板由 StockEntries 管理。

import { cx } from "@/ui/common/cx";
import { StockEntries } from "@/ui/town/shop/StockPanels";
import s from "./ShopScene.module.css";

interface Props {
  leaving?: boolean;
}

export function ShopScene({ leaving = false }: Props) {
  return (
    <div
      className={cx(s["sx-root"], leaving && s["is-leaving"])}
      data-shop-root
      data-leaving={leaving ? "" : undefined}
    >
      <header className={s["sx-header"]} style={{ left: "56px", top: "42px" }}>
        <span className={s["sx-kicker"]}>物资交换</span>
        <h2 className={s["sx-title"]}>商店</h2>
        <p className={s["sx-sub"]}>每日上新 · 积分采购 · 物资回收</p>
      </header>
      <StockEntries />
    </div>
  );
}

export default ShopScene;
