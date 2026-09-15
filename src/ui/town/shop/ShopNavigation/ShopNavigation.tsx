import { NavigationIcon } from "./NavigationIcon";
import { NavigationRail } from "./NavigationRail";

export type ShopPage = "shop" | "recycle" | "warehouse";
const entries = [
  { id: "shop", label: "商店" },
  { id: "recycle", label: "回收台" },
  { id: "warehouse", label: "仓库" },
] as const;

export function ShopNavigation({ page, onChange }: { page: ShopPage; onChange: (page: ShopPage) => void }) {
  return (
    <NavigationRail
      entries={entries.map((entry) => ({ ...entry, icon: <NavigationIcon page={entry.id} /> }))}
      value={page}
      onChange={onChange}
      ariaLabel="商店功能"
    />
  );
}
