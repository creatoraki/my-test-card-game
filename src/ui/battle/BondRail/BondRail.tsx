import { BondIcon } from "@/ui/common/BondIcon";
import type { CSSProperties } from "react";
import type { BattleBondView } from "@/store/battleStore";
import { RailPopover } from "@/ui/battle/RailPopover";
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
            <div
              className={`${s.item} ${bond.tier ? s.active : ""}`}
              data-rail-item
              key={bond.def.id}
              tabIndex={0}
              style={{ "--bond-color": bond.def.color } as CSSProperties}
            >
              <BondIcon bondId={bond.def.id} className={s.icon} title={bond.def.name} />
              <span className={s.count}>{bond.count}</span>
              <RailPopover side="bottom">
                <div className={s.popHead}>
                  <strong>{bond.def.name}</strong>
                  <span>{bond.count} 点 · {bond.tier ? `Lv.${activeIndex + 1}` : "未激活"}</span>
                </div>
                <p>{bond.def.desc}</p>
                <div className={s.tiers}>
                  {bond.def.tiers.map((tier, index) => (
                    <div className={index === activeIndex ? s.tierActive : ""} key={tier.count}>
                      <b>Lv.{index + 1} · {tier.count} 点</b><span>{tier.desc}</span>
                    </div>
                  ))}
                </div>
                {!bond.tier && bond.next && <small>还差 {bond.next.count - bond.count} 点</small>}
              </RailPopover>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
