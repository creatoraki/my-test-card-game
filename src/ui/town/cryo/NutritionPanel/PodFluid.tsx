import type { CSSProperties } from "react";
import s from "./PodFluid.module.css";

type FluidState = "locked" | "empty" | "pending" | "treating";

interface Props {
  state: FluidState;
  baseFill: number;
  gainFill: number;
}

function bubbleValue(index: number, modulus: number) {
  return (index * 2654435761) % modulus;
}

export function PodFluid({ state, baseFill, gainFill }: Props) {
  const bubbleCount = state === "treating" ? 14 : state === "pending" ? 9 : state === "empty" ? 4 : 0;
  const bubbleStart = state === "treating" ? 8 : state === "pending" ? 8 : 4;

  return (
    <span
      className={`${s.fluid} ${s[`is-${state}`]}`}
      style={{ "--bubble-start": `${bubbleStart}%`, "--base-fill": `${Math.max(0, Math.min(100, baseFill))}%` } as CSSProperties}
      aria-hidden
    >
      <span className={s.base} style={{ "--fill": `${Math.max(0, Math.min(100, baseFill))}%` } as CSSProperties} />
      <span className={s.gain} style={{ "--gain": `${Math.max(0, Math.min(100, gainFill))}%` } as CSSProperties} />
      {Array.from({ length: bubbleCount }, (_, index) => (
        <i
          key={index}
          className={s.bubble}
          style={
            {
              "--bubble-left": `${8 + bubbleValue(index + 1, 84)}%`,
              "--bubble-size": `${3 + bubbleValue(index + 7, 7)}px`,
              "--bubble-delay": `${bubbleValue(index + 11, 1500)}ms`,
              "--bubble-duration": `${2.6 + bubbleValue(index + 13, 18) / 10}s`,
            } as CSSProperties
          }
        />
      ))}
      {state === "treating" && <span className={s.scan} />}
    </span>
  );
}
