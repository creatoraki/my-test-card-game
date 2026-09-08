// 净化粒子能量灯 —— 探索页右上角的读数, 取代上一版的 EnergyMeter 档位条。
//
// 一眼要读到两件事:
//   ① 左边的数字 = 现在还剩多少点(它就是这一局的倒计时);
//   ② 右边的装置图 = 现在处在第几档 —— 5 张图构图完全重叠, 只有发光色不同,
//      所以跌档时画面上只有「光变色」这一件事在动, 这正是要被看见的那件事。
//
// ⚠ 档位阈值的真相点只有 explore/session.ts 的 energyTier(), 这里不重算。
// ⚠ 本组件挂在 .explore-stage 内部, 尺寸全是「设计 px」(1920×1080 画布), 不写 vw/vh。

import { energyTier } from "@/explore/session";
import { getStatusDef } from "@/engine";
import { energyLampGlow, energyLampIntensity } from "@/ui/art/energyLampArt";
import { cx } from "@/ui/common/cx";
import { GlassHourglass } from "@/ui/common/GlassHourglass";
import { RailPopover } from "@/ui/common/RailPopover";
import { useCountUp } from "@/ui/hooks/useCountUp";
import s from "./EnergyLamp.module.css";

interface Props {
  energy: number;
  /** 本段结算后的能量(projectedEnergy)。跌档时给一次跨档预警。 */
  projected?: number;
  recede?: boolean;
}

export function EnergyLamp({ energy, projected, recede = false }: Props) {
  const shownEnergy = useCountUp(energy, 0, 360);
  const cur = energyTier(energy);
  const after = energyTier(projected ?? energy);
  const crossing = projected != null && after.tier > cur.tier;
  const dangers = [
    ...cur.enemyStatuses.map((status) => {
      const name = getStatusDef(status.id)?.name ?? status.id;
      return `敌方全体${name} +${status.stacks}`;
    }),
  ];

  return (
    <div
      className={s["energy-lamp"]}
      data-rail-item
      tabIndex={0}
      aria-label={`净化粒子 ${energy} 点，${cur.name}`}
      style={{ ["--energy-color" as string]: energyLampGlow(cur.tier) }}
    >
      <div
        className={s["el-lamp"]}
        aria-hidden
      >
        <GlassHourglass
          color={energyLampGlow(cur.tier)}
          intensity={energyLampIntensity(cur.tier) * (crossing ? 1.2 : 1)}
          width={180}
          height={250}
          paused={recede}
          className={cx(s["el-lantern"], recede && s["is-recede"])}
        />
      </div>
      <div className={cx(s["el-readout"], recede && s["is-recede"])}>
        {/* <span className={s["el-label"]}>净化粒子</span> */}
        {/* 数值从上一次读数滚到新读数, 让能量结算的变化在右上角有明确反馈。 */}
        <strong className={s["el-value"]}>
          {shownEnergy}
        </strong>
      </div>
      <RailPopover side="left" className={s["el-popover"]}>
        <div className={s["el-tip-head"]}>
          <strong>{cur.name}</strong>
        </div>
        <ul className={s["el-tip-list"]}>
          {(dangers.length ? dangers : ["无额外惩罚"]).map((danger) => (
            <li key={danger}>{danger}</li>
          ))}
        </ul>
      </RailPopover>
    </div>
  );
}
