import type { CSSProperties } from "react";
import { prefersReducedMotion } from "@/ui/app/transitions";

export const REVEAL_BAR_MS = 200;
export const REVEAL_MS = 760;
export const CLOSE_MS = 420;
export const EASE_POP = "cubic-bezier(0.16, 1, 0.3, 1)";

function duration(ms: number): number {
  return prefersReducedMotion() ? 0 : ms;
}

export function modalRevealVars(): CSSProperties {
  return {
    "--mr-bar-ms": `${duration(REVEAL_BAR_MS)}ms`,
    "--mr-reveal-ms": `${duration(REVEAL_MS)}ms`,
    "--mr-close-ms": `${duration(CLOSE_MS)}ms`,
    "--mr-ease-pop": EASE_POP,
  } as CSSProperties;
}

export function modalRevealTotalMs(): number {
  return duration(REVEAL_BAR_MS + REVEAL_MS);
}

export function modalRevealCloseMs(): number {
  return duration(CLOSE_MS);
}
