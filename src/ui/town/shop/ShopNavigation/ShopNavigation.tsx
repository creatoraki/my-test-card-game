import { NavigationIcon } from "./NavigationIcon";
import { NavigationRail } from "./NavigationRail";

export type ShopPage = "shop" | "recycle" | "warehouse";
const entries = [
  { id: "shop", label: "商店", subLabel: "SHOP" },
  { id: "recycle", label: "回收台", subLabel: "RECYCLE" },
  { id: "warehouse", label: "仓库", subLabel: "WAREHOUSE" },
] as const;

interface Props {
  page: ShopPage;
  onChange: (page: ShopPage) => void;
}

export function ShopNavigation({ page, onChange }: Props) {
  return (
    <NavigationRail
      entries={entries.map((entry) => ({ ...entry, icon: <NavigationIcon page={entry.id} /> }))}
      value={page}
      onChange={onChange}
      ariaLabel="商店功能"
    />
  );
}
