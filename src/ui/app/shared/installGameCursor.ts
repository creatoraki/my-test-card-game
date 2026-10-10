import { buildGameCursorCss } from "@/ui/art/cursor";

const MIN_PRESS_MS = 120;
/** 这些光标下不切换按下态：禁止、加载、隐藏，以及拖拽(由 grabbing 自己表达)。 */
const NO_PRESS_KEYWORDS = new Set(["not-allowed", "wait", "none", "grab", "grabbing"]);

/** 计算后的 cursor 形如 `url(...) 3 2, pointer`，取末尾回落关键字判断语义。 */
function cursorKeyword(cursor: string) {
  return cursor.slice(cursor.lastIndexOf(",") + 1).trim();
}

/** 注入黄铜指针主题：根节点 --cursor-* 变量 + 加载圆环关键帧。 */
function installCursorTheme() {
  const style = document.createElement("style");
  style.dataset.gameCursor = "";
  style.textContent = buildGameCursorCss();
  document.head.appendChild(style);
  return () => style.remove();
}

/** 使用原生光标定位，注入指针主题并管理按下反馈；悬浮态由组件的 CSS 决定。 */
export function installGameCursor() {
  const root = document.documentElement;
  const disposeTheme = installCursorTheme();
  let pointerId: number | null = null;
  let pressedAt = 0;
  let releaseTimer: number | undefined;

  const reset = () => {
    window.clearTimeout(releaseTimer);
    releaseTimer = undefined;
    pointerId = null;
    root.removeAttribute("data-cursor-pressed");
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    reset();
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest(":disabled, [aria-disabled='true'], [inert]")) return;
    if (NO_PRESS_KEYWORDS.has(cursorKeyword(getComputedStyle(target).cursor))) return;
    pointerId = event.pointerId;
    pressedAt = performance.now();
    root.setAttribute("data-cursor-pressed", "");
  };

  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== pointerId || event.button !== 0) return;
    pointerId = null;
    releaseTimer = window.setTimeout(reset, Math.max(0, MIN_PRESS_MS - (performance.now() - pressedAt)));
  };

  const onPointerMove = (event: PointerEvent) => {
    // 鼠标在窗口外松开后重新进入时，避免残留按下态。
    if (event.pointerId === pointerId && !(event.buttons & 1)) reset();
  };

  const onPointerOut = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.relatedTarget === null) reset();
  };

  const onVisibilityChange = () => {
    if (document.hidden) reset();
  };

  window.addEventListener("pointerdown", onPointerDown, true);
  window.addEventListener("pointerup", onPointerUp, true);
  window.addEventListener("pointermove", onPointerMove, true);
  window.addEventListener("pointerout", onPointerOut, true);
  window.addEventListener("pointercancel", reset, true);
  window.addEventListener("blur", reset);
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    reset();
    disposeTheme();
    window.removeEventListener("pointerdown", onPointerDown, true);
    window.removeEventListener("pointerup", onPointerUp, true);
    window.removeEventListener("pointermove", onPointerMove, true);
    window.removeEventListener("pointerout", onPointerOut, true);
    window.removeEventListener("pointercancel", reset, true);
    window.removeEventListener("blur", reset);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
