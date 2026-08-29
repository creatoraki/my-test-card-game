// 锐利刀锋斩(keen-edge): 目标中心的局部坐标特效。
//
// 与 blade-slash 同族(冷蓝白刀光 + 残影 + 粒子聚拢 + 爆发层), 但走「锐化版」:
// 刀身更窄更硬、边缘高对比, 并且多出一整段**余鸣层** —— 因为它是按
// 锐利刀锋.wav 的完整包络做的, 撞击峰之后还有近 2 秒的金属颤鸣要接住。
//
// 时序全部由本文件通过 delay/duration 下发, 关键帧留在 CSS Modules 内;
// 速率由 --fx-rate 统一缩放(与 blade-slash / frost-shatter 的约定一致)。
import type { CSSProperties } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import {
  CONVERGE_MOTES,
  DUST_MOTES,
  EDGE_SPARKS,
  EDGE_WOUNDS,
  KEEN_BLADE_LENGTH,
  KEEN_SWIPE_MS,
  KEEN_TIMELINE,
  RESONANCE_LINES,
  RESONANCE_RIPPLES,
} from "./keenEdgeGeometry";
import s from "./KeenEdgeFx.module.css";

const timing = (milliseconds: number) =>
  `calc(${milliseconds}ms / max(var(--fx-rate, 1), 0.25))`;

export function KeenEdgeFx({ preset }: { preset: ProcFxPreset }) {
  // 爆点是唯一的锚: 前面的蓄势/横扫倒推, 后面的余鸣/衰减顺推。
  const impact = Math.max(preset.impactMs, 0);
  const swipeStart = impact - (KEEN_TIMELINE.impact - KEEN_TIMELINE.accel);
  const windupStart = impact - KEEN_TIMELINE.impact;
  const ringStart = impact + (KEEN_TIMELINE.ring - KEEN_TIMELINE.impact);
  const decayStart = impact + (KEEN_TIMELINE.decay - KEEN_TIMELINE.impact);

  const at = (start: number, delay: number, duration: number) => ({
    animationDelay: timing(start + delay),
    animationDuration: timing(duration),
  });

  return (
    <div
      className={s.wrap}
      style={{ ["--keen-len" as string]: `${KEEN_BLADE_LENGTH}px` } as CSSProperties}
    >
      {/* 预示线: 起势阶段先把刀轨「画」出来, 让 470ms 的爆点有铺垫。 */}
      <div
        className={s.tell}
        style={{
          animationDelay: `${timing(windupStart)}, ${timing(swipeStart)}`,
          animationDuration: `${timing(190)}, ${timing(120)}`,
        }}
      />

      {/* 刀痕: 横扫时展开, 余鸣期一直亮着, 直到消散才收。 */}
      <div
        className={s.scar}
        style={{
          animationDelay: `${timing(swipeStart)}, ${timing(KEEN_TIMELINE.fade)}`,
          animationDuration: `${timing(200)}, ${timing(KEEN_TIMELINE.total - KEEN_TIMELINE.fade)}`,
        }}
      />

      {/* 蓄光核: 起势聚能 → 爆点炸开。 */}
      <div
        className={s.core}
        style={{
          animationDelay: `${timing(windupStart)}, ${timing(impact)}`,
          animationDuration: `${timing(KEEN_TIMELINE.impact)}, ${timing(220)}`,
        }}
      />

      <div className={s.shock} style={at(impact, 0, 300)} />

      {/* 主刀光 + 双残影: 锐化版刀身更窄, 残影只压 36/72ms, 保持「快」。 */}
      <div className={s.blade} style={at(swipeStart, 0, KEEN_SWIPE_MS)} />
      <div className={s.ghost1} style={at(swipeStart, 36, KEEN_SWIPE_MS)} />
      <div className={s.ghost2} style={at(swipeStart, 72, KEEN_SWIPE_MS)} />

      {CONVERGE_MOTES.map((mote, index) => (
        <span
          key={`mote-${index}`}
          className={s.mote}
          style={{
            ...at(windupStart, mote.delay, KEEN_TIMELINE.impact - 60),
            top: `calc(50% + ${mote.n}px)`,
            width: mote.size,
            height: mote.size,
            ["--mote-start" as string]: `${mote.t}px`,
          } as CSSProperties}
        />
      ))}

      {EDGE_SPARKS.map((spark, index) => (
        <span
          key={`spark-${index}`}
          className={s.spark}
          style={{
            ...at(impact, spark.delay, 420),
            left: `calc(50% + ${spark.x}px)`,
            width: spark.size,
            height: spark.size,
            ["--spark-dx" as string]: `${spark.dx}px`,
            ["--spark-dy" as string]: `${spark.dy}px`,
          } as CSSProperties}
        />
      ))}

      {EDGE_WOUNDS.map((wound, index) => (
        <span
          key={`wound-${index}`}
          className={s.wound}
          style={{
            ...at(impact, wound.delay, 240),
            left: `calc(50% + ${wound.x}px)`,
            width: wound.length,
          }}
        />
      ))}

      {/* ── 余鸣层: 对应音效 570–1400ms 的金属颤鸣 ── */}
      {RESONANCE_RIPPLES.map((ripple, index) => (
        <span
          key={`ripple-${index}`}
          className={s.ripple}
          style={{
            ...at(ringStart, ripple.delay, ripple.duration),
            ["--ripple-scale" as string]: `${ripple.scale}`,
          } as CSSProperties}
        />
      ))}

      {RESONANCE_LINES.map((line, index) => (
        <span
          key={`line-${index}`}
          className={s.resonance}
          style={{
            ...at(ringStart, line.delay, line.duration),
            left: `calc(50% + ${line.x}px)`,
            top: `calc(50% + ${line.offset}px)`,
            width: line.length,
          }}
        />
      ))}

      {/* ── 衰减层: 对应音效 1400–2450ms 的缓降与消散 ── */}
      {DUST_MOTES.map((dust, index) => (
        <span
          key={`dust-${index}`}
          className={s.dust}
          style={{
            ...at(decayStart, dust.delay, dust.duration),
            left: `calc(50% + ${dust.x}px)`,
            top: `calc(50% + ${dust.y}px)`,
            width: dust.size,
            height: dust.size,
            ["--dust-drift" as string]: `${dust.drift}px`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
