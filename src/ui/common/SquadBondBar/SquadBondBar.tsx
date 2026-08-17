import { useMemo, type CSSProperties } from "react";
import { activeBonds, BOND_DEFS, nextTier } from "@/data/bonds";
import type { CharacterState } from "@/store/townStore";
import { bondCountsOf } from "@/store/townStore";
import { BondIcon } from "@/ui/common/BondIcon";
import { RailPopover } from "@/ui/common/RailPopover";
import { cx } from "@/ui/common/cx";
import s from "./SquadBondBar.module.css";

export function SquadBondBar({
  characters,
  party,
  align = "end",
  className,
  style,
}: {
  characters: Record<string, CharacterState>;
  party: string[];
  align?: "start" | "end";
  className?: string;
  style?: CSSProperties;
}) {
  const bonds = useMemo(() => {
    const counts = bondCountsOf(characters, party);
    const active = new Map(activeBonds(counts).map((entry) => [entry.def.id, entry.tierIndex]));
    return Object.values(BOND_DEFS)
      .map((def) => ({ def, count: counts[def.id] ?? 0, tierIndex: active.get(def.id) ?? -1 }))
      .filter((bond) => bond.count > 0);
  }, [characters, party]);

  return (
    <aside
      className={cx(s.bar, align === "start" ? s.alignStart : s.alignEnd, className)}
      style={style}
      aria-label="队伍羁绊"
    >
      {bonds.length === 0 ? (
        <p className={s.empty}>暂无羁绊词条</p>
      ) : (
        <div className={s.items}>
          {bonds.map(({ def, count, tierIndex }) => {
            const next = nextTier(def, count);
            const activated = tierIndex >= 0;
            return (
              <div
                key={def.id}
                className={cx(s.item, activated && s.active)}
                data-rail-item
                tabIndex={0}
                role="group"
                style={{ "--bond-color": def.color } as CSSProperties}
                aria-label={`${def.name}，${count} 点${activated ? `，Lv.${tierIndex + 1}` : "，未激活"}`}
              >
                <BondIcon bondId={def.id} className={s.icon} />
                <span className={s.count}>{count}</span>
                <div className={s.tiers} aria-hidden="true">
                  {def.tiers.map((tier, index) => (
                    <span
                      className={cx(
                        index < tierIndex && s.passed,
                        index === tierIndex && s.current,
                        index > tierIndex && s.locked,
                        tierIndex < 0 && next?.count === tier.count && s.nextTarget,
                      )}
                      key={tier.count}
                    >
                      {tier.count}
                    </span>
                  ))}
                </div>
                <RailPopover side="bottom-right" className={s.popover}>
                  <div className={s.popHead}>
                    <strong>{def.name}</strong>
                    <span>
                      {count} 点 · {activated ? `Lv.${tierIndex + 1}` : "未激活"}
                    </span>
                  </div>
                  <p>{def.desc}</p>
                  <div className={s.popTiers}>
                    {def.tiers.map((tier, index) => (
                      <div className={index === tierIndex ? s.tierActive : ""} key={tier.count}>
                        <b>
                          Lv.{index + 1} · {tier.count} 点
                        </b>
                        <span>{tier.desc}</span>
                      </div>
                    ))}
                  </div>
                  {!activated && next && <small>还差 {next.count - count} 点</small>}
                </RailPopover>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}