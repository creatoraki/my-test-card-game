import type { CSSProperties } from "react";
import { ENERGY_TIERS } from "@/explore/core/exploreRules";
import { EnergyReadout } from "@/ui/explore/EnergyReadout/EnergyReadout";
import { energyTierInfo } from "@/ui/explore/EnergyReadout/energyTierInfo";
import s from "./EnergyTierShowcase.module.css";

/** 直接复用正式粒子组件与档位配置，演示不会修改远征状态。 */
export function EnergyTierShowcase() {
  return <main className={s.showcase}>
    <header className={s.header}>
      <h1>净化粒子 · 六档演示</h1>
      <p>悬停或聚焦粒子面板，查看正式的收益与敌人强化提示。</p>
    </header>
    <section className={s.grid} aria-label="六档粒子颜色与收益对比">
      {ENERGY_TIERS.map((tier, index) => {
        const upper = index === 0 ? 100 : ENERGY_TIERS[index - 1].min - 1;
        const info = energyTierInfo(upper);
        const range = upper === tier.min ? `${upper} 粒子` : `${tier.min}～${upper} 粒子`;
        return <article key={tier.tier} className={s.sample} style={{ "--tier-color": tier.color } as CSSProperties}>
          <header className={s.heading}>
            <h2>{tier.name}</h2>
            <span>{range}</span>
          </header>
          <div className={s.preview}><EnergyReadout energy={upper} /></div>
          <dl className={s.details}>
            <div><dt>收益倍率</dt><dd>{tier.rewardMultiplier} 倍（+{info.bonusPct}%）</dd></div>
            <div><dt>敌方过载</dt><dd>{info.overloadStacks} 层</dd></div>
            <div><dt>攻击力加成</dt><dd>+{info.attackBonus}</dd></div>
            <div><dt>格挡加成</dt><dd>+{info.blockBonusPct}%</dd></div>
          </dl>
        </article>;
      })}
    </section>
  </main>;
}
