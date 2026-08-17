import { useMemo, type CSSProperties } from "react";
import { activeBonds, BOND_DEFS, nextTier } from "@/data/bonds";
import type { CharacterState } from "@/store/townStore";
import { bondCountsOf } from "@/store/townStore";
import { BondIcon } from "@/ui/common/BondIcon";
import { cx } from "@/ui/common/cx";
import s from "./SquadBondBar.module.css";

export function SquadBondBar({
  characters,
  party,
  className,
  style,
}: {
  characters: Record<string, CharacterState>;
  party: string[];
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
    <aside className={cx(s.bar, className)} style={style} aria-label="队伍羁绊">
      {bonds.length === 0 ? (
        <p className={s.empty}>队伍装备上还没有羁绊词条 —— 去仓库给上阵队员换点带词条的装备</p>
      ) : (
        <div className={s.items}>
          {bonds.map(({ def, count, tierIndex }) => {
            const next = nextTier(def, count);
            const activated = tierIndex >= 0;
            return (
              <div
                key={def.id}
                className={cx(s.chip, activated && s.active)}
                style={{ "--bond-color": def.color } as CSSProperties}
                tabIndex={0}
                role="group"
                aria-label={`${def.name}，${count} 点${activated ? `，Lv.${tierIndex + 1}` : "，未激活"}`}
              >
                <BondIcon bondId={def.id} className={s.icon} />
                <span className={s.name}>{def.name}</span>
                <span className={s.count}>{count} 点</span>
                <span className={s.level}>{activated ? `Lv.${tierIndex + 1}` : `还差 ${next ? next.count - count : 0} 点`}</span>
                <div className={s.pop}>
                  <div className={s.popHead}>
                    <strong>{def.name}</strong>
                    <span>
                      {count} 点 · {activated ? `Lv.${tierIndex + 1}` : "未激活"}
                    </span>
                  </div>
                  <p>{def.desc}</p>
                  <div className={s.tiers}>
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}