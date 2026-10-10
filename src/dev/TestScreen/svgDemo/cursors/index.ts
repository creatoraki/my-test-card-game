import { BRASS_CURSOR } from "./brassCursor";
import { NEON_CURSOR } from "./neonCursor";
import { QUILL_CURSOR } from "./quillCursor";

export * from "./types";
export * from "./cursorSvg";

export const CURSOR_SCHEMES = [BRASS_CURSOR, NEON_CURSOR, QUILL_CURSOR] as const;
