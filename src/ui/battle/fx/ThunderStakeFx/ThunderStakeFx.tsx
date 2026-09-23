import type { ProcFxPreset } from "@/ui/battle/choreo/animations";
import { cssVars, fxAnim, fxAnims } from "@/ui/battle/fx/shared/fxKit";
import {
  AFTER_CRACKLES,
  BOLTS,
  CRACKLES,
  STAKE_ANGLE,
  STAKE_BEAMS,
  STAKE_DEPTH,
  STAKE_ORIGIN,
  STAKE_PULSES,
  STAKE_SHARDS,
  STAKE_SPARKS,
  STAKE_VIEW,
  THUNDER_STAKE_TIMELINE as T,
} from "./thunderStakeGeometry";
import s from "./ThunderStakeFx.module.css";

// 雷殛钉矢: 紫电箭钉入目标 → 符环蓄压、电弧乱窜 → 符环内塌后引爆八向落雷。
// 纯 DOM + CSS 关键帧(电弧为内联 SVG 折线), 挂载即播; 时间轴按 preset.impactMs / T.impact 缩放。
export function ThunderStakeFx({ preset }: { preset: ProcFxPreset }) {
  const k = Math.max(preset.impactMs, 1) / T.impact;
  const at = (delay: number, duration: number) => fxAnim(delay * k, duration * k);
  const ats = (...segments: [number, number][]) =>
    fxAnims(...segments.map(([delay, duration]) => [delay * k, duration * k] as [number, number]));
  const flight = T.stick - T.release;
  const view = `${-STAKE_VIEW} ${-STAKE_VIEW} ${STAKE_VIEW * 2} ${STAKE_VIEW * 2}`;

  return (
    <div
      className={s.wrap}
      style={cssVars({
        "--angle": `${STAKE_ANGLE}deg`,
        "--origin": `${STAKE_ORIGIN}px`,
        "--depth": `${STAKE_DEPTH}px`,
      })}
    >
      <div className={s.charge} style={ats([T.charge, T.release - T.charge], [T.release, 160])} />
      <div className={s.trail} style={ats([T.release, flight], [T.stick, 260])} />

      <div className={s.aura} style={ats([T.stick, T.impact - T.stick], [T.impact, 200])} />
      <div className={s.rune} style={ats([T.rune, T.collapse - T.rune], [T.collapse, T.impact - T.collapse])}>
        <span className={s["rune-ring"]} />
        <span className={s["rune-glyphs"]} style={at(T.rune, T.total)} />
        <span className={s["rune-inner"]} style={at(T.rune, T.total)} />
      </div>
      {STAKE_PULSES.map((pulse) => (
        <span key={pulse.delay} className={s.pulse} style={at(pulse.delay, pulse.duration)} />
      ))}

      <div
        className={s.arrow}
        style={ats(
          [T.release, flight],
          [T.stick, 320],
          [T.stick, T.impact - T.stick],
          [T.impact, 140],
        )}
      >
        <span className={s["arrow-glow"]} />
        <span className={s["arrow-body"]} />
        <span className={s["arrow-core"]} style={at(0, 90)} />
      </div>
      <div className={s["stick-flash"]} style={at(T.stick, 220)} />
      <div className={s["stick-ring"]} style={at(T.stick, 300)} />

      <svg className={s.arcs} viewBox={view} width={STAKE_VIEW * 2} height={STAKE_VIEW * 2} aria-hidden="true">
        {CRACKLES.map((crackle, index) => (
          <polyline
            key={`crackle-${index}`}
            className={s.crackle}
            points={crackle.points}
            style={{ ...at(crackle.delay, crackle.duration), strokeWidth: crackle.width }}
          />
        ))}
        {BOLTS.map((bolt, index) => (
          <g key={`bolt-${index}`}>
            <polyline
              className={s.bolt}
              points={bolt.main}
              pathLength={1}
              style={{ ...at(T.impact + bolt.delay, 380), strokeWidth: bolt.width }}
            />
            <polyline
              className={s.bolt}
              points={bolt.branch}
              pathLength={1}
              style={{ ...at(T.impact + bolt.delay + 40, 300), strokeWidth: bolt.width * 0.6 }}
            />
          </g>
        ))}
        {AFTER_CRACKLES.map((crackle, index) => (
          <polyline
            key={`after-${index}`}
            className={s.crackle}
            points={crackle.points}
            style={{ ...at(crackle.delay, crackle.duration), strokeWidth: 1.6 }}
          />
        ))}
      </svg>

      <div className={s.blast} style={at(T.impact, 320)} />
      <div className={s.shock} style={at(T.impact, 440)} />
      <div className={s["shock-wide"]} style={at(T.impact + 30, 560)} />
      <div className={s.haze} style={at(T.impact + 60, T.total - T.impact - 60)} />
      {STAKE_BEAMS.map((beam, index) => (
        <span
          key={`beam-${index}`}
          className={s.beam}
          style={{
            ...at(T.impact + beam.delay, 280),
            width: beam.length,
            ...cssVars({ "--beam-angle": `${beam.angle}deg` }),
          }}
        />
      ))}
      {STAKE_SHARDS.map((shard, index) => (
        <span
          key={`shard-${index}`}
          className={s.shard}
          style={{
            ...at(T.impact + shard.delay, 460),
            left: shard.x,
            width: shard.width,
            ...cssVars({
              "--dx": `${shard.dx}px`,
              "--dy": `${shard.dy}px`,
              "--rot": `${shard.rotate}deg`,
            }),
          }}
        />
      ))}
      {STAKE_SPARKS.map((spark, index) => (
        <span
          key={`spark-${index}`}
          className={s.spark}
          style={{
            ...at(T.impact + spark.delay, spark.duration),
            width: spark.size,
            height: spark.size,
            ...cssVars({ "--dx": `${spark.dx}px`, "--dy": `${spark.dy}px` }),
          }}
        />
      ))}
    </div>
  );
}
