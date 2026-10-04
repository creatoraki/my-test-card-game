import type { EffectDescriptor } from "@/engine/types";

// 咒术师词条门控的简写。invert = 词条未满足时才结算(用于"满足后改为……"的另一分支)。
export const venom = (n: number, invert?: true): EffectDescriptor["keywordGate"] => ({ kind: "venom", n, ...(invert ? { invert } : {}) });
export const late = (n: number, invert?: true): EffectDescriptor["keywordGate"] => ({ kind: "late", n, ...(invert ? { invert } : {}) });

export const HEXER_ID = "hexer";
