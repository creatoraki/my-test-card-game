import { NavigationFrame } from "@/ui/town/shop/ShopNavigation/NavigationFrame";
import { ReforgeIcon, UpgradeIcon } from "./icons";
import s from "./AssemblyNavigation.module.css";

export type AssemblyPage = "upgrade" | "reforge";

const entries = [
  { id: "upgrade", label: "装备升阶", icon: <UpgradeIcon /> },
  { id: "reforge", label: "羁绊重铸", icon: <ReforgeIcon /> },
] as const;

export function AssemblyNavigation({
  page,
  onChange,
}: {
  page: AssemblyPage;
  onChange: (page: AssemblyPage) => void;
}) {
  return (
    <nav className={s.nav} aria-label="工房功能">
      {entries.map((entry, index) => (
        <button
          key={entry.id}
          type="button"
          className={s.entry}
          aria-current={page === entry.id ? "page" : undefined}
          onClick={() => onChange(entry.id)}
        >
          <NavigationFrame width={205} height={96} active={page === entry.id} last={index === entries.length - 1} />
          <span className={s.icon}>{entry.icon}</span>
          <span className={s.label}>{entry.label}</span>
        </button>
      ))}
    </nav>
  );
}
