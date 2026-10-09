import { useEffect, useState } from "react";
import { CORRIDOR, corridorWalkMax } from "@/explore/corridor/types";

/** 预览页只处理移动，不写入正式远征或触发行走消耗。 */
export function usePreviewMovement(width: number, onFrame: (x: number) => void) {
  const [motion, setMotion] = useState<{ walking: boolean; facing: -1 | 1 }>({ walking: false, facing: 1 });
  useEffect(() => {
    const keys = new Set<string>();
    let x: number = CORRIDOR.walkMin;
    let previous = performance.now();
    let frame = 0;
    let walking = false;
    let facing: -1 | 1 = 1;
    const stop = () => {
      keys.clear();
      walking = false;
      setMotion({ walking, facing });
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
      if ((event.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (!["ArrowLeft", "ArrowRight", "KeyA", "KeyD"].includes(event.code)) return;
      event.preventDefault();
      keys.add(event.code);
    };
    const keyUp = (event: KeyboardEvent) => { keys.delete(event.code); };
    const visibility = () => { if (document.hidden) stop(); };
    const tick = (now: number) => {
      const elapsed = Math.min((now - previous) / 1000, 0.1);
      previous = now;
      const direction = Number(keys.has("ArrowRight") || keys.has("KeyD")) - Number(keys.has("ArrowLeft") || keys.has("KeyA"));
      const next = Math.max(CORRIDOR.walkMin, Math.min(corridorWalkMax(width), x + direction * CORRIDOR.speed * elapsed));
      const nextWalking = next !== x;
      const nextFacing = direction ? (direction < 0 ? -1 : 1) : facing;
      if (nextWalking !== walking || nextFacing !== facing) {
        walking = nextWalking;
        facing = nextFacing;
        setMotion({ walking, facing });
      }
      x = next;
      onFrame(x);
      frame = requestAnimationFrame(tick);
    };
    onFrame(x);
    frame = requestAnimationFrame(tick);
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [width, onFrame]);
  return motion;
}
