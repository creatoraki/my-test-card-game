import { useMemo, type CSSProperties } from "react";
import { activeBonds, BOND_DEFS, nextTier } from "@/data/bonds";
import type { CharacterState } from "@/store/townStore";
import { bondCountsOf } from "@/store/townStore";
import { BondShowcase } from "@/ui/common/BondShowcase";
import { cx } from "@/ui/common/cx";
import s from "./SquadBondBar.module.css";

export function SquadBondBar({
  characters,
  party,
  align = "end",
  iconSize = 96,
  className,
  style,
}: {
  characters: Record<string, CharacterState>;
  party: string[];
  align?: "start" | "end";
  iconSize?: number;
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
            return (
              <BondShowcase
                key={def.id}
                def={def}
                count={count}
                tierIndex={tierIndex}
                next={next}
                iconSize={iconSize}
                popoverSide="bottom-right"
              />
            );
          })}
        </div>
      )}
    </aside>
  );
}