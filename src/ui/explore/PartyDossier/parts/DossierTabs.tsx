// 主分区页眉右侧的两枚页签。页签值由 PartyDossier 持有 —— 换队员时不重置。
import { cx } from "@/ui/common/shared/cx";
import s from "./DossierTabs.module.css";

export type DossierTab = "loadout" | "deck";

const TABS: { id: DossierTab; label: string }[] = [
  { id: "loadout", label: "属性装备" },
  { id: "deck", label: "卡组" },
];

export function DossierTabs({
  value,
  deckCount,
  onChange,
}: {
  value: DossierTab;
  deckCount: number;
  onChange: (tab: DossierTab) => void;
}) {
  return (
    <div className={s.tabs} role="tablist" aria-label="档案分区">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={cx(s.tab, value === tab.id && s.active)}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.id === "deck" && <i className={s.count}>{deckCount}</i>}
        </button>
      ))}
    </div>
  );
}
