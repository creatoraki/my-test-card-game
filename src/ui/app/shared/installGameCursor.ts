const MIN_PRESS_MS = 120;

/** 使用原生光标定位，只管理按下反馈；悬浮态由组件的 CSS 决定。 */
export function installGameCursor() {
  const root = document.documentElement;
  // 读取 CSS 实际使用的 URL，避免图片优化插件让 JS 导入与 CSS 指向不同文件。
  const style = getComputedStyle(root);
  const images = ["--cursor-default", "--cursor-pointer", "--cursor-pressed"].map((name) => {
    const image = new Image();
    const url = style.getPropertyValue(name).match(/url\(["']?([^"')]+)["']?\)/)?.[1];
    if (url) image.src = url;
    return image;
  });
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
    const cursor = getComputedStyle(target).cursor;
    if (["not-allowed", "wait", "none"].includes(cursor)) return;
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
    images.length = 0;
    window.removeEventListener("pointerdown", onPointerDown, true);
    window.removeEventListener("pointerup", onPointerUp, true);
    window.removeEventListener("pointermove", onPointerMove, true);
    window.removeEventListener("pointerout", onPointerOut, true);
    window.removeEventListener("pointercancel", reset, true);
    window.removeEventListener("blur", reset);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
