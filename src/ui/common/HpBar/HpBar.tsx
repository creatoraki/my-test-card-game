import { useEffect, useRef, useState } from "react";
import { cx } from "@/ui/common/cx";
import s from "./HpBar.module.css";

// 敌我共用的血条。CombatantView(场上敌人立绘下方) 与 AllyBar(我方队伍卡底边) 都走这里 ——
// 材质、分档配色、流光/火花/迸溅的时序只写一份, 两边表现必然一致。
//
// 视觉分三层能量:
//   .hp-flow   填充区内持续向右流动的斜向光带(质感, 不承载信息)
//   .hp-edge   填充末端的白热核心 + 外溢辉光 = 血量的"游标"
//   .hp-sparks 掉血瞬间在扣掉的那一段上迸溅的火花(一次性)
//
// ⚠ .hp-bar 自带 overflow:hidden, 我方那侧的队伍卡框还额外裁一次 ⇒ 粒子飞不出条外。
// 所以火花的位移一律压在 8px 以内并快速淡出, 被裁到也看不出断口。

// 分档阈值(%): 与 HpBar.module.css 的 .hp-ok / .hp-warn / .hp-low 三套配色一一对应。
const TIER_OK = 60;
const TIER_WARN = 30;

const SPARK_COUNT = 8;
const SPARK_LIFE = 700; // ms: 迸溅层的挂载时长, 须 ≥ 关键帧总时长(520ms + 最大错峰)

// 确定性伪随机: 同一发迸溅的同一颗火花永远得到同一个数, 重渲染不会让粒子中途跳位。
function rand(seq: number, i: number, salt: number): number {
  const x = Math.sin(seq * 12.9898 + i * 78.233 + salt * 37.719) * 43758.5453;
  return x - Math.floor(x);
}

interface Burst {
  seq: number;
  from: number; // 掉血前的百分比
  to: number; // 掉血后的百分比
}

interface Props {
  hp: number;
  maxHp: number;
  name: string;
  flush?: boolean; // 我方队伍卡的贴底变体: 去描边/斜切角, 与卡框底边一体化
}

export function HpBar({ hp, maxHp, name, flush }: Props) {
  const hpPct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const tier = hpPct > TIER_OK ? "hp-ok" : hpPct > TIER_WARN ? "hp-warn" : "hp-low";

  // 掉血迸溅。刻意盯 hp 的变化而非上游的 hit 特效: 中毒/流血这类非命中掉血也该迸溅,
  // 且组件自包含 —— 调用方不必多传一个 prop。
  const prevHp = useRef(hp);
  const seqRef = useRef(0);
  const [burst, setBurst] = useState<Burst | null>(null);

  useEffect(() => {
    const prev = prevHp.current;
    prevHp.current = hp;
    if (hp >= prev) return; // 只在掉血时迸溅; 治疗/满血重置不触发
    seqRef.current += 1;
    setBurst({
      seq: seqRef.current,
      from: Math.max(0, Math.min(100, (prev / maxHp) * 100)),
      to: hpPct,
    });
  }, [hp, maxHp, hpPct]);

  // 迸溅层的卸载单独一个 effect: 挂在上面那个(依赖 hp)里的话, 火花还没烧完就又掉一次血/被治疗时,
  // 清理函数会把定时器撤掉而新一轮又提前 return, 迸溅层就永远留在 DOM 里了。
  useEffect(() => {
    if (!burst) return;
    const t = window.setTimeout(() => setBurst(null), SPARK_LIFE);
    return () => window.clearTimeout(t);
  }, [burst]);

  return (
    // --hp-pct 同时驱动填充宽度与端头层的横向位置。端头刻意**不是** .hp-fill 的子元素:
    // 填充为了裁住流光带带了 overflow:hidden, 端头若在里面, 辉光就没法往右溢进空槽。
    <div
      className={cx(s["hp-bar"], s[tier], flush && s["hp-flush"])}
      style={{ "--hp-pct": `${hpPct}%` } as React.CSSProperties}
    >
      {/* 扣血拖影: 残影层延迟收缩, 主填充速缩后它慢半拍追上(见 HpBar.module.css .hp-ghost) */}
      <div className={s["hp-ghost"]} style={{ width: `${hpPct}%` }} />

      <div className={s["hp-fill"]}>
        <span className={s["hp-flow"]} />
      </div>
      {/* 血量归零就没有"游标"可言了 —— 否则尸体的血条左端还挂着一颗跳动的亮点 */}
      {hpPct > 0 && (
        <>
          <span className={s["hp-edge"]} />
          <span className={s["hp-motes"]} />
        </>
      )}

      {/* 迸溅层: 只覆盖刚扣掉的那一段 [to, from]。key 强制每发重新挂载以重放关键帧。 */}
      {burst && burst.from > burst.to && (
        <div
          className={s["hp-sparks"]}
          key={burst.seq}
          style={{ left: `${burst.to}%`, width: `${burst.from - burst.to}%` }}
          aria-hidden
        >
          {Array.from({ length: SPARK_COUNT }, (_, i) => (
            <i
              key={i}
              className={s["hp-spark"]}
              style={
                {
                  "--sl": `${rand(burst.seq, i, 1) * 100}%`, // 在扣血段内的起始横向位置
                  "--sx": `${(rand(burst.seq, i, 2) - 0.35) * 14}px`,
                  "--sy": `${-3 - rand(burst.seq, i, 3) * 7}px`,
                  "--sd": `${rand(burst.seq, i, 4) * 110}ms`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      <span className={s["cmb-name"]}>{name}</span>
      <span className={s["hp-text"]}>
        {Math.max(0, hp)}/{maxHp}
      </span>
    </div>
  );
}
