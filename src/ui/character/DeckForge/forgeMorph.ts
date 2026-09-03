// 卡组锻造四种视图共用的尺寸与时序真相点。
// 两级 modal 都在画布正中，宽度统一后只改变同一个面板盒子的高度，因此不需要飞行副本。

import type { CSSProperties } from "react";
import { prefersReducedMotion } from "@/ui/app/transitions";
import { EASE_POP } from "@/ui/common/ModalReveal";

export type ForgeView = "hub" | "draw" | "remove" | "upgrade";

export const FORGE_W = 1080;
export const FORGE_H: Record<ForgeView, number> = {
  hub: 520,
  draw: 800,
  remove: 980,
  upgrade: 800,
};

const duration = (ms: number) => (prefersReducedMotion() ? 0 : ms);

export const SWAP_OUT_MS = duration(160);
export const MORPH_MS = duration(420);
export const SWAP_IN_MS = duration(260);
export const MORPH_EASE = EASE_POP;

export function forgeMorphVars(view: ForgeView): CSSProperties {
  return {
    "--fg-w": `${FORGE_W}px`,
    "--fg-h": `${FORGE_H[view]}px`,
    "--fg-out-ms": `${SWAP_OUT_MS}ms`,
    "--fg-morph-ms": `${MORPH_MS}ms`,
    "--fg-in-ms": `${SWAP_IN_MS}ms`,
    "--fg-ease": MORPH_EASE,
  } as CSSProperties;
}
