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
import { EXPLORE_RULES } from "@/explore/rules";
import { energyLampArt, energyLampGlow } from "@/ui/art/energyLampArt";
import { cx } from "@/ui/common/cx";
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

  return (
    <div className={s["energy-lamp"]} style={{ ["--energy-color" as string]: cur.color }}>
 
      {/* 5 张图构图完全重叠 ⇒ key 挂 tier, 换档时新图淡入盖住旧图, 看起来就是同一个装置换了光色。
          ⚠ 装饰性图像, aria-hidden + 空 alt; 数值与档名已由左侧文字读屏播完。 */}
      <div
        className={s["el-lamp"]}
        style={{ ["--el-glow" as string]: energyLampGlow(cur.tier) }}
        aria-hidden
      >
        <span className={cx(s["el-halo"], recede && s["is-recede"])} key={cur.tier} />
        <img
          className={cx(s["el-lamp-img"], recede && s["is-recede"], crossing && s["is-warning"])}
          key={cur.tier}
          src={energyLampArt(cur.tier)}
          alt=""
          draggable={false}
        />
      </div>
      <div className={cx(s["el-readout"], recede && s["is-recede"])}>
        {/* <span className={s["el-label"]}>净化粒子</span> */}
        {/* key 挂数值: 每次变动重挂一次, 走一遍跳数动画 —— 这是全屏最该被看见的变化 */}
        <strong className={s["el-value"]} key={energy}>
          {energy}
        </strong>
      </div>
    </div>
  );
}