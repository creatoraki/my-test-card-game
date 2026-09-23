import type { CostCheck } from "@/data";
import type { ItemDef, ItemStack } from "@/items/types";
import type { PendingReforge } from "@/store/townSlices/equipCraftSlice";
import type { EquipTab } from "@/ui/common/item/shared/itemFilters";
import type { TooltipDirection } from "@/ui/common/item/ItemTooltip";
import { EquipForgeColumn, EquipPickColumn, type PickEntry } from "../../EquipParts";
import { ReforgeResultColumn } from "./ReforgeResultColumn";
import s from "../../EquipParts/equipBoard.module.css";

interface Props {
  entries: PickEntry[];
  equipTab: EquipTab;
  onEquipTab: (tab: EquipTab) => void;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  current: ItemStack | null;
  currentDef: ItemDef | null;
  check: CostCheck | null;
  pending: PendingReforge | null;
  notice: string;
  canRoll: boolean;
  onRoll: () => void;
  onApply: (keepNew: boolean) => void;
  onShowTooltip: (element: HTMLElement, stack: ItemStack, direction?: TooltipDirection) => void;
  onHideTooltip: () => void;
}

export function ReforgeBoard({
  entries,
  equipTab,
  onEquipTab,
  selectedKey,
  onSelect,
  current,
  currentDef,
  check,
  pending,
  notice,
  canRoll,
  onRoll,
  onApply,
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
        disabled={Boolean(pending)}
      />
      <span className={s.divider} aria-hidden />
      <EquipForgeColumn
        stack={current}
        def={currentDef}
        check={check}
        loot={0}
        ariaLabel="重铸材料"
        onShowTooltip={onShowTooltip}
        onHideTooltip={onHideTooltip}
      />
      <span className={s.divider} aria-hidden />
      <ReforgeResultColumn
        stack={current}
        def={currentDef}
        pending={pending}
        notice={notice}
        canRoll={canRoll}
        onRoll={onRoll}
        onApply={onApply}
      />
    </div>
  );
}
