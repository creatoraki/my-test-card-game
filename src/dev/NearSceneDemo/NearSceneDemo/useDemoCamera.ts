import { useEffect, useRef, useState, type RefObject } from "react";
import { CORRIDOR } from "@/explore/corridor/types";
import { applyCorridorFrame } from "@/ui/explore/CorridorScene/corridorFrame";

const SPEED = 480;
const LEFT_KEYS = new Set(["ArrowLeft", "KeyA"]);
const RIGHT_KEYS = new Set(["ArrowRight", "KeyD"]);

interface CameraNodes {
  world: RefObject<HTMLDivElement | null>;
  farStrip: RefObject<HTMLDivElement | null>;
  player: RefObject<HTMLDivElement | null>;
}

interface Target {
  id: string;
  x: number;
}

interface DemoMotion {
  walking: boolean;
  facing: -1 | 1;
  /** 交互半径内离角色最近的交互物。 */
  nearId: string | null;
}

function nearestTarget(targets: readonly Target[], x: number): string | null {
  let best: Target | null = null;
  for (const target of targets) {
    const d = Math.abs(target.x - x);
    if (d <= CORRIDOR.interactionRadius && (!best || d < Math.abs(best.x - x))) best = target;
  }
  return best?.id ?? null;
}

/**
 * 演示用镜头：方向键移动参照角色，镜头跟随（复用探索场景的 applyCorridorFrame，远景视差一致）。
 * 自动巡航时角色在房间两端之间往返。位置没变化的帧不写 DOM；最近交互物变化时才提交状态。
 */
export function useDemoCamera(width: number, auto: boolean, nodes: CameraNodes, targets: readonly Target[]): DemoMotion {
  const [walking, setWalking] = useState(false);
  const [facing, setFacing] = useState<-1 | 1>(1);
  const [nearId, setNearId] = useState<string | null>(null);
  const widthRef = useRef(width);
  const autoRef = useRef(auto);
  const targetsRef = useRef(targets);
  widthRef.current = width;
  autoRef.current = auto;
  targetsRef.current = targets;

  useEffect(() => {
    const held = { left: false, right: false };
    const onKey = (down: boolean) => (event: KeyboardEvent) => {
      if (LEFT_KEYS.has(event.code)) held.left = down;
      else if (RIGHT_KEYS.has(event.code)) held.right = down;
      else return;
      event.preventDefault();
    };
    const onDown = onKey(true);
    const onUp = onKey(false);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);

    let x = CORRIDOR.viewportWidth / 2;
    let cruise: -1 | 1 = 1;
    let lastX = Number.NaN;
    let lastWidth = Number.NaN;
    let lastWalking = false;
    let lastFacing: -1 | 1 = 1;
    let lastNear: string | null = null;
    let lastTargets: readonly Target[] | null = null;
    let lastTime = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const w = widthRef.current;
      const min = CORRIDOR.walkMin;
      const max = w - CORRIDOR.walkMin;
      let dir = (held.right ? 1 : 0) - (held.left ? 1 : 0);
      if (dir === 0 && autoRef.current) {
        if (x >= max - 1) cruise = -1;
        if (x <= min + 1) cruise = 1;
        dir = cruise;
      }
      x = Math.max(min, Math.min(max, x + dir * SPEED * dt));
      const moved = x !== lastX || w !== lastWidth;
      if (moved) {
        applyCorridorFrame({ world: nodes.world.current, farStrip: nodes.farStrip.current, player: nodes.player.current }, x, w);
        lastX = x;
        lastWidth = w;
      }
      if (moved || targetsRef.current !== lastTargets) {
        lastTargets = targetsRef.current;
        const near = nearestTarget(lastTargets, x);
        if (near !== lastNear) {
          lastNear = near;
          setNearId(near);
        }
      }
      const moving = dir !== 0 && x > min && x < max;
      if (moving !== lastWalking) {
        lastWalking = moving;
        setWalking(moving);
      }
      if (dir !== 0 && dir !== lastFacing) {
        lastFacing = dir as -1 | 1;
        setFacing(lastFacing);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [nodes.world, nodes.farStrip, nodes.player]);

  return { walking, facing, nearId };
}
