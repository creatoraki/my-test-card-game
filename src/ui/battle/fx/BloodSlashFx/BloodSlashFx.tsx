import type { CSSProperties } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import s from "./BloodSlashFx.module.css";

const TIMELINE_IMPACT = 1900;
const timing = (milliseconds: number) =>
  `calc(${milliseconds}ms / max(var(--fx-rate, 1), 0.25))`;

const ORBS = [
  { sx: -132, sy: -20, size: 5, delay: 0 },
  { sx: -108, sy: -88, size: 4, delay: 15 },
  { sx: -52, sy: -142, size: 7, delay: 30 },
  { sx: 18, sy: -158, size: 5, delay: 45 },
  { sx: 88, sy: -118, size: 4, delay: 60 },
  { sx: 142, sy: -58, size: 6, delay: 75 },
  { sx: 156, sy: 22, size: 4, delay: 90 },
  { sx: 112, sy: 96, size: 6, delay: 105 },
  { sx: 46, sy: 142, size: 5, delay: 120 },
  { sx: -24, sy: 154, size: 4, delay: 135 },
  { sx: -98, sy: 122, size: 6, delay: 150 },
  { sx: -148, sy: 62, size: 5, delay: 165 },
  { sx: -182, sy: 4, size: 4, delay: 180 },
  { sx: -72, sy: 206, size: 5, delay: 195 },
  { sx: 78, sy: -210, size: 6, delay: 210 },
  { sx: 198, sy: 78, size: 4, delay: 225 },
] as const;

const WOUNDS = [
  { x: -510, y: 208, length: 128, angle: -38, delay: 0 },
  { x: -380, y: 108, length: 94, angle: -38, delay: 18 },
  { x: -244, y: 4, length: 144, angle: -38, delay: 36 },
  { x: -96, y: -106, length: 112, angle: -38, delay: 54 },
  { x: 52, y: -216, length: 154, angle: -38, delay: 72 },
  { x: 202, y: -324, length: 106, angle: -38, delay: 90 },
  { x: 350, y: -430, length: 138, angle: -38, delay: 108 },
  { x: 514, y: -548, length: 98, angle: -38, delay: 126 },
  { x: -470, y: 278, length: 84, angle: -38, delay: 14 },
  { x: -304, y: 154, length: 122, angle: -38, delay: 32 },
  { x: -146, y: 36, length: 92, angle: -38, delay: 50 },
  { x: 112, y: -154, length: 118, angle: -38, delay: 68 },
  { x: 268, y: -270, length: 86, angle: -38, delay: 86 },
  { x: 438, y: -396, length: 130, angle: -38, delay: 104 },
] as const;

const asStyle = (style: Record<string, string | number>) => style as CSSProperties;

export function BloodSlashFx({ preset }: { preset: ProcFxPreset }) {
  const timelineOffset = preset.impactMs - TIMELINE_IMPACT;
  const at = (timelineMs: number) => Math.max(0, timelineOffset + timelineMs);

  return (
    <div className={s["blood-wrap"]}>
      <div className={s["blood-slash-system"]}>
        <div
          className={s["blood-slash-core"]}
          style={asStyle({
            animationDelay: `${timing(at(800))}, ${timing(at(1200))}, ${timing(at(1900))}`,
            animationDuration: `${timing(120)}, ${timing(150)}, ${timing(1)}`,
          })}
        />
        <div
          className={s["blood-crack-left"]}
          style={asStyle({
            animationDelay: `${timing(at(850))}, ${timing(at(1900))}`,
            animationDuration: `${timing(350)}, ${timing(1)}`,
          })}
        />
        <div
          className={s["blood-crack-right"]}
          style={asStyle({
            animationDelay: `${timing(at(850))}, ${timing(at(1900))}`,
            animationDuration: `${timing(350)}, ${timing(1)}`,
          })}
        />
        <div
          className={s["blood-aura"]}
          style={asStyle({
            animationDelay: `${timing(at(950))}, ${timing(at(1900))}`,
            animationDuration: `${timing(600)}, ${timing(1)}`,
          })}
        />
        {WOUNDS.map((wound, index) => (
          <span
            key={`wound-${index}`}
            className={s["blood-wound"]}
            style={asStyle({
              left: `calc(50% + ${wound.x}px)`,
              top: `calc(50% + ${wound.y}px)`,
              width: wound.length,
              ["--wound-angle"]: `${wound.angle}deg`,
              animationDelay: timing(at(1200 + wound.delay)),
              animationDuration: timing(180),
            })}
          />
        ))}
      </div>

      <div className={s["blood-particles"]}>
        {ORBS.map((orb, index) => (
          <span
            key={`orb-${index}`}
            className={s["blood-orb"]}
            style={asStyle({
              left: "50%",
              top: "50%",
              width: orb.size,
              height: orb.size,
              ["--orb-sx"]: `${orb.sx}px`,
              ["--orb-sy"]: `${orb.sy}px`,
              animationDelay: timing(at(150 + orb.delay)),
              animationDuration: timing(500),
            })}
          />
        ))}
      </div>
    </div>
  );
}
