import { CrateIcon, RecycleIcon, ShelfIcon } from "@/ui/town/shop/StockPanels/icons";
import s from "./ShopNavigation.module.css";

export type ShopPage = "shop" | "recycle" | "warehouse";
const entries = [
  { id: "shop", label: "商店", Icon: ShelfIcon },
  { id: "recycle", label: "回收台", Icon: RecycleIcon },
  { id: "warehouse", label: "仓库", Icon: CrateIcon },
] as const;

export function ShopNavigation({ page, onChange }: { page: ShopPage; onChange: (page: ShopPage) => void }) {
  return (
    <nav className={s.nav} aria-label="商店功能">
      {entries.map(({ id, label, Icon }) => (
        <button key={id} type="button" className={s.entry} aria-current={page === id ? "page" : undefined} onClick={() => onChange(id)}>
          {/* 热色牌面: 纯装饰层, 与 .entry::before 的冷色牌面交叉淡入。 */}
          <span className={s.plate} aria-hidden="true" />
          <span className={s.icon} aria-hidden="true"><Icon /></span>
          <span className={s.label}>{label}</span>
        </button>
      ))}
      <p className={s.note}>更远的星辰<br />仍在等待我们</p>
    </nav>
  );
}
