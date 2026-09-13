// ★ 进行中的挑战契约 ★ —— 探索页右上读数列里的倒计时砖(见 explore/types.ts ActiveTrial)。
//
// 这块砖存在的唯一理由: 挑战是本作**唯一跨房间生效**的东西。
// 玩家在某个房间接下它, 真正付代价的却是之后的两场战斗 ——
// 如果屏幕上没有一直挂着「还剩几场」和「扣的是哪一项」, 那两场仗打得莫名其妙。
// 所以它不是装饰, 是这套机制的记忆外挂。
//
// ⚠ 不用 backdrop-filter: 祖先 .expl-readout 自带 explRise 动画 ⇒ 它已经是 backdrop root,
//   玻璃在这里取不到背景图(与旁边的遗物栏同一条约束, 那块也是纯渐变底)。
// ⚠ 悬浮说明走 RailPopover, 不用 DOM 原生 title(项目规范)。

import type { ActiveTrial } from "@/explore/types";
import { RailPopover } from "@/ui/common/RailPopover";
import { cx } from "@/ui/common/cx";
import s from "./TrialGauge.module.css";

interface Props {
  trials: ActiveTrial[];
  /** 已打赢的战斗场数 —— 剩余场数由它与 untilBattles 现算, 不在会话里存第二份。 */
  battlesWon: number;
  /** 落点浮层开着时四角 HUD 一起后退(与 EnergyLamp 同一口径)。 */
  recede?: boolean;
}

export function TrialGauge({ trials, battlesWon, recede = false }: Props) {
  if (!trials.length) return null;

  return (
    <div className={s["trial-list"]} aria-label="进行中的挑战">
      {trials.map((trial) => {
        // 接下时 untilBattles = 已打赢场数 + 2 ⇒ 刚接下时显示「剩余 2 场」。
        const left = Math.max(0, trial.untilBattles - battlesWon);
        return (
          <div
            key={trial.uid}
            className={cx(s["trial"], recede && s["is-recede"])}
            data-rail-item=""
            tabIndex={0}
            aria-label={`挑战 ${trial.name}：${trial.penaltyDesc}，剩余 ${left} 场战斗`}
          >
            <span className={s["trial-kicker"]}>挑战 · 剩余 {left} 场</span>
            <span className={s["trial-name"]}>{trial.name}</span>
            <span className={s["trial-penalty"]}>{trial.penaltyDesc}</span>
            <RailPopover side="bottom-right" className={s["trial-tip"]}>
              <strong>{trial.name}</strong>
              <p>
                探索途中接下的契约。<b>{trial.penaltyDesc}</b>
                ，作用于接下来 {trial.untilBattles - trial.startBattles} 场战斗。
              </p>
              <p>
                第 {trial.untilBattles - trial.startBattles} 场战斗打赢后自动解除，并结算一份奖励（物资或小队增益）。
              </p>
              <p className={s["trial-tip-warn"]}>中途撤离或战斗失利都不会发放奖励。</p>
            </RailPopover>
          </div>
        );
      })}
    </div>
  );
}

export default TrialGauge;
