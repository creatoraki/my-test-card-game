import type { ReactNode } from "react";
import { NavigationFrame } from "./NavigationFrame";
import s from "./ShopNavigation.module.css";

export interface NavigationEntry<Id extends string = string> {
  id: Id;
  label: string;
  icon: ReactNode;
}

interface Props<Id extends string> {
  entries: readonly NavigationEntry<Id>[];
  value: Id;
  onChange: (value: Id) => void;
  ariaLabel: string;
  itemWidth?: number;
  itemHeight?: number;
  gap?: number;
}

export function NavigationRail<Id extends string>({
  entries,
  value,
  onChange,
  ariaLabel,
  itemWidth = 205,
  itemHeight = 84,
  gap = 14,
}: Props<Id>) {
  return (
    <nav className={s.nav} style={{ width: itemWidth, gap }} aria-label={ariaLabel}>
      {entries.map((entry) => (
        <button
          key={entry.id}
          type="button"
          className={s.entry}
          style={{ width: itemWidth, height: itemHeight }}
          aria-current={value === entry.id ? "page" : undefined}
          onClick={() => onChange(entry.id)}
        >
          <NavigationFrame width={itemWidth} height={itemHeight} />
          <span className={s.icon}>{entry.icon}</span>
          <span className={s.label}>{entry.label}</span>
        </button>
      ))}
    </nav>
  );
}
