// ★ 进行中的挑战契约 ★ —— 探索页右上读数列里的倒计时砖(见 explore/types.ts ActiveTrial)。
//
// 这块砖存在的唯一理由: 挑战是本作**唯一跨轮生效**的东西。
// 玩家在第 N 轮接下它, 真正付代价的却是第 N 与第 N+1 轮的战斗 ——
// 如果屏幕上没有一直挂着「还剩几轮」和「扣的是哪一项」, 那两场仗打得莫名其妙。
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
  /** 当前轮号 —— 剩余轮数由它与 untilRound 现算, 不在会话里存第二份。 */
  round: number;
  /** 落点浮层开着时四角 HUD 一起后退(与 EnergyLamp 同一口径)。 */
  recede?: boolean;
}

export function TrialGauge({ trials, round, recede = false }: Props) {
  if (!trials.length) return null;

  return (
    <div className={s["trial-list"]} aria-label="进行中的挑战">
      {trials.map((trial) => {
        // 含当前轮: 第 N 轮接下、untilRound = N + 1 ⇒ 当轮显示「剩余 2 轮」。
        const left = Math.max(0, trial.untilRound - round + 1);
        return (
          <div
            key={trial.uid}
            className={cx(s["trial"], recede && s["is-recede"])}
            data-rail-item=""
            tabIndex={0}
            aria-label={`挑战 ${trial.name}：${trial.penaltyDesc}，剩余 ${left} 轮战斗`}
          >
            <span className={s["trial-kicker"]}>挑战 · 剩余 {left} 轮</span>
            <span className={s["trial-name"]}>{trial.name}</span>
            <span className={s["trial-penalty"]}>{trial.penaltyDesc}</span>
            <RailPopover side="bottom-right" className={s["trial-tip"]}>
              <strong>{trial.name}</strong>
              <p>
                第 {trial.startRound} 轮接下的契约。<b>{trial.penaltyDesc}</b>
                ，作用于第 {trial.startRound} 至第 {trial.untilRound} 轮的全部战斗。
              </p>
              <p>
                第 {trial.untilRound} 轮的推进战斗结束后自动解除，并结算一份奖励（物资或小队增益）。
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
