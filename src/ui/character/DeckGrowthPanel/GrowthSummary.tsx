import type { Rarity } from "@/engine";
import { GrowthGlyph } from "./GrowthGlyph";
import { GROWTH_RARITIES, percentage } from "./growthPresentation";
import s from "./GrowthSummary.module.css";

interface Props {
  level: number;
  exp: number;
  cost: number | null;
  chances: Record<Rarity, number>;
  hasPool: Record<Rarity, boolean>;
}

export function GrowthSummary({ level, exp, cost, chances, hasPool }: Props) {
  const progress = cost == null ? 1 : Math.min(1, Math.max(0, exp / cost));
  return (
    <div className={s.summary}>
      <div className={s.levelBlock}>
        <GrowthGlyph kind="growth" />
        <div className={s.level}><span>等级</span><strong key={level}>{level}</strong></div>
        <div className={s.experience}>
          <span>经验</span>
          <div className={s.track} role="progressbar" aria-label="卡组升级经验" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-valuetext={cost == null ? `已满级，剩余经验 ${exp}` : `${exp} / ${cost}`}>
            <span className={s.fill} style={{ transform: `scaleX(${progress})` }} />
            <strong>{exp} / {cost ?? "满级"}</strong>
          </div>
        </div>
      </div>
      {GROWTH_RARITIES.map(({ id, label }) => (
        <div key={id} className={s.rarity} data-rarity={id} aria-label={`${label}抽取概率 ${percentage(chances[id])}${hasPool[id] ? "" : "，无可用卡池"}`}>
          <GrowthGlyph kind={id} />
          <div><span>{label}</span><strong>{percentage(chances[id])}</strong></div>
        </div>
      ))}
    </div>
  );
}
