// 右栏顶部常驻的「小队羁绊」条: 只排羁绊图标(复用战斗羁绊栏的 BondSlot compact),
// 档位 / 本队员贡献全部收进悬浮详情; **当前队员**贡献了点数的那几枚额外亮起顶边 + 外发光。
// ★ 计数口径与开战快照同一份(townStore.bondCountsOf + 城镇 party), 这里只画结论。
import { useMemo } from "react";
import { activeBonds, BOND_DEFS, nextTier } from "@/data/roster/bonds";
import { bondCountsOf, type CharacterState } from "@/store/town/townStore";
import { BondSlot } from "@/ui/common/bond/BondSlot";
import { BondEffect } from "@/ui/common/bond/BondEffect";
import { RailPopover } from "@/ui/common/tooltip/RailPopover";
import { TooltipCard } from "@/ui/common/tooltip/TooltipCard";
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
      <div className={s.label} data-rail-item tabIndex={0}>
        <span className={s.index} aria-hidden="true">02</span>
        <div className={s.labelText}>
          <h3 className={s.title}>小队羁绊</h3>
          <span className={s.summary}>
            已激活 <b>{activeCount}</b> / {bonds.length}
          </span>
        </div>
        <RailPopover side="bottom">
          <TooltipCard title="小队羁绊详情" accent="var(--k)"
            desc={bonds.length === 0 ? "当前小队尚无羁绊词条。装备带有羁绊词条的物品后，小队点数达到对应门槛即可激活效果。" : undefined}>
            {bonds.length > 0 && <div className={s.details}>
              {bonds.map(({ def, count, mine, tierIndex, next }) => <div key={def.id}>
                <p className={s.detailHeading}>{def.name} · {count} 点 · {tierIndex < 0 ? "未激活" : `第 ${tierIndex + 1} 档`}</p>
                <BondEffect def={def} tierIndex={tierIndex} />
                <p className={s.detailNote}>本队员贡献 {mine} 点{next ? `，距离下一档还差 ${next.count - count} 点` : "，已达到最高档"}</p>
              </div>)}
            </div>}
          </TooltipCard>
        </RailPopover>
      </div>

      {bonds.length === 0 ? (
        <div className={s.empty} data-rail-item tabIndex={0}>
          小队装备上暂无羁绊词条
          <RailPopover side="bottom">
            <TooltipCard title="小队羁绊详情" accent="var(--k)"
              desc="当前小队尚无羁绊词条。装备带有羁绊词条的物品后，小队点数达到对应门槛即可激活效果。" />
          </RailPopover>
        </div>
      ) : (
        <div className={s.list}>
          {bonds.map(({ def, count, mine, tierIndex, next }) => (
            <BondSlot
              key={def.id}
              def={def}
              count={count}
              tierIndex={tierIndex}
              next={next}
              iconSize={58}
              variant="compact"
              popoverSide="bottom"
              tooltipNote={mine > 0 ? `本队员贡献 ${mine} 点` : undefined}
              className={mine > 0 ? s.mine : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}
