// 常驻交易界面：导航只替换内容，货架与经济规则仍由 store 管理。
import { useMemo, useState } from "react";
import { getItemDef, shopLevelOf } from "@/data";
import { sortStacks } from "@/items/inventory";
import { RARITY_ORDER } from "@/items/types";
import { techLevels, useTownStore } from "@/store/townStore";
import { DetailFrame } from "@/ui/common/DetailFrame";
import { useSwapTransition } from "@/ui/hooks/useSwapTransition";
import { MarketPanel } from "@/ui/town/shop/MarketPanel";
import WarehousePanel from "@/ui/town/shop/WarehousePanel/WarehousePanel";
import { ShopHeader } from "@/ui/town/shop/ShopHeader";
import { ShopNavigation, type ShopPage } from "@/ui/town/shop/ShopNavigation";
import { ShopUpgradePanel } from "@/ui/town/shop/ShopUpgradePanel";
import { RecyclePanel } from "./RecyclePanel";
import s from "./StockEntries.module.css";

const rarityRank = (rarity: string) => RARITY_ORDER.indexOf(rarity as never);
type ShopView = ShopPage | "upgrade";

const titles: Record<ShopView, string> = { shop: "商店", recycle: "回收台", warehouse: "仓库", upgrade: "设施升级" };
const subtitles: Record<ShopView, string> = {
  shop: "精选星际物资，强化你的旅程。",
  recycle: "精选星际物资，强化你的旅程。",
  warehouse: "精选星际物资，强化你的旅程。",
  upgrade: "解锁商店科技，提升补货效率与货架容量。",
};
const PAGE_LEAVE_MS = 170;
const PAGE_ENTER_MS = 280;

export function StockEntries({ onBack }: { onBack?: () => void }) {
  const [view, setView] = useState<ShopView>("shop");
  const { value: shownView, phase } = useSwapTransition(view, view, PAGE_LEAVE_MS, PAGE_ENTER_MS);
  const storage = useTownStore((state) => state.storage);
  const loot = useTownStore((state) => state.loot);
  const shop = useTownStore((state) => state.shop);
  const levels = useTownStore(techLevels);
  const sellItem = useTownStore((state) => state.sellItem);
  const sorted = useMemo(() => sortStacks(storage, getItemDef, rarityRank), [storage]);

  return (
    <>
      <ShopNavigation page={view === "upgrade" ? "shop" : view} onChange={setView} />
      <section className={s.window} aria-label={titles[shownView]}>
        <DetailFrame tone="gold" />
        <div className={s.inner}>
          <ShopHeader title={titles[shownView]} subtitle={subtitles[shownView]} credits={loot} level={shopLevelOf(shop.techs)} onBack={onBack} />
          <div className={s.content}>
            <div className={s.page} data-page-phase={phase}>
              {shownView === "shop" && <MarketPanel onUpgrade={() => setView("upgrade")} />}
              {shownView === "recycle" && <RecyclePanel stacks={sorted} loot={loot} levels={levels} onSell={sellItem} />}
              {shownView === "warehouse" && <WarehousePanel rows={4} columns={8} />}
              {shownView === "upgrade" && <ShopUpgradePanel onBack={() => setView("shop")} />}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
