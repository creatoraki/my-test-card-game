import type { CSSProperties } from "react";
import s from "./SlashSfxFx.module.css";

const timing = (milliseconds: number) => `${milliseconds}ms`;

const SPARKS = [
  { angle: -138, distance: 142, delay: 0, length: 54 },
  { angle: -112, distance: 186, delay: 12, length: 38 },
  { angle: -74, distance: 154, delay: 22, length: 64 },
  { angle: -38, distance: 196, delay: 8, length: 46 },
  { angle: 28, distance: 168, delay: 18, length: 58 },
  { angle: 63, distance: 132, delay: 4, length: 42 },
  { angle: 107, distance: 178, delay: 28, length: 50 },
  { angle: 148, distance: 146, delay: 14, length: 36 },
] as const;

const asStyle = (style: Record<string, string | number>) => style as CSSProperties;

export function SlashSfxFx() {
  return (
    <div className={s.wrap} aria-hidden="true">
      <i className={s.telegraph} />
      <i className={`${s.slash} ${s.slashFirst}`} />
      <i className={`${s.slash} ${s.slashSecond}`} />
      <i className={s.impactCore} />
      <i className={s.impactRing} />
      <i className={s.afterimage} />
      {SPARKS.map((spark, index) => (
        <i
          key={`spark-${index}`}
          className={s.spark}
          style={asStyle({
            width: spark.length,
            "--spark-angle": `${spark.angle}deg`,
            "--spark-distance": `${spark.distance}px`,
            animationDelay: timing(230 + spark.delay),
          })}
        />
      ))}
    </div>
  );
}