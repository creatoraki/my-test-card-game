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
        className={s["luna-scar-system"]}
        data-tone={LUNA_SLASH.tone}
        style={asStyle({ "--scar-angle": `${LUNA_SLASH.angle}deg` })}
      >
        <i
          className={s["luna-scar-aura"]}
          style={asStyle({
            animationDelay: timing(at(LUNA_SLASH.at - 90)),
            animationDuration: timing(700),
          })}
        />
        <i
          className={s["luna-scar-main"]}
          style={asStyle({
            animationDelay: timing(at(LUNA_SLASH.at - 30)),
            animationDuration: timing(760),
          })}
        />
        <i
          className={s["luna-scar-glint"]}
          style={asStyle({
            animationDelay: timing(at(LUNA_TIMELINE.contact - 90)),
            animationDuration: timing(430),
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
          "--cut-angle": `${LUNA_SLASH.angle}deg`,
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