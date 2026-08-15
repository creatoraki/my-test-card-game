import type { CSSProperties } from "react";
import { prefersReducedMotion } from "@/ui/app/transitions";

export const PANEL_BAR_MS = 180;
export const PANEL_EXPAND_MS = 520;
export const PANEL_CLOSE_MS = 380;
export const PANEL_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function duration(ms: number): number {
  return prefersReducedMotion() ? 0 : ms;
}

export function panelRevealVars(): CSSProperties {
  return {
    "--pr-bar-ms": `${duration(PANEL_BAR_MS)}ms`,
    "--pr-expand-ms": `${duration(PANEL_EXPAND_MS)}ms`,
    "--pr-close-ms": `${duration(PANEL_CLOSE_MS)}ms`,
    "--pr-ease": PANEL_EASE,
  } as CSSProperties;
}

export function panelRevealCloseMs(): number {
  return duration(PANEL_CLOSE_MS);
}