import { cx } from "@/ui/common/cx";
import type { TechnologyTab } from "@/ui/common/techTree/TechnologyTree/types";
import s from "./TechnologyTabs.module.css";

interface Props {
  tabs: readonly TechnologyTab[];
  activeId: string;
  ariaLabel: string;
  onChange: (id: string) => void;
  className?: string;
}

/** 科技板顶部分类页签；只有传入 tabs 的调用方才会渲染这一行。 */
export function TechnologyTabs({ tabs, activeId, ariaLabel, onChange, className }: Props) {
  return (
    <nav className={cx(s.tabs, className)} aria-label={ariaLabel}>
      {tabs.map((tab, index) => {
        const active = tab.id === activeId;
        return (
          <button
            key={tab.id}
            className={s.tab}
            type="button"
            data-active={active || undefined}
            aria-pressed={active}
            onClick={() => onChange(tab.id)}
          >
            <span className={s.index} aria-hidden="true">{`0${index + 1}`}</span>
            <span className={s.copy}>
              <strong>{tab.label}</strong>
              {tab.desc && <span className={s.desc}>{tab.desc}</span>}
            </span>
            {tab.badge && <span className={s.badge}>{tab.badge}</span>}
          </button>
        );
      })}
    </nav>
  );
}
