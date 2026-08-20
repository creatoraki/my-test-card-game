import type { CSSProperties } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import { EMBERS, LUNA_SLASH, LUNA_TIMELINE, SPARKS } from "./lunaArcSlashGeometry";
import s from "./LunaArcSlashFx.module.css";

const timing = (milliseconds: number) =>
  `calc(${milliseconds}ms / max(var(--fx-rate, 1), 0.25))`;

const asStyle = (style: Record<string, string | number>) => style as CSSProperties;

export function LunaArcSlashFx({ preset }: { preset: ProcFxPreset }) {
  const offset = preset.impactMs - LUNA_TIMELINE.impact;
  const at = (timelineMs: number) => Math.max(0, offset + timelineMs);

  return (
    <div className={s["luna-wrap"]}>
      <div
        className={s["luna-charge"]}
        style={asStyle({
          animationDelay: timing(at(LUNA_TIMELINE.telegraph)),
          animationDuration: timing(360),
        })}
      />

      <div
        className={s["luna-arc"]}
        data-tone={LUNA_SLASH.tone}
        style={asStyle({ "--arc-angle": `${LUNA_SLASH.angle}deg` })}
      >
        <i
          className={s["luna-arc-halo"]}
          style={asStyle({
            animationDelay: timing(at(LUNA_SLASH.at - 72)),
            animationDuration: timing(560),
          })}
        />
        <i
          className={s["luna-arc-edge"]}
          style={asStyle({
            animationDelay: timing(at(LUNA_SLASH.at)),
            animationDuration: timing(520),
          })}
        />
        <i
          className={s["luna-arc-echo"]}
          style={asStyle({
            animationDelay: timing(at(LUNA_SLASH.at + 110)),
            animationDuration: timing(620),
          })}
        />
      </div>

      {SPARKS.map((spark, index) => (
        <span
          key={`spark-${index}`}
          className={s["luna-spark"]}
          data-tone={LUNA_SLASH.tone}
          style={asStyle({
            width: spark.size,
            height: spark.size,
            "--spark-angle": `${LUNA_SLASH.angle}deg`,
            "--spark-along": `${spark.along}px`,
            "--spark-dx": `${spark.dx}px`,
            "--spark-dy": `${spark.dy}px`,
            "--spark-rotate": `${spark.rotate}deg`,
            animationDelay: timing(at(LUNA_SLASH.at + spark.delay)),
            animationDuration: timing(360),
          })}
        />
      ))}

      <div
        className={s["luna-cut"]}
        style={asStyle({
          animationDelay: timing(at(LUNA_TIMELINE.impact)),
          animationDuration: timing(340),
        })}
      />
      <div
        className={s["luna-contact"]}
        style={asStyle({
          animationDelay: timing(at(LUNA_TIMELINE.impact)),
          animationDuration: timing(220),
        })}
      />
      <div
        className={s["luna-ring"]}
        style={asStyle({
          animationDelay: timing(at(LUNA_TIMELINE.afterglow)),
          animationDuration: timing(420),
        })}
      />

      {EMBERS.map((ember, index) => (
        <span
          key={`ember-${index}`}
          className={s["luna-ember"]}
          data-tone={ember.tone}
          style={asStyle({
            left: `calc(50% + ${ember.x}px)`,
            top: `calc(50% + ${ember.y}px)`,
            width: ember.size,
            height: ember.size,
            "--ember-dx": `${ember.dx}px`,
            "--ember-dy": `${ember.dy}px`,
            "--ember-rotate": `${ember.rotate}deg`,
            animationDelay: timing(at(LUNA_TIMELINE.impact + ember.delay)),
            animationDuration: timing(620),
          })}
        />
      ))}
    </div>
  );
}