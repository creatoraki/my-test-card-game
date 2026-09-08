import { useEffect, useState } from "react";
import type { ItemDef, ItemStack } from "@/items/types";
import type { PendingReforge } from "@/store/equipCraftSlice";
import { EquipAction, EquipGainHead } from "../../equipParts";
import { BondCard } from "./BondCard";
import s from "./ReforgeResultColumn.module.css";

interface Props {
  stack: ItemStack | null;
  def: ItemDef | null;
  pending: PendingReforge | null;
  notice: string;
  canRoll: boolean;
  onRoll: () => void;
  onApply: (keepNew: boolean) => void;
}

export function ReforgeResultColumn({
  stack,
  def,
  pending,
  notice,
  canRoll,
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
          notice={pending ? "请选择要保留的羁绊，放弃新羁绊不会返还材料。" : notice}
        />
      ) : (
        <p className={s.empty}>{notice}</p>
      )}

      {pending ? (
        <div className={s.candidates} role="radiogroup" aria-label="羁绊候选">
          <BondCard
            bondId={affinityId}
            selected={picked === "original"}
            onSelect={() => setPicked("original")}
          />
          <BondCard
            bondId={pending.affinity}
            selected={picked === "new"}
            onSelect={() => setPicked("new")}
          />
        </div>
      ) : (
        <BondCard bondId={affinityId} />
      )}

      <EquipAction
        disabled={pending ? false : !canRoll}
        label={pending ? "保留选中羁绊" : "重铸"}
        ariaLabel={pending ? "保留选中羁绊" : "重铸选中装备的羁绊"}
        onClick={() => (pending ? onApply(picked === "new") : onRoll())}
      />
    </section>
  );
}
