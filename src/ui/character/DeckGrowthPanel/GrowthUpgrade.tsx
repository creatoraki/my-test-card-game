import type { Rarity } from "@/engine";
import { ExpShardGlyph } from "@/ui/character/glyphs/deckGlyphs";
import { GrowthGlyph } from "./GrowthGlyph";
import { GROWTH_RARITIES, percentage } from "./growthPresentation";
import s from "./GrowthUpgrade.module.css";

interface Props {
  level: number;
  cost: number | null;
  current: Record<Rarity, number>;
  next: Record<Rarity, number> | null;
  disabled: boolean;
  reason?: string;
  onUpgrade: () => void;
}

export function GrowthUpgrade({ level, cost, current, next, disabled, reason, onUpgrade }: Props) {
  return (
    <section className={s.column} aria-label="升级卡组">
      <h3 className={s.heading}><GrowthGlyph kind="upgrade" />升级</h3>
      <div className={s.levels}>
        <div className={s.badge}><span>当前</span><strong>{level}<small>级</small></strong></div>
        <span className={s.arrow} aria-hidden="true">»</span>
        <div className={s.badge} data-next><span>{next ? "下一等级" : "已达上限"}</span><strong>{next ? level + 1 : level}<small>级</small></strong></div>
      </div>
      <div className={s.rates} aria-label="升级后的抽取概率">
        {GROWTH_RARITIES.map(({ id, label }) => (
          <div key={id} className={s.rate} data-rarity={id}>
            <GrowthGlyph kind={id} /><span>{label}</span>
            <span>{percentage(current[id])}<span className={s.rateArrow}> → </span>{percentage(next?.[id] ?? current[id])}</span>
          </div>
        ))}
      </div>
      <div className={s.cost}><ExpShardGlyph /><span>升级消耗</span><strong>{cost ?? "已满级"}</strong>{cost != null && <span>经验</span>}</div>
      <p className={s.note}>{reason ?? "概率按当前可用卡池计算"}</p>
      <button type="button" className={s.action} disabled={disabled} onClick={onUpgrade}><GrowthGlyph kind="upgrade" />{cost == null ? "已满级" : "升级"}</button>
    </section>
  );
}
