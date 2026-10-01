// 右栏顶部常驻的「小队羁绊」条: 只排羁绊图标, 点数 / 档位 / 本队员贡献全部收进悬浮详情。
// 图标本身只带两种状态: 未激活压暗; **当前队员**贡献了点数的那几枚亮起顶边 + 外发光。
// ★ 计数口径与开战快照同一份(townStore.bondCountsOf + 城镇 party), 这里只画结论。
import { useMemo, type CSSProperties } from "react";
import { activeBonds, BOND_DEFS, nextTier } from "@/data/roster/bonds";
import { bondCountsOf, type CharacterState } from "@/store/town/townStore";
import { BondTooltip } from "@/ui/common/bond/BondTooltip";
import { ArcanaIcon, getArcanaAccent } from "@/ui/common/icon/ArcanaIcon";
import { RailPopover } from "@/ui/common/tooltip/RailPopover";
import { cx } from "@/ui/common/shared/cx";
import s from "./SquadBondStrip.module.css";

interface Props {
  characters: Record<string, CharacterState>;
  party: string[];
  charId: string;
}

export function SquadBondStrip({ characters, party, charId }: Props) {
  const bonds = useMemo(() => {
    const counts = bondCountsOf(characters, party);
    const mine = bondCountsOf(characters, [charId]);
    const active = new Map(activeBonds(counts).map((entry) => [entry.def.id, entry.tierIndex]));
    return Object.values(BOND_DEFS)
      .map((def) => {
        const count = counts[def.id] ?? 0;
        return { def, count, mine: mine[def.id] ?? 0, tierIndex: active.get(def.id) ?? -1, next: nextTier(def, count) };
      })
      .filter((bond) => bond.count > 0);
  }, [characters, party, charId]);
  const activeCount = bonds.filter((bond) => bond.tierIndex >= 0).length;

  return (
    <section className={s.strip} aria-label="小队羁绊">
      <div className={s.label}>
        <span className={s.index} aria-hidden="true">02</span>
        <div className={s.labelText}>
          <h3 className={s.title}>小队羁绊</h3>
          <span className={s.summary}>
            已激活 <b>{activeCount}</b> / {bonds.length}
          </span>
        </div>
      </div>

      {bonds.length === 0 ? (
        <p className={s.empty}>小队装备上暂无羁绊词条</p>
      ) : (
        <div className={s.list}>
          {bonds.map(({ def, count, mine, tierIndex, next }) => {
            const accent = getArcanaAccent(def.id) ?? def.color;
            const inactive = tierIndex < 0;
            return (
              <div
                key={def.id}
                className={cx(s.bond, mine > 0 && s.mine)}
                style={{ "--bond": accent } as CSSProperties}
                data-inactive={inactive || undefined}
                data-rail-item
                tabIndex={0}
                role="group"
                aria-label={`${def.name}，${count} 点${inactive ? "，未激活" : `，第 ${tierIndex + 1} 档`}`}
              >
                <ArcanaIcon id={def.id} size={56} bare inactive={inactive} accent={accent} />
                <RailPopover side="bottom">
                  <BondTooltip
                    def={def}
                    count={count}
                    tierIndex={tierIndex}
                    next={next}
                    extraNote={mine > 0 ? `本队员贡献 ${mine} 点` : undefined}
                  />
                </RailPopover>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
