// 常驻交易界面：导航只替换内容，货架与经济规则仍由 store 管理。
import { useMemo, useState } from "react";
import { getItemDef, shopLevelOf } from "@/data";
import { sortStacks } from "@/items/inventory";
import { RARITY_ORDER } from "@/items/types";
import { techLevels, useTownStore } from "@/store/townStore";
import { MarketPanel } from "@/ui/town/shop/MarketPanel";
import WarehousePanel from "@/ui/town/shop/WarehousePanel/WarehousePanel";
import { ShopHeader } from "@/ui/town/shop/ShopHeader";
import { ShopNavigation, type ShopPage } from "@/ui/town/shop/ShopNavigation";
import { RecyclePanel } from "./RecyclePanel";
import s from "./StockEntries.module.css";

const rarityRank = (rarity: string) => RARITY_ORDER.indexOf(rarity as never);
const titles = { shop: "商店", recycle: "回收台", warehouse: "仓库" };

export function StockEntries({ onBack }: { onBack?: () => void }) {
  const [page, setPage] = useState<ShopPage>("shop");
  const storage = useTownStore((state) => state.storage);
  const loot = useTownStore((state) => state.loot);
  const shop = useTownStore((state) => state.shop);
  const levels = useTownStore(techLevels);
  const sellItem = useTownStore((state) => state.sellItem);
  const sorted = useMemo(() => sortStacks(storage, getItemDef, rarityRank), [storage]);

  return (
    <>
      <ShopNavigation page={page} onChange={setPage} />
      <section className={s.window} aria-label={titles[page]}>
        <ShopHeader title={titles[page]} credits={loot} level={shopLevelOf(shop.techs)} onBack={onBack} />
        <div className={s.content}>
          {page === "shop" && <MarketPanel />}
          {page === "recycle" && <RecyclePanel stacks={sorted} loot={loot} levels={levels} onSell={sellItem} />}
          {page === "warehouse" && <WarehousePanel rows={4} columns={8} />}
        </div>
      </section>
    </>
  );
}
