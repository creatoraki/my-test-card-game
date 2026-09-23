// 净化粒子悬浮详情: 当前档位的收益加成与敌人强化。外观走统一的 TooltipCard。

import { TooltipCard, type TooltipNote } from "@/ui/common/tooltip/TooltipCard";
import { energyTierInfo } from "./energyTierInfo";
import s from "./EnergyTierDetail.module.css";

export function EnergyTierDetail({ energy }: { energy: number }) {
  const info = energyTierInfo(energy);
  const notes: TooltipNote[] = [
    info.toNext === null
      ? { text: "已是最低档位", tone: "bad" }
      : { text: `再消耗 ${info.toNext} 点粒子将跌入下一档`, tone: "muted" },
    { text: "粒子越少，收益越高，敌人也越强", tone: "muted" },
  ];

  return (
    <TooltipCard title={`粒子档位 · ${info.name}`} accent={info.color} notes={notes}>
      <dl className={s.rows}>
        <div className={s.row}>
          <dt>收益加成</dt>
          <dd>{info.bonusPct > 0 ? <b>+{info.bonusPct}%</b> : <span className={s.none}>无</span>}</dd>
        </div>
        <p className={s.sub}>作用于掉落、经验与居民积分</p>
        <div className={s.row}>
          <dt>敌人强化</dt>
          <dd>{info.overloadStacks > 0 ? <b>过载 {info.overloadStacks} 层</b> : <span className={s.none}>无</span>}</dd>
        </div>
        {info.overloadStacks > 0 && <p className={s.sub}>
          攻击力 <b>+{info.attackBonus}</b>　格挡 <b>+{info.blockBonusPct}%</b>
        </p>}
      </dl>
    </TooltipCard>
  );
}
