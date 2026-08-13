import type { CSSProperties } from "react";
import type { ProcFxPreset } from "@/ui/battle/animations";
import s from "./BladeSlashFx.module.css";

const BLADE_LENGTH = 900;
const timing = (milliseconds: number) =>
  `calc(${milliseconds}ms / max(var(--fx-rate, 1), 0.25))`;

// 模板中的随机几何烘成固定表, 保证重播时布局稳定且不触发额外状态更新。
const PARTICLES = [
  { t: -430, n: 8, size: 6, delay: 8 },
  { t: -345, n: -7, size: 5, delay: 42 },
  { t: -265, n: 12, size: 7, delay: 18 },
  { t: -190, n: -10, size: 5, delay: 56 },
  { t: -120, n: 6, size: 4, delay: 26 },
  { t: -60, n: -8, size: 6, delay: 72 },
  { t: -24, n: 4, size: 5, delay: 34 },
  { t: 24, n: -5, size: 6, delay: 48 },
  { t: 60, n: 9, size: 5, delay: 16 },
  { t: 120, n: -6, size: 7, delay: 64 },
  { t: 190, n: 11, size: 5, delay: 30 },
  { t: 265, n: -9, size: 6, delay: 4 },
  { t: 345, n: 7, size: 4, delay: 52 },
  { t: 430, n: -11, size: 6, delay: 22 },
] as const;

const BEAMS = [
  { x: -360, angle: 8, length: 210, delay: 0 },
  { x: -360, angle: 46, length: 280, delay: 18 },
  { x: -360, angle: 88, length: 235, delay: 32 },
  { x: -360, angle: 136, length: 300, delay: 8 },
  { x: -360, angle: 208, length: 250, delay: 42 },
  { x: -250, angle: 350, length: 245, delay: 12 },
  { x: -250, angle: 32, length: 295, delay: 34 },
  { x: -250, angle: 74, length: 220, delay: 4 },
  { x: -250, angle: 124, length: 270, delay: 26 },
  { x: -250, angle: 190, length: 230, delay: 46 },
  { x: -140, angle: 18, length: 230, delay: 20 },
  { x: -140, angle: 60, length: 275, delay: 2 },
  { x: -140, angle: 102, length: 215, delay: 38 },
  { x: -140, angle: 168, length: 305, delay: 14 },
  { x: -140, angle: 244, length: 255, delay: 44 },
  { x: -45, angle: 338, length: 260, delay: 6 },
  { x: -45, angle: 80, length: 225, delay: 28 },
  { x: -45, angle: 130, length: 300, delay: 18 },
  { x: -45, angle: 210, length: 240, delay: 40 },
  { x: -45, angle: 286, length: 280, delay: 10 },
  { x: 45, angle: 12, length: 245, delay: 24 },
  { x: 45, angle: 58, length: 290, delay: 0 },
  { x: 45, angle: 118, length: 220, delay: 36 },
  { x: 45, angle: 186, length: 275, delay: 16 },
  { x: 45, angle: 270, length: 235, delay: 48 },
  { x: 140, angle: 344, length: 255, delay: 8 },
  { x: 140, angle: 96, length: 305, delay: 30 },
  { x: 140, angle: 154, length: 225, delay: 42 },
  { x: 140, angle: 228, length: 265, delay: 12 },
  { x: 140, angle: 312, length: 235, delay: 22 },
  { x: 250, angle: 24, length: 285, delay: 18 },
  { x: 250, angle: 72, length: 215, delay: 44 },
  { x: 250, angle: 142, length: 275, delay: 6 },
  { x: 250, angle: 216, length: 240, delay: 34 },
  { x: 250, angle: 300, length: 300, delay: 26 },
  { x: 360, angle: 4, length: 220, delay: 40 },
  { x: 360, angle: 54, length: 290, delay: 14 },
  { x: 360, angle: 110, length: 250, delay: 28 },
  { x: 360, angle: 176, length: 305, delay: 2 },
  { x: 360, angle: 288, length: 235, delay: 36 },
] as const;

const SPARKS = [
  { x: -360, dx: -118, dy: -54, size: 5, delay: 8 },
  { x: -360, dx: -84, dy: 42, size: 4, delay: 22 },
  { x: -360, dx: -32, dy: -92, size: 6, delay: 0 },
  { x: -360, dx: 28, dy: 76, size: 4, delay: 34 },
  { x: -360, dx: 84, dy: -38, size: 5, delay: 16 },
  { x: -360, dx: 122, dy: 26, size: 4, delay: 28 },
  { x: -360, dx: 54, dy: 108, size: 6, delay: 42 },
  { x: -360, dx: -58, dy: 116, size: 4, delay: 12 },
  { x: -250, dx: -108, dy: -46, size: 4, delay: 18 },
  { x: -250, dx: -70, dy: 66, size: 6, delay: 4 },
  { x: -250, dx: -18, dy: -112, size: 5, delay: 30 },
  { x: -250, dx: 44, dy: 92, size: 4, delay: 12 },
  { x: -250, dx: 96, dy: -22, size: 6, delay: 38 },
  { x: -250, dx: 124, dy: 52, size: 4, delay: 24 },
  { x: -250, dx: 18, dy: 118, size: 5, delay: 44 },
  { x: -250, dx: -92, dy: 104, size: 4, delay: 8 },
  { x: -140, dx: -116, dy: -34, size: 6, delay: 6 },
  { x: -140, dx: -62, dy: 82, size: 4, delay: 26 },
  { x: -140, dx: -8, dy: -124, size: 5, delay: 40 },
  { x: -140, dx: 56, dy: 58, size: 4, delay: 14 },
  { x: -140, dx: 112, dy: -64, size: 6, delay: 32 },
  { x: -140, dx: 120, dy: 30, size: 4, delay: 20 },
  { x: -140, dx: 22, dy: 112, size: 5, delay: 46 },
  { x: -140, dx: -76, dy: 96, size: 4, delay: 10 },
  { x: -45, dx: -126, dy: -62, size: 5, delay: 24 },
  { x: -45, dx: -72, dy: 44, size: 4, delay: 8 },
  { x: -45, dx: -26, dy: -116, size: 6, delay: 36 },
  { x: -45, dx: 38, dy: 84, size: 4, delay: 16 },
  { x: -45, dx: 104, dy: -34, size: 5, delay: 2 },
  { x: -45, dx: 126, dy: 62, size: 4, delay: 30 },
  { x: -45, dx: 12, dy: 124, size: 6, delay: 44 },
  { x: -45, dx: -94, dy: 104, size: 4, delay: 12 },
  { x: 45, dx: -112, dy: -42, size: 4, delay: 10 },
  { x: 45, dx: -82, dy: 72, size: 6, delay: 28 },
  { x: 45, dx: -14, dy: -108, size: 5, delay: 4 },
  { x: 45, dx: 48, dy: 96, size: 4, delay: 42 },
  { x: 45, dx: 118, dy: -28, size: 6, delay: 18 },
  { x: 45, dx: 108, dy: 58, size: 4, delay: 34 },
  { x: 45, dx: 30, dy: 116, size: 5, delay: 22 },
  { x: 45, dx: -66, dy: 110, size: 4, delay: 46 },
  { x: 140, dx: -120, dy: -58, size: 6, delay: 16 },
  { x: 140, dx: -56, dy: 50, size: 4, delay: 0 },
  { x: 140, dx: -22, dy: -120, size: 5, delay: 32 },
  { x: 140, dx: 66, dy: 78, size: 4, delay: 12 },
  { x: 140, dx: 114, dy: -44, size: 6, delay: 40 },
  { x: 140, dx: 126, dy: 34, size: 4, delay: 26 },
  { x: 140, dx: 8, dy: 122, size: 5, delay: 6 },
  { x: 140, dx: -88, dy: 94, size: 4, delay: 36 },
  { x: 250, dx: -104, dy: -70, size: 5, delay: 20 },
  { x: 250, dx: -76, dy: 38, size: 4, delay: 6 },
  { x: 250, dx: -4, dy: -116, size: 6, delay: 44 },
  { x: 250, dx: 52, dy: 88, size: 4, delay: 26 },
  { x: 250, dx: 118, dy: -18, size: 5, delay: 10 },
  { x: 250, dx: 98, dy: 70, size: 4, delay: 34 },
  { x: 250, dx: 26, dy: 120, size: 6, delay: 18 },
  { x: 250, dx: -86, dy: 108, size: 4, delay: 42 },
  { x: 360, dx: -116, dy: -48, size: 4, delay: 2 },
  { x: 360, dx: -64, dy: 58, size: 6, delay: 24 },
  { x: 360, dx: -12, dy: -126, size: 5, delay: 14 },
  { x: 360, dx: 42, dy: 84, size: 4, delay: 38 },
  { x: 360, dx: 108, dy: -36, size: 6, delay: 8 },
  { x: 360, dx: 124, dy: 48, size: 4, delay: 30 },
  { x: 360, dx: 20, dy: 114, size: 5, delay: 46 },
  { x: 360, dx: -80, dy: 102, size: 4, delay: 18 },
] as const;

const WOUNDS = [
  { x: -360, length: 118, delay: 12 },
  { x: -350, length: 156, delay: 30 },
  { x: -372, length: 132, delay: 4 },
  { x: -250, length: 144, delay: 22 },
  { x: -238, length: 112, delay: 42 },
  { x: -264, length: 168, delay: 8 },
  { x: -140, length: 126, delay: 18 },
  { x: -128, length: 158, delay: 36 },
  { x: -152, length: 108, delay: 2 },
  { x: -45, length: 164, delay: 26 },
  { x: -34, length: 124, delay: 6 },
  { x: -58, length: 146, delay: 44 },
  { x: 45, length: 136, delay: 10 },
  { x: 58, length: 172, delay: 32 },
  { x: 32, length: 116, delay: 20 },
  { x: 140, length: 154, delay: 4 },
  { x: 152, length: 118, delay: 28 },
  { x: 128, length: 166, delay: 40 },
  { x: 250, length: 132, delay: 16 },
  { x: 264, length: 174, delay: 38 },
  { x: 238, length: 110, delay: 2 },
  { x: 360, length: 160, delay: 24 },
  { x: 372, length: 122, delay: 42 },
  { x: 348, length: 148, delay: 8 },
  { x: -6, length: 188, delay: 6 },
  { x: 0, length: 154, delay: 18 },
  { x: 7, length: 132, delay: 34 },
  { x: -14, length: 166, delay: 26 },
  { x: 12, length: 142, delay: 46 },
] as const;

export function BladeSlashFx({ preset }: { preset: ProcFxPreset }) {
  const impactMs = Math.max(preset.impactMs, 0);
  const convergeStart = impactMs + 300;
  const burstStart = convergeStart + 530;
  const burstStyle = (delay: number, duration: number) => ({
    animationDelay: timing(burstStart + delay),
    animationDuration: timing(duration),
  });

  return (
    <div
      className={s["blade-wrap"]}
      style={{ ["--blade-len" as string]: `${BLADE_LENGTH}px` } as CSSProperties}
    >
      <div
        className={s["blade-scar"]}
        style={{
          animationDelay: `${timing(0)}, ${timing(1250)}`,
          animationDuration: `${timing(220)}, ${timing(380)}`,
        }}
      />
      <div
        className={s["blade-orb"]}
        style={{
          animationDelay: `${timing(810)}, ${timing(950)}`,
          animationDuration: `${timing(140)}, ${timing(180)}`,
        }}
      />
      <div className={s["blade-shock"]} style={burstStyle(0, 320)} />
      <div
        className={s["blade-main"]}
        style={{ animationDelay: timing(0), animationDuration: timing(240) }}
      />
      <div
        className={s["blade-ghost1"]}
        style={{ animationDelay: timing(40), animationDuration: timing(240) }}
      />
      <div
        className={s["blade-ghost2"]}
        style={{ animationDelay: timing(80), animationDuration: timing(240) }}
      />

      {PARTICLES.map((particle, index) => (
        <span
          key={`particle-${index}`}
          className={s["blade-particle"]}
          style={{
            left: "50%",
            top: `calc(50% + ${particle.n}px)`,
            width: particle.size,
            height: particle.size,
            ["--particle-start" as string]: `${particle.t}px`,
            animationDelay: timing(convergeStart + particle.delay),
            animationDuration: timing(300),
          } as CSSProperties}
        />
      ))}

      {BEAMS.map((beam, index) => (
        <span
          key={`beam-${index}`}
          className={s["blade-beam"]}
          style={{
            ...burstStyle(beam.delay, 280),
            left: `calc(50% + ${beam.x}px)`,
            width: beam.length,
            ["--beam-angle" as string]: `${beam.angle}deg`,
          } as CSSProperties}
        />
      ))}

      {SPARKS.map((spark, index) => (
        <span
          key={`spark-${index}`}
          className={s["blade-spark"]}
          style={{
            ...burstStyle(spark.delay, 380),
            left: `calc(50% + ${spark.x}px)`,
            width: spark.size,
            height: spark.size,
            ["--spark-dx" as string]: `${spark.dx}px`,
            ["--spark-dy" as string]: `${spark.dy}px`,
          } as CSSProperties}
        />
      ))}

      {WOUNDS.map((wound, index) => (
        <span
          key={`wound-${index}`}
          className={s["blade-wound"]}
          style={{
            ...burstStyle(wound.delay, 220),
            left: `calc(50% + ${wound.x}px)`,
            width: wound.length,
          }}
        />
      ))}

    </div>
  );
}