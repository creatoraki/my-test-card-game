import { useEffect } from "react";
import type { ExploreState } from "@/explore/types";
import { merchantShelf } from "@/explore/curio/merchant";
import { closeCorridorObject } from "@/store/explore/exploreCorridor";
import { useRunStore } from "@/store/run/runStore";
import { cx } from "@/ui/common/shared/cx";
import { ShopHeader } from "@/ui/town/shop/ShopHeader";
import { ShopWindow } from "@/ui/town/shop/ShopWindow";
import theme from "@/ui/town/shop/styles/shopTheme.module.css";
import { MerchantFoodWallet } from "./MerchantFoodWallet";
import { MerchantMarket } from "./MerchantMarket";
import s from "./WanderingMerchantPanel.module.css";

export function WanderingMerchantPanel({ session }: { session: ExploreState }) {
  const openShelf = useRunStore((state) => state.openMerchantShelf);
  const shelf = merchantShelf(session);

  useEffect(() => {
    if (session.phase === "landed") openShelf();
  }, [openShelf, session.phase, session.corridor?.activeObjectId]);

  return (
    <div className={s.backdrop}>
      <div className={cx(theme.theme, s.theme)} data-shop-root>
        <ShopWindow
          className={s.window}
          ariaLabel="流浪货商"
          header={(
            <ShopHeader
              title="流浪货商"
              subtitle="只收两种临期食品，货物售出后不再补充。"
              stats={shelf ? <MerchantFoodWallet foods={shelf.foods} backpack={session.backpack} /> : undefined}
              onBack={closeCorridorObject}
              closeLabel="离开货商"
            />
          )}
        >
          {shelf ? <MerchantMarket session={session} shelf={shelf} /> : <p className={s.loading}>货商正在整理货物……</p>}
        </ShopWindow>
      </div>
    </div>
  );
}
