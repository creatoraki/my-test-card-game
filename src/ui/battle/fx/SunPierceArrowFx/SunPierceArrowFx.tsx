import type { ProcFxPreset } from "@/ui/battle/choreo/animations";
import { cssVars, fxAnim, fxAnims } from "@/ui/battle/fx/shared/fxKit";
import {
  CHARGE_MOTES,
  PIERCE_BEAMS,
  PIERCE_EMBERS,
  PIERCE_SPARKS,
  SONIC_RINGS,
  SUN_PIERCE_ANGLE,
  SUN_PIERCE_EXIT,
  SUN_PIERCE_ORIGIN,
  SUN_PIERCE_TIMELINE as T,
} from "./sunPierceGeometry";
import s from "./SunPierceArrowFx.module.css";

// 贯日矢: 瞄准线锁定 → 弓位蓄光 → 一箭贯穿目标并带出金色喷溅。
// 与 BladeSlashFx 同一套路: 纯 DOM + CSS 关键帧, 挂载即播, 换 key 重挂载即重播。
// 时间轴整体按 preset.impactMs / T.impact 缩放, 调节奏只改 preset。
export function SunPierceArrowFx({ preset }: { preset: ProcFxPreset }) {
  const k = Math.max(preset.impactMs, 1) / T.impact;
  const at = (delay: number, duration: number) => fxAnim(delay * k, duration * k);
  const ats = (...segments: [number, number][]) =>
    fxAnims(...segments.map(([delay, duration]) => [delay * k, duration * k] as [number, number]));
  const flight = T.impact - T.release;
  // 箭在 0% → 52% 飞完弓位到目标, 52% → 100% 贯穿飞出; 两段都是线性, 速度一致。
  const flyTotal = flight / 0.52;

  return (
    <div
      className={s.wrap}
      style={cssVars({
        "--angle": `${SUN_PIERCE_ANGLE}deg`,
        "--origin": `${SUN_PIERCE_ORIGIN}px`,
        "--exit": `${SUN_PIERCE_EXIT}px`,
      })}
    >
      <div className={s.aim} style={ats([T.aim, 280], [T.release, 200])} />
      <div className={s.lock} style={ats([T.aim, T.release - T.aim], [T.impact, 180])}>
        <span className={s["lock-ring"]} />
        {[0, 90, 180, 270].map((angle) => (
          <span key={angle} className={s["lock-tick"]} style={cssVars({ "--tick": `${angle}deg` })} />
        ))}
      </div>

      {CHARGE_MOTES.map((mote, index) => (
        <span
          key={`mote-${index}`}
          className={s.mote}
          style={{
            ...at(mote.delay, T.release - mote.delay),
            width: mote.size,
            height: mote.size,
            ...cssVars({ "--dx": `${mote.dx}px`, "--dy": `${mote.dy}px` }),
          }}
        />
      ))}
      <div className={s.charge} style={ats([T.charge, T.release - T.charge], [T.release, 160])} />
      <div className={s.muzzle} style={at(T.release, 220)} />

      <div className={s["trail-in"]} style={ats([T.release, flight], [T.impact, 360])} />
      <div className={s["trail-out"]} style={ats([T.impact, flyTotal - flight], [T.impact + 60, 380])} />
      {SONIC_RINGS.map((ring) => (
        <span
          key={ring.x}
          className={s.sonic}
          style={{ ...at(ring.delay, 280), left: ring.x, ...cssVars({ "--ring-scale": ring.scale }) }}
        />
      ))}
      <div className={s.arrow} style={at(T.release, flyTotal)}>
        <span className={s["arrow-glow"]} />
        <span className={s["arrow-body"]} />
        <span className={s["arrow-core"]} />
      </div>

      <div className={s.cone} style={at(T.impact, 320)} />
      <div className={s.flash} style={at(T.impact, 280)} />
      <div className={s["flare-h"]} style={at(T.impact, 360)} />
      <div className={s["flare-v"]} style={at(T.impact + 10, 300)} />
      <div className={s.hole} style={at(T.impact, 420)} />
      <div className={s["hole-outer"]} style={at(T.impact + 40, 520)} />

      {PIERCE_BEAMS.map((beam, index) => (
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
      {PIERCE_SPARKS.map((spark, index) => (
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
      {PIERCE_EMBERS.map((ember, index) => (
        <span
          key={`ember-${index}`}
          className={s.ember}
          style={{
            ...at(T.impact + ember.delay, T.total - T.impact - ember.delay),
            left: ember.x,
            top: ember.y,
            width: ember.size,
            height: ember.size,
            ...cssVars({ "--dx": `${ember.dx}px`, "--dy": `${ember.dy}px` }),
          }}
        />
      ))}
    </div>
  );
}
