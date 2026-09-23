import { useId } from "react";
import type { ProcFxPreset } from "@/ui/battle/choreo/animations";
import { cssVars, fxAnim, fxAnims } from "@/ui/battle/fx/shared/fxKit";
import {
  AROUND_IMPACT, CRACKS, CRESCENT_H, LAUNCH_X, OPENING, SHARDS, SWIRLS, TILT, WINDS, WOUND_H,
} from "./galeCrescentGeometry";
import s from "./GaleCrescentFx.module.css";

const HALF_H = CRESCENT_H / 2;
// 外弧凸向飞行方向(+X), 内弧浅一些, 两端收成尖角。
const CRESCENT_PATH = `M 0 ${-HALF_H} A 110 ${HALF_H} 0 0 1 0 ${HALF_H} A 56 ${HALF_H} 0 0 0 0 ${-HALF_H} Z`;
const VIEW_BOX = `-40 ${-HALF_H - 20} 200 ${CRESCENT_H + 40}`;

function CrescentShape({ gradientId }: { gradientId?: string }) {
  return (
    <svg className={s.shape} viewBox={VIEW_BOX} aria-hidden>
      {gradientId ? (
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#2fd6a8" stopOpacity="0.15" />
            <stop offset="55%" stopColor="#7df5c8" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#f2fffa" />
          </linearGradient>
        </defs>
      ) : null}
      <path className={s.shapeGlow} d={CRESCENT_PATH} />
      <path className={s.shapeMid} d={CRESCENT_PATH} />
      <path
        className={s.shapeFill}
        d={CRESCENT_PATH}
        style={gradientId ? { fill: `url(#${gradientId})` } : undefined}
      />
    </svg>
  );
}

/** 苍岚剑气: 目标中心为原点, 挂载即播; key 换新即重播。 */
export function GaleCrescentFx({ preset }: { preset: ProcFxPreset }) {
  const gradientId = useId().replace(/:/g, "");
  const impact = Math.max(preset.impactMs, OPENING.flyStart + 120);
  const flight = impact - OPENING.flyStart;
  const at = ({ delay, duration }: { delay: number; duration: number }, offset = 0) =>
    fxAnim(impact + delay + offset, duration);
  const { pierce, woundOpen, rupture, waves, secondWaveLag, shards, swirls, cracks, flash } = AROUND_IMPACT;

  return (
    <div
      className={s.wrap}
      style={cssVars({
        "--tilt": `${TILT}deg`,
        "--launch": `${LAUNCH_X}px`,
        "--wound-h": `${WOUND_H}px`,
        "--crescent-h": `${CRESCENT_H}px`,
      })}
    >
      <span className={s.launch} style={fxAnim(OPENING.launch.delay, OPENING.launch.duration)} />

      {WINDS.map((wind, index) => (
        <span
          key={`wind-${index}`}
          className={s.wind}
          style={{
            ...fxAnim(OPENING.flyStart + wind.delay, Math.max(flight - wind.delay, 120)),
            top: wind.y,
            width: wind.length,
            ...cssVars({ "--from": `${wind.from}px`, "--to": `${wind.to}px` }),
          }}
        />
      ))}

      {OPENING.ghostLag.map((lag) => (
        <div key={`ghost-${lag}`} className={s.ghost} style={fxAnim(OPENING.flyStart + lag, flight)}>
          <CrescentShape />
        </div>
      ))}

      <div
        className={s.crescent}
        style={fxAnims([OPENING.flyStart, flight], [impact + pierce.delay, pierce.duration])}
      >
        <span className={s.wake} />
        <CrescentShape gradientId={gradientId} />
      </div>

      <span className={s.flash} style={at(flash)} />
      <span
        className={s.wound}
        style={fxAnims(
          [impact + woundOpen.delay, woundOpen.duration],
          [impact + rupture.delay, rupture.duration],
        )}
      />

      {[0, secondWaveLag].map((lag) => (
        <span key={`wave-${lag}`} className={s.wave} style={at(waves, lag)} />
      ))}

      {SWIRLS.map((swirl, index) => (
        <span
          key={`swirl-${index}`}
          className={s.swirl}
          style={{
            ...at(swirls, swirl.delay),
            width: swirl.radius * 2,
            height: swirl.radius * 2,
            ...cssVars({ "--turn": `${swirl.turn}deg` }),
          }}
        />
      ))}

      {SHARDS.map((shard, index) => (
        <span
          key={`shard-${index}`}
          className={s.shard}
          style={{
            ...at(shards, shard.delay),
            top: shard.y,
            width: shard.length,
            ...cssVars({ "--dir": `${shard.dir}deg`, "--dist": `${shard.dist}px` }),
          }}
        />
      ))}

      {CRACKS.map((crack, index) => (
        <span
          key={`crack-${index}`}
          className={s.crack}
          style={{
            ...at(cracks, crack.delay),
            top: crack.y,
            width: crack.length,
            ...cssVars({ "--skew": `${crack.skew}deg` }),
          }}
        />
      ))}
    </div>
  );
}
