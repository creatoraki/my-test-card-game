import { NavigationFrame } from "./NavigationFrame";
import { NavigationIcon } from "./NavigationIcon";
import s from "./ShopNavigation.module.css";

export type ShopPage = "shop" | "recycle" | "warehouse";
const entries = [
  { id: "shop", label: "商店" },
  { id: "recycle", label: "回收台" },
  { id: "warehouse", label: "仓库" },
] as const;

export function ShopNavigation({ page, onChange }: { page: ShopPage; onChange: (page: ShopPage) => void }) {
  return (
    <nav className={s.nav} aria-label="商店功能">
      {entries.map(({ id, label }) => (
        <button key={id} type="button" className={s.entry} aria-current={page === id ? "page" : undefined} onClick={() => onChange(id)}>
          <NavigationFrame />
          <span className={s.icon}><NavigationIcon page={id} /></span>
          <span className={s.label}>{label}</span>
        </button>
      ))}
    </nav>
  );
}
