// 净化粒子能量灯 —— 探索页右上角的读数, 取代上一版的 EnergyMeter 档位条。
//
// 一眼要读到两件事:
//   ① 左边的数字 = 现在还剩多少点(它就是这一局的倒计时);
//   ② 右边的装置图 = 现在处在第几档 —— 5 张图构图完全重叠, 只有发光色不同,
//      所以跌档时画面上只有「光变色」这一件事在动, 这正是要被看见的那件事。
//
// ⚠ 档位阈值的真相点只有 explore/session.ts 的 energyTier(), 这里不重算。
// ⚠ 本组件挂在 .explore-stage 内部, 尺寸全是「设计 px」(1920×1080 画布), 不写 vw/vh。

import { energyTier, toNextTier } from "@/explore/session";
import { EXPLORE_RULES, ENERGY_TIERS } from "@/explore/rules";
import { getStatusDef } from "@/engine";
import { ENERGY_LAMP_ART, energyLampGlow } from "@/ui/art/energyLampArt";
import { cx } from "@/ui/common/cx";
import { GlassLantern } from "@/ui/common/GlassLantern";
import { RailPopover } from "@/ui/common/RailPopover";
import s from "./EnergyLamp.module.css";

interface Props {
  energy: number;
  /** 本段结算后的能量(projectedEnergy)。跌档时给一次跨档预警。 */
  projected?: number;
  recede?: boolean;
}

export function EnergyLamp({ energy, projected, recede = false }: Props) {
  const cur = energyTier(energy);
  const after = energyTier(projected ?? energy);
  const crossing = projected != null && after.tier > cur.tier;
  const previous = ENERGY_TIERS.find((tier) => tier.tier === cur.tier - 1);
  const next = ENERGY_TIERS.find((tier) => tier.tier === cur.tier + 1);
  const rangeTop = previous ? previous.min - 1 : EXPLORE_RULES.energyMax;
  const pointsToNext = toNextTier(energy);
  const dangers = [
    ...(cur.extraEnemies > 0 ? [`战斗追加 ${cur.extraEnemies} 名敌人`] : []),
    ...cur.enemyStatuses.map((status) => {
      const name = getStatusDef(status.id)?.name ?? status.id;
      return `敌方全体${name} +${status.stacks}`;
    }),
    ...(cur.castTickDelta < 0 ? [`敌方先手 +${Math.abs(cur.castTickDelta)}`] : []),
  ];

  return (
    <div
      className={s["energy-lamp"]}
      data-rail-item
      tabIndex={0}
      aria-label={`净化粒子 ${energy} 点，${cur.name}`}
      style={{ ["--energy-color" as string]: cur.color }}
    >
      <div
        className={s["el-lamp"]}
        aria-hidden
      >
        <GlassLantern
          color={energyLampGlow(cur.tier)}
          intensity={crossing ? 1.65 : 1}
          size={160}
          paused={recede}
          fallbackSrc={ENERGY_LAMP_ART}
          className={cx(s["el-lantern"], recede && s["is-recede"])}
        />
      </div>
      <div className={cx(s["el-readout"], recede && s["is-recede"])}>
        {/* <span className={s["el-label"]}>净化粒子</span> */}
        {/* key 挂数值: 每次变动重挂一次, 走一遍跳数动画 —— 这是全屏最该被看见的变化 */}
        <strong className={s["el-value"]} key={energy}>
          {energy}
        </strong>
      </div>
      <RailPopover side="bottom-right">
        <div className={s["el-tip-head"]}>
          <strong>{cur.name}</strong>
          <span>能量 {cur.min}-{rangeTop}</span>
        </div>
        {pointsToNext != null && next && (
          <p className={s["el-tip-next"]}>
            再掉 {pointsToNext} 点跌入「{next.name}」
          </p>
        )}
        <div className={s["el-tip-section"]}>
          <b>掉落系数 K_energy ×{cur.rewardMultiplier.toFixed(2)}</b>
          <p>同时作用于经验、居民积分与实物掉落</p>
        </div>
        <div className={s["el-tip-section"]}>
          <b>危险明细</b>
          <ul className={s["el-tip-list"]}>
            {(dangers.length ? dangers : ["无额外惩罚"]).map((danger) => (
              <li key={danger}>{danger}</li>
            ))}
          </ul>
        </div>
      </RailPopover>
    </div>
  );
}