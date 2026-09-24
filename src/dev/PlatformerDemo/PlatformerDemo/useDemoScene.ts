import { useCallback, useRef, useState } from "react";
import { designRectOf } from "@/ui/app/shared/stage";
import type { EnemyMode, PickupKind, PickupSpawn, WorldEvent } from "../types";
import { ENEMIES, PICKUPS } from "../engine/level";
import { inPickupRange } from "../engine/pickup";
import { createWorld, stepWorld } from "../engine/world";
import { useGameLoop } from "../hooks/useGameLoop";
import { useKeyboard } from "../hooks/useKeyboard";
import { emptyBackpack, type BackpackCounts, type Flight } from "../parts/Backpack";
import { applyEnemyView, type EnemyView } from "../parts/ShadowEnemy";
import { PX, cameraPx } from "../render/core/grid";
import type { PixelStageHandle } from "../render/PixelStage";

export interface ShadowSummary {
  left: number;
  alerted: number;
}

const FULL_SUMMARY: ShadowSummary = { left: ENEMIES.length, alerted: 0 };

function summarize(modes: Map<string, EnemyMode>): ShadowSummary {
  let left = 0;
  let alerted = 0;
  for (const mode of modes.values()) {
    if (mode !== "vanish" && mode !== "gone") left++;
    if (mode === "alert" || mode === "chase") alerted++;
  }
  return { left, alerted };
}

function centerOf(el: HTMLElement | null | undefined) {
  const rect = el ? designRectOf(el) : null;
  return rect ? { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 } : null;
}

/**
 * 场景编排：逻辑世界存 ref，由固定步长循环推进并直接写 DOM；
 * 只有拾取、敌人状态计数、飞入动画、重置这些离散变化才进入 React 状态。
 */
export function useDemoScene() {
  const world = useRef(createWorld());
  const input = useKeyboard();
  const stage = useRef<PixelStageHandle>(null);
  const worldLayer = useRef<HTMLDivElement>(null);
  const enemyViews = useRef(new Map<string, EnemyView>()).current;
  const pickupEls = useRef(new Map<string, HTMLDivElement>()).current;
  const slotEls = useRef(new Map<PickupKind, HTMLElement>()).current;
  const modes = useRef(new Map<string, EnemyMode>(ENEMIES.map((e) => [e.id, "patrol"])));
  const flightId = useRef(0);

  const [resetKey, setResetKey] = useState(0);
  const [taken, setTaken] = useState<ReadonlySet<string>>(() => new Set());
  const [counts, setCounts] = useState<BackpackCounts>(emptyBackpack);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [shadows, setShadows] = useState<ShadowSummary>(FULL_SUMMARY);

  const onEvent = useCallback((event: WorldEvent) => {
    if (event.type !== "enemyMode") return;
    modes.current.set(event.id, event.mode);
    const next = summarize(modes.current);
    setShadows((prev) => (prev.left === next.left && prev.alerted === next.alerted ? prev : next));
  }, []);

  useGameLoop(
    (dt) => stepWorld(world.current, input.current, dt, onEvent),
    (frameDt) => {
      const w = world.current;
      stage.current?.render(w, frameDt);
      if (worldLayer.current) worldLayer.current.style.transform = `translate3d(${-cameraPx(w.camera) * PX}px, 0, 0)`;
      for (const enemy of w.enemies) {
        const view = enemyViews.get(enemy.id);
        if (view) applyEnemyView(view, enemy);
      }
      for (const spawn of PICKUPS) {
        const el = pickupEls.get(spawn.id);
        if (!el) continue;
        const near = inPickupRange(w.player, spawn) ? "true" : "false";
        if (el.dataset.near !== near) el.dataset.near = near;
      }
    },
  );

  const registerEnemy = useCallback((id: string, view: EnemyView) => {
    enemyViews.set(id, view);
  }, [enemyViews]);

  const registerPickup = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) pickupEls.set(id, el);
    else pickupEls.delete(id);
  }, [pickupEls]);

  const registerSlot = useCallback((kind: PickupKind, el: HTMLElement | null) => {
    if (el) slotEls.set(kind, el);
  }, [slotEls]);

  const pick = useCallback((spawn: PickupSpawn, el: HTMLElement) => {
    if (!inPickupRange(world.current.player, spawn)) return false;
    const from = centerOf(el);
    const to = centerOf(slotEls.get(spawn.kind));
    setTaken((prev) => new Set(prev).add(spawn.id));
    if (from && to) {
      setFlights((prev) => [...prev, { id: ++flightId.current, kind: spawn.kind, from, to }]);
    } else {
      setCounts((prev) => ({ ...prev, [spawn.kind]: prev[spawn.kind] + 1 }));
    }
    return true;
  }, [slotEls]);

  const arrive = useCallback((flight: Flight) => {
    setFlights((prev) => prev.filter((f) => f.id !== flight.id));
    setCounts((prev) => ({ ...prev, [flight.kind]: prev[flight.kind] + 1 }));
  }, []);

  const reset = useCallback(() => {
    world.current = createWorld();
    modes.current = new Map(ENEMIES.map((e) => [e.id, "patrol"]));
    enemyViews.clear();
    setTaken(new Set());
    setCounts(emptyBackpack());
    setFlights([]);
    setShadows(FULL_SUMMARY);
    setResetKey((n) => n + 1);
  }, [enemyViews]);

  return {
    stage,
    worldLayer,
    resetKey,
    taken,
    counts,
    flights,
    shadows,
    registerEnemy,
    registerPickup,
    registerSlot,
    pick,
    arrive,
    reset,
  };
}
