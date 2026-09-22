import type { CostCheck } from "@/data";
import type { ItemDef, ItemStack } from "@/items/types";
import type { EquipTab } from "@/ui/common/item/itemFilters";
import type { TooltipDirection } from "@/ui/common/item/ItemTooltip";
import { EquipGainColumn } from "./EquipGainColumn";
import { EquipForgeColumn, EquipPickColumn, type PickEntry } from "../../equipParts";
import type { UpgradeRangePreview } from "../upgradeRange";
import s from "../../equipParts/equipBoard.module.css";

interface Props {
  entries: PickEntry[];
  equipTab: EquipTab;
  onEquipTab: (tab: EquipTab) => void;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  current: ItemStack | null;
  currentDef: ItemDef | null;
  affinityId?: string;
  nextDef: ItemDef | null;
  check: CostCheck | null;
  loot: number;
  preview: UpgradeRangePreview | null;
  notice: string;
  canUpgrade: boolean;
  onUpgrade: () => void;
  onShowTooltip: (element: HTMLElement, stack: ItemStack, direction?: TooltipDirection) => void;
  onHideTooltip: () => void;
}

export function EquipUpgradeBoard({
  entries,
  equipTab,
  onEquipTab,
  selectedKey,
  onSelect,
  current,
  currentDef,
  affinityId,
  nextDef,
  check,
  loot,
  preview,
  notice,
  canUpgrade,
  onUpgrade,
  onShowTooltip,
  onHideTooltip,
}: Props) {
  return (
    <div className={s.layout}>
      <EquipPickColumn
        entries={entries}
        equipTab={equipTab}
        onEquipTab={onEquipTab}
        selectedKey={selectedKey}
        onSelect={onSelect}
      />
      <span className={s.divider} aria-hidden />
      <EquipForgeColumn
        stack={current}
        def={currentDef}
        check={check}
        loot={loot}
        onShowTooltip={onShowTooltip}
        onHideTooltip={onHideTooltip}
      />
      <span className={s.divider} aria-hidden />
      <EquipGainColumn
        preview={preview}
        emptyText={notice}
        def={currentDef}
        nextDef={nextDef}
        affinityId={affinityId}
        canUpgrade={canUpgrade}
        onUpgrade={onUpgrade}
      />
    </div>
  );
}
