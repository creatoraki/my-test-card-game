import { BondSlot } from "@/ui/common/BondSlot";
import type { BattleBondView } from "@/store/battleStore";
import s from "./BondRail.module.css";

export function BondRail({ bonds }: { bonds: BattleBondView[] }) {
  const equippedBonds = bonds.filter((bond) => bond.count > 0);
  if (!equippedBonds.length) return null;

  return (
    <aside className={s.rail} aria-label="羁绊" onClick={(event) => event.stopPropagation()}>
      <div className={s.items}>
        {equippedBonds.map((bond) => {
          const activeIndex = bond.tier ? bond.def.tiers.indexOf(bond.tier) : -1;
          return (
            <BondSlot
              key={bond.def.id}
              def={bond.def}
              count={bond.count}
              tierIndex={activeIndex}
              next={bond.next}
              iconSize={80}
              variant="compact"
              popoverSide="bottom-right"
            />
          );
        })}
      </div>
    </aside>
  );
}
