import type { ProcFxPreset } from "@/ui/battle/choreo/animations";
import { cssVars, fxAnim, fxAnims } from "@/ui/battle/fx/shared/fxKit";
import {
  FALL_DISTANCE,
  GROUND_SQUASH,
  GROUND_Y,
  METEOR_BEAMS,
  METEOR_RAIN_TIMELINE as T,
  METEOR_SPARKS,
  METEOR_TARGET,
  RAIN_ARROWS,
  RAIN_FALL_MS,
  RAIN_MOTES,
} from "./meteorRainGeometry";
import s from "./MeteorRainFx.module.css";

/** 光柱/巨箭从舞台上方多高处落下(px, 相对目标中心)。 */
const SKY_TOP = -560;

// 流星箭雨: 法阵锁区 → 箭雨连落钉地 → 光柱收束 → 巨箭坠击 + 钉地箭连锁引爆。
// 纯 DOM + CSS 关键帧, 挂载即播; 时间轴整体按 preset.impactMs / T.impact 缩放。
export function MeteorRainFx({ preset }: { preset: ProcFxPreset }) {
  const k = Math.max(preset.impactMs, 1) / T.impact;
  const at = (delay: number, duration: number) => fxAnim(delay * k, duration * k);
  const ats = (...segments: [number, number][]) =>
    fxAnims(...segments.map(([delay, duration]) => [delay * k, duration * k] as [number, number]));
  const meteorFall = T.impact - T.finalFall;

  return (
    <div
      className={s.wrap}
      style={cssVars({ "--fall": `${FALL_DISTANCE}px`, "--squash": GROUND_SQUASH })}
    >
      <div className={s.sky} style={at(0, T.total)} />

      {/* 地面层: 统一压扁成透视平面 */}
      <div className={s.ground} style={{ top: GROUND_Y }}>
        <span className={s["ground-glow"]} style={at(T.impact, 700)} />
        <span className={s["sigil-outer"]} style={ats([T.sigil, 380], [T.impact, 420])} />
        <span className={s["sigil-runes"]} style={at(T.sigil + 80, T.impact + 300)} />
        <span className={s["sigil-inner"]} style={at(T.sigil + 120, T.impact + 200)} />
        <span className={s["sigil-shrink"]} style={at(T.beacon, T.impact - T.beacon)} />
        {RAIN_ARROWS.map((arrow, index) => (
          <span
            key={`ripple-${index}`}
            className={s.ripple}
            style={{ ...at(arrow.land, 420), left: arrow.gx, top: arrow.gz }}
          />
        ))}
        <span className={s.shock} style={at(T.impact, 560)} />
        <span className={s["shock-outer"]} style={at(T.impact + 60, 760)} />
      </div>

      {RAIN_MOTES.map((mote, index) => (
        <span
          key={`mote-${index}`}
          className={s.mote}
          style={{
            ...at(mote.delay, 760),
            left: mote.x,
            top: GROUND_Y + mote.y * GROUND_SQUASH,
            width: mote.size,
            height: mote.size,
            ...cssVars({ "--rise": `${-mote.rise}px` }),
          }}
        />
      ))}

      {RAIN_ARROWS.map((arrow, index) => (
        <div
          key={`rain-${index}`}
          className={s.rain}
          style={{
            ...ats([arrow.start, RAIN_FALL_MS], [T.impact + arrow.detonate, 320]),
            left: arrow.x,
            top: arrow.y,
            height: arrow.length,
            ...cssVars({ "--tilt": `${arrow.tilt}deg` }),
          }}
        >
          <span className={s["rain-streak"]} style={at(arrow.land, 160)} />
          <span className={s["rain-body"]} />
        </div>
      ))}
      {RAIN_ARROWS.map((arrow, index) => (
        <span
          key={`land-${index}`}
          className={s["land-flash"]}
          style={{ ...at(arrow.land, 240), left: arrow.x, top: arrow.y }}
        />
      ))}
      {RAIN_ARROWS.flatMap((arrow, index) =>
        arrow.sparks.map((spark, sparkIndex) => (
          <span
            key={`land-spark-${index}-${sparkIndex}`}
            className={s.spark}
            style={{
              ...at(arrow.land, 340),
              left: arrow.x,
              top: arrow.y,
              width: spark.size,
              height: spark.size,
              ...cssVars({ "--dx": `${spark.dx}px`, "--dy": `${spark.dy}px` }),
            }}
          />
        )),
      )}

      <div
        className={s.beacon}
        style={{
          ...ats([T.beacon, T.impact - T.beacon], [T.impact, 220]),
          top: SKY_TOP,
          height: METEOR_TARGET.y - SKY_TOP,
        }}
      />
      <div
        className={s.meteor}
        style={{
          ...ats([T.finalFall, meteorFall], [T.impact + 220, 380]),
          left: METEOR_TARGET.x,
          top: METEOR_TARGET.y,
        }}
      >
        <span className={s["meteor-streak"]} style={at(T.impact, 180)} />
        <span className={s["meteor-body"]} />
        <span className={s["meteor-core"]} />
      </div>

      <div
        className={s.pillar}
        style={{ ...at(T.impact, 620), left: METEOR_TARGET.x, top: METEOR_TARGET.y }}
      />
      <div
        className={s.flash}
        style={{ ...at(T.impact, 320), left: METEOR_TARGET.x, top: METEOR_TARGET.y }}
      />
      {METEOR_BEAMS.map((beam, index) => (
        <span
          key={`beam-${index}`}
          className={s.beam}
          style={{
            ...at(T.impact + beam.delay, 300),
            left: METEOR_TARGET.x,
            top: METEOR_TARGET.y - 10,
            width: beam.length,
            ...cssVars({ "--beam-angle": `${beam.angle}deg` }),
          }}
        />
      ))}
      {METEOR_SPARKS.map((spark, index) => (
        <span
          key={`spark-${index}`}
          className={s.spark}
          style={{
            ...at(T.impact + spark.delay, spark.duration),
            left: METEOR_TARGET.x,
            top: METEOR_TARGET.y - 10,
            width: spark.size,
            height: spark.size,
            ...cssVars({ "--dx": `${spark.dx}px`, "--dy": `${spark.dy}px` }),
          }}
        />
      ))}
    </div>
  );
}
