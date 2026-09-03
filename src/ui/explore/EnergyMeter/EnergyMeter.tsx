// 净化粒子仪表 —— 探索页右上角的读数, 取代上一版的「区域危险度」DangerMeter。
//
// 净化粒子是整个探索层**唯一**的难度轴与时限(设计文档 §4.1), 所以这块表要回答三个问题:
//   ① 现在是第几档、叫什么名字 —— 决定敌人强度与产出倍率;
//   ② 还剩多少点 —— 决定还能走几段;
//   ③ **这一段走完会不会跌档** —— 这是玩家真正要做的决策, 故用最强的提示(§11.2)。
//
// ⚠ 档位的真相点只有 explore/session.ts 的 energyTier(), 这里不重算阈值。

import { energyTier, toNextTier } from "@/explore/session";
import { ENERGY_TIERS } from "@/explore/rules";
import { RailPopover } from "@/ui/common/RailPopover";
import { cx } from "@/ui/common/cx";
import s from "./EnergyMeter.module.css";

interface Props {
  energy: number;
  /** 本段结算后的能量(projectedEnergy)。与当前档不同时显示跨档预警。 */
  projected?: number;
}

export function EnergyMeter({ energy, projected }: Props) {
  const cur = energyTier(energy);
  const after = energyTier(projected ?? energy);
  const crossing = projected != null && after.tier > cur.tier;
  const gap = toNextTier(energy);

  return (
    <div className={s["energy-meter"]} style={{ ["--energy-color" as string]: cur.color }}>
      <div className={s["em-head"]}>
        <span className={s["em-label"]}>净化粒子</span>
        <span className={s["em-value"]}>
          {energy}
          <em>/100</em>
        </span>
      </div>

      {/* 5 格档位条。⚠ 顺序按「档位 1 在左」渲染, 而 ENERGY_TIERS 是按 min 降序存的,
          故这里照数组原序即可 —— 第 1 格 = 充盈, 第 5 格 = 枯竭。
          已跌破的档位格点亮: 越往右亮得越多 = 情况越糟, 与「条越长越好」的直觉相反,
          所以格子用档位色而不是统一色, 靠颜色本身传达好坏。 */}
      <div className={s["em-bars"]}>
        {ENERGY_TIERS.map((t) => {
          const reached = cur.tier >= t.tier;
          const willReach = !reached && after.tier >= t.tier;
          return (
            <div
              key={t.tier}
              className={cx(
                s["em-bar"],
                reached && s["on"],
                willReach && s["ghost"],
              )}
              style={{ ["--bar-color" as string]: t.color }}
              data-rail-item=""
              tabIndex={0}
              aria-label={`${t.name} · 产出 ×${t.rewardMultiplier.toFixed(2)}`}
            >
              <RailPopover side="top">
                <strong>{t.name}</strong>
                <p>产出 ×{t.rewardMultiplier.toFixed(2)}</p>
              </RailPopover>
            </div>
          );
        })}
      </div>

      <div className={s["em-foot"]}>
        <span className={s["em-tier"]}>
          {cur.name} · 产出 ×{cur.rewardMultiplier.toFixed(2)}
        </span>
        {crossing ? (
          <span className={s["em-warn"]} style={{ ["--next-color" as string]: after.color }}>
            本段结束后跌入〈{after.name}〉
          </span>
        ) : (
          gap != null && <span className={s["em-gap"]}>再 −{gap} 跌档</span>
        )}
      </div>
    </div>
  );
}
