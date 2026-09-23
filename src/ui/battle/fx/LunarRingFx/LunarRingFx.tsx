import type { CSSProperties } from "react";
import { fxAnim, fxAnims, cssVars } from "@/ui/battle/fx/shared/fxKit";
import type { ProcFxPreset } from "@/ui/battle/animations";
import {
  AROUND_IMPACT, CONVERGE, OPENING, RING_RADIUS, SPARKS, START_ANGLE, TILT,
} from "./lunarRingGeometry";
import s from "./LunarRingFx.module.css";

const BOX = RING_RADIUS * 2 + 80;
const VIEW_BOX = `${-BOX / 2} ${-BOX / 2} ${BOX} ${BOX}`;

/** 月轮三层描边: 外晕 / 金色中层 / 白芯。pathLength=100 让描边动画与半径解耦。 */
function RingStrokes({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <g className={className} style={style}>
      <circle className={s.strokeGlow} r={RING_RADIUS} pathLength={100} />
      <circle className={s.strokeMid} r={RING_RADIUS} pathLength={100} />
      <circle className={s.strokeCore} r={RING_RADIUS} pathLength={100} />
    </g>
  );
}

/** 圆月轮斩: 目标中心为原点, 挂载即播; key 换新即重播。 */
export function LunarRingFx({ preset }: { preset: ProcFxPreset }) {
  const impact = Math.max(preset.impactMs, 0);
  const at = ({ delay, duration }: { delay: number; duration: number }, offset = 0) =>
    fxAnim(impact + delay + offset, duration);
  const { tighten, converge, coreCharge, coreBurst, cut, halves, shock, sparks } = AROUND_IMPACT;

  return (
    <div
      className={s.wrap}
      style={cssVars({
        "--r": `${RING_RADIUS}px`,
        "--box": `${BOX}px`,
        "--tilt": `${TILT}deg`,
        "--start": `${START_ANGLE}deg`,
      })}
    >
      <div className={s.flareAnchor}>
        <span className={s.flare} style={fxAnim(OPENING.flare.delay, OPENING.flare.duration)} />
      </div>

      <div className={s.ring} style={fxAnims([impact + tighten.delay, tighten.duration], [impact, 40])}>
        <svg className={s.ringSvg} viewBox={VIEW_BOX} aria-hidden>
          <RingStrokes
            className={s.trace}
            style={fxAnim(OPENING.trace.delay, OPENING.trace.duration)}
          />
          <circle
            className={s.ghost}
            r={RING_RADIUS * 0.9}
            pathLength={100}
            style={fxAnim(OPENING.ghostTrace.delay, OPENING.ghostTrace.duration)}
          />
        </svg>
      </div>

      <div className={s.tipOrbit} style={fxAnim(OPENING.trace.delay, OPENING.trace.duration)}>
        <span className={s.tip} />
      </div>

      {CONVERGE.map((mote, index) => (
        <span
          key={`mote-${index}`}
          className={s.mote}
          style={{
            ...at(converge, mote.delay),
            width: mote.size,
            height: mote.size,
            ...cssVars({ "--a": `${mote.angle}deg`, "--from": `${mote.from}px` }),
          }}
        />
      ))}

      <span
        className={s.core}
        style={fxAnims(
          [impact + coreCharge.delay, coreCharge.duration],
          [impact + coreBurst.delay, coreBurst.duration],
        )}
      />

      {[s.halfTop, s.halfBottom].map((side) => (
        <div key={side} className={`${s.half} ${side}`} style={at(halves)}>
          <svg className={s.ringSvg} viewBox={VIEW_BOX} aria-hidden>
            <RingStrokes />
          </svg>
        </div>
      ))}

      <span className={s.shock} style={at(shock)} />
      <span className={s.cut} style={at(cut)} />

      {SPARKS.map((spark, index) => (
        <span
          key={`spark-${index}`}
          className={s.spark}
          style={{
            ...at(sparks, spark.delay),
            width: spark.length,
            ...cssVars({
              "--x": `${spark.x}px`,
              "--y": `${spark.y}px`,
              "--dir": `${spark.dir}deg`,
              "--dist": `${spark.dist}px`,
            }),
          }}
        />
      ))}
    </div>
  );
}
