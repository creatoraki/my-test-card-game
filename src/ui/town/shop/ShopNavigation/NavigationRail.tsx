import type { ReactNode } from "react";
import { NavigationFrame } from "./NavigationFrame";
import s from "./ShopNavigation.module.css";

export interface NavigationEntry<Id extends string = string> {
  id: Id;
  label: string;
  /** 英文副标题，装饰用。 */
  subLabel?: string;
  icon: ReactNode;
}

interface Props<Id extends string> {
  entries: readonly NavigationEntry<Id>[];
  value: Id;
  onChange: (value: Id) => void;
  ariaLabel: string;
  itemWidth?: number;
  /** 槽位高度（含选中卡下方的空隙）。 */
  itemHeight?: number;
}

export function NavigationRail<Id extends string>({
  entries,
  value,
  onChange,
  ariaLabel,
  itemWidth = 216,
  itemHeight = 105,
}: Props<Id>) {
  return (
    <nav className={s.nav} style={{ width: itemWidth }} aria-label={ariaLabel}>
      {entries.map((entry, index) => {
        const active = value === entry.id;
        return (
          <button
            key={entry.id}
            type="button"
            className={s.entry}
            style={{ width: itemWidth, height: itemHeight }}
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(entry.id)}
          >
            <NavigationFrame width={itemWidth} height={itemHeight} active={active} last={index === entries.length - 1} />
            <span className={s.icon}>{entry.icon}</span>
            <span className={s.text}>
              <span className={s.label}>{entry.label}</span>
              {entry.subLabel && <span className={s.sub}>{entry.subLabel}</span>}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
