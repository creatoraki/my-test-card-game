import { useEffect, useState } from "react";
import type { ItemDef, ItemStack } from "@/items/types";
import type { PendingReforge } from "@/store/townSlices/equipCraftSlice";
import { EquipAction, EquipGainHead } from "../../EquipParts";
import type { BondFamily } from "@/data";
import { BondCard } from "./BondCard";
import { BondFamilyPicker } from "@/ui/common/bond/BondFamilyPicker";
import s from "./ReforgeResultColumn.module.css";

interface Props {
  stack: ItemStack | null;
  def: ItemDef | null;
  pending: PendingReforge | null;
  notice: string;
  canRoll: boolean;
  family: BondFamily | null;
  onFamily: (family: BondFamily | null) => void;
  onRoll: () => void;
  onApply: (keepNew: boolean) => void;
}

export function ReforgeResultColumn({
  stack,
  def,
  pending,
  notice,
  canRoll,
  family,
  onFamily,
  onRoll,
  onApply,
}: Props) {
  const [picked, setPicked] = useState<"original" | "new">("new");
  useEffect(() => setPicked("new"), [pending?.affinity, pending?.target]);

  const affinityId = stack?.affinity ?? def?.affinity;

  return (
    <section className={s.column} aria-label="重铸结果">
      {def ? (
        <EquipGainHead
          def={def}
          nextDef={null}
          affinityId={affinityId}
          notice={pending ? "请选择要保留的羁绊。" : notice}
        />
      ) : (
        <p className={s.empty}>{notice}</p>
      )}

      {pending ? (
        <div className={s.candidates} role="radiogroup" aria-label="羁绊候选">
          <BondCard
            bondId={affinityId}
            tag="original"
            selected={picked === "original"}
            onSelect={() => setPicked("original")}
          />
          <BondCard
            bondId={pending.affinity}
            tag="new"
            selected={picked === "new"}
            onSelect={() => setPicked("new")}
          />
        </div>
      ) : (
        <>
          <BondCard bondId={affinityId} />
          {def && <BondFamilyPicker value={family} onChange={onFamily} />}
        </>
      )}

      <EquipAction
        disabled={pending ? false : !canRoll}
        label={pending ? "保留选中羁绊" : "重铸"}
        ariaLabel={pending ? "保留选中羁绊" : "重铸选中装备的羁绊"}
        confirmLabel={pending ? undefined : "再次点击确认重铸"}
        onClick={() => (pending ? onApply(picked === "new") : onRoll())}
      />
    </section>
  );
}
