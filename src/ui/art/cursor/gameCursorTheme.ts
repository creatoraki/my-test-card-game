import { cursorCssValue } from "./cursorSvg";
import { BRASS_CURSOR, BRASS_WAIT_CYCLE_MS, BRASS_WAIT_FRAMES, type BrassCursorState } from "./brassCursor";

/**
 * 全局指针渲染尺寸。★ 必须 ≤ 32 DIP：Chrome 会把「大于 32×32 DIP 且图形与原生 UI 相交」的
 * 自定义指针整张丢弃并回落到关键字，表现为一贴近视口边缘就变回系统指针。
 */
export const GAME_CURSOR_SIZE = 32;

/** 加载圆环关键帧名；全局样式 [data-cursor-busy] 引用它。 */
export const GAME_CURSOR_WAIT_ANIMATION = "game-cursor-wait";

/** CSS 变量 → 指针状态 + 图片失效时回落的系统关键字。 */
const VARIABLES: readonly [string, BrassCursorState, string][] = [
  ["--cursor-default", "default", "default"],
  ["--cursor-pointer", "pointer", "pointer"],
  ["--cursor-pressed", "pressed", "pointer"],
  ["--cursor-help", "help", "help"],
  ["--cursor-forbidden", "forbidden", "not-allowed"],
  ["--cursor-wait", "wait", "wait"],
  ["--cursor-grab", "grab", "grab"],
  ["--cursor-grabbing", "grabbing", "grabbing"],
  ["--cursor-aim", "aim", "crosshair"],
];

/** 生成整套指针主题样式：根节点变量 + 加载圆环逐帧关键帧。 */
export function buildGameCursorCss(size = GAME_CURSOR_SIZE) {
  const vars = VARIABLES.map(([name, state, fallback]) => `  ${name}: ${cursorCssValue(BRASS_CURSOR[state], size, fallback)};`);
  const frames = BRASS_WAIT_FRAMES.map((glyph, i) => {
    const at = ((i / BRASS_WAIT_FRAMES.length) * 100).toFixed(3);
    return `  ${at}% { cursor: ${cursorCssValue(glyph, size, "wait")}; }`;
  });
  return `html:root {\n${vars.join("\n")}\n  --cursor-wait-cycle: ${BRASS_WAIT_CYCLE_MS}ms;\n}\n`
    + `@keyframes ${GAME_CURSOR_WAIT_ANIMATION} {\n${frames.join("\n")}\n}\n`;
}
