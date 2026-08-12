export interface CellRect {
  left: number;
  top: number;
}

export function captureCellRects(gridEl: HTMLElement | null): Map<string, CellRect> {
  const rects = new Map<string, CellRect>();
  if (!gridEl) return rects;

  gridEl.querySelectorAll<HTMLElement>("[data-loot-uid]").forEach((cell) => {
    const uid = cell.dataset.lootUid;
    if (!uid) return;
    rects.set(uid, { left: cell.offsetLeft, top: cell.offsetTop });
  });
  return rects;
}

export function playFlip(
  gridEl: HTMLElement | null,
  previous: Map<string, CellRect>,
  durationMs: number,
): void {
  if (!gridEl || durationMs <= 0) return;

  gridEl.querySelectorAll<HTMLElement>("[data-loot-uid]").forEach((cell) => {
    const uid = cell.dataset.lootUid;
    const before = uid ? previous.get(uid) : undefined;
    if (!before) return;

    const deltaX = before.left - cell.offsetLeft;
    const deltaY = before.top - cell.offsetTop;
    if (Math.abs(deltaX) < 0.5 && Math.abs(deltaY) < 0.5) return;

    cell.animate(
      [
        { transform: `translate(${deltaX}px, ${deltaY}px)` },
        { transform: "translate(0, 0)" },
      ],
      { duration: durationMs, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", fill: "both" },
    );
  });
}