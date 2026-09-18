import { NavigationIcon } from "./NavigationIcon";
import { NavigationRail } from "./NavigationRail";

export type ShopPage = "shop" | "recycle" | "warehouse";
const entries = [
  { id: "shop", label: "商店" },
  { id: "recycle", label: "回收台" },
  { id: "warehouse", label: "仓库" },
] as const;

interface Props {
  page: ShopPage;
  onChange: (page: ShopPage) => void;
  itemWidth?: number;
  itemHeight?: number;
}

export function ShopNavigation({ page, onChange, itemWidth, itemHeight }: Props) {
  return (
    <NavigationRail
      entries={entries.map((entry) => ({ ...entry, icon: <NavigationIcon page={entry.id} /> }))}
      value={page}
      onChange={onChange}
      ariaLabel="商店功能"
      itemWidth={itemWidth}
      itemHeight={itemHeight}
    />
  );
}
