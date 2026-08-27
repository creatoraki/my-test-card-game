import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from "react";
import { createPortal, flushSync } from "react-dom";
import type { ItemStack } from "@/items/types";
import { useExploreStore } from "@/store/exploreStore";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
import { victoryStagger, victoryTiming } from "@/ui/battle/victoryChoreo";
import { VICTORY_INVENTORY_COLORS } from "@/ui/battle/styles/inventoryPalettes";
import { inventoryThemeVars } from "@/ui/common/item/inventoryTheme";
import { captureCellRects, playFlip } from "./lootFlip";
import s from "./VictoryLootTray.module.css";

interface FlyingLoot {
  id: number;
  stack: ItemStack;
  from: { left: number; top: number };
  to: { left: number; top: number };
  width: number;
  height: number;
  delayMs: number;
}

interface Props {
  onPicked?: (uid: string) => void;
}

export interface VictoryLootTrayHandle {
  takeAll: () => void;
}

function findLootCell(grid: HTMLElement | null, uid: string): HTMLElement | null {
  if (!grid) return null;
  return Array.from(grid.querySelectorAll<HTMLElement>("[data-loot-uid]"))
    .find((cell) => cell.dataset.lootUid === uid) ?? null;
}

function findInventoryTarget(uid: string): DOMRect | null {
  const target = Array.from(
    document.querySelectorAll<HTMLElement>("#victory-backpack-panel [data-inventory-uid]"),
  ).find((cell) => cell.dataset.inventoryUid === uid);
  if (target) return target.getBoundingClientRect();

  return document.getElementById("victory-backpack-panel")?.getBoundingClientRect() ?? null;
}

const VictoryLootTray = forwardRef<VictoryLootTrayHandle, Props>(function VictoryLootTray({ onPicked }, ref) {
  const pendingLoot = useExploreStore((state) => state.session?.pendingLoot ?? []);
  const takeLoot = useExploreStore((state) => state.takeLoot);
  const takeAllLoot = useExploreStore((state) => state.takeAllLoot);
  const [hovered, setHovered] = useState<{ uid: string; point: TooltipPoint } | null>(null);
  const [flights, setFlights] = useState<FlyingLoot[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const nextFlightId = useRef(0);
  const entryIndexRef = useRef(new Map<string, number>());
  const flightTimersRef = useRef(new Map<number, number>());

  useEffect(() => () => {
    flightTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    flightTimersRef.current.clear();
  }, []);

  useEffect(() => {
    if (hovered && !pendingLoot.some((stack) => stack.uid === hovered.uid)) {
      setHovered(null);
    }
  }, [hovered, pendingLoot]);

  const enqueueFlights = (nextFlights: FlyingLoot[]) => {
    if (!nextFlights.length) return;
    setFlights((current) => [...current, ...nextFlights]);
    const timing = victoryTiming();
    nextFlights.forEach((flight) => {
      const timer = window.setTimeout(() => {
        flightTimersRef.current.delete(flight.id);
        setFlights((current) => current.filter((item) => item.id !== flight.id));
        onPicked?.(flight.stack.uid);
      }, flight.delayMs + timing.lootFlyMs);
      flightTimersRef.current.set(flight.id, timer);
    });
  };

  const createFlight = (stack: ItemStack, sourceRect: DOMRect, delayMs: number): FlyingLoot | null => {
    const targetRect = findInventoryTarget(stack.uid);
    if (!targetRect) return null;
    const width = sourceRect.width;
    const height = sourceRect.height;
    return {
      id: nextFlightId.current++,
      stack,
      from: { left: sourceRect.left, top: sourceRect.top },
      to: {
        left: targetRect.left + targetRect.width / 2 - width / 2,
        top: targetRect.top + targetRect.height / 2 - height / 2,
      },
      width,
      height,
      delayMs,
    };
  };

  const pick = (stack: ItemStack) => {
    setHovered(null);
    const index = pendingLoot.findIndex((item) => item.uid === stack.uid);
    if (index < 0) return;
    const grid = gridRef.current;
    const sourceRect = findLootCell(grid, stack.uid)?.getBoundingClientRect();
    const previous = captureCellRects(grid);

    flushSync(() => takeLoot(index));
    playFlip(gridRef.current, previous, victoryTiming().lootFlipMs);

    if (!sourceRect) {
      onPicked?.(stack.uid);
      return;
    }
    const flight = createFlight(stack, sourceRect, 0);
    if (flight) enqueueFlights([flight]);
    else onPicked?.(stack.uid);
  };

  const takeAll = () => {
    setHovered(null);
    const stacks = useExploreStore.getState().session?.pendingLoot ?? pendingLoot;
    if (!stacks.length) return;

    const grid = gridRef.current;
    const sources = stacks.map((stack) => ({
      stack,
      rect: findLootCell(grid, stack.uid)?.getBoundingClientRect(),
    }));
    const timing = victoryTiming();
    flushSync(() => takeAllLoot());

    const nextFlights: FlyingLoot[] = [];
    sources.forEach(({ stack, rect }, index) => {
      if (!rect) {
        onPicked?.(stack.uid);
        return;
      }
      const flight = createFlight(stack, rect, index * timing.lootBurstStaggerMs);
      if (flight) nextFlights.push(flight);
      else onPicked?.(stack.uid);
    });
    enqueueFlights(nextFlights);
  };

  useImperativeHandle(ref, () => ({ takeAll }));

  const hoveredStack = hovered
    ? pendingLoot.find((stack) => stack.uid === hovered.uid) ?? null
    : null;

  return (
    <div className={s["loot-tray"]}>
      <div className={s["loot-grid"]} aria-label="待拾取战利品" ref={gridRef}>
        {pendingLoot.length ? (
          pendingLoot.map((stack, index) => (
            <div
              className={s["loot-cell"]}
              data-loot-uid={stack.uid}
              key={stack.uid}
              style={{
                "--vc-delay": victoryStagger(entryIndexRef.current.get(stack.uid) ?? (() => {
                  entryIndexRef.current.set(stack.uid, index);
                  return index;
                })()),
              } as CSSProperties}
              onPointerEnter={(event) =>
                setHovered({
                  uid: stack.uid,
                  point: tooltipPointFromElement(event.currentTarget),
                })
              }
              onPointerLeave={() =>
                setHovered((current) => (current?.uid === stack.uid ? null : current))
              }
            >
              <ItemSlot
                stack={stack}
                showName
                onClick={() => pick(stack)}
                className={cx(s["loot-slot"])}
              />
            </div>
          ))
        ) : (
          Array.from({ length: 8 }, (_, index) => (
            <div className={s["empty-slot"]} key={`empty-${index}`} aria-hidden="true" />
          ))
        )}
      </div>
      {hoveredStack && hovered && (
        <ItemTooltip
          stack={hoveredStack}
          point={hovered.point}
          themeStyle={inventoryThemeVars(VICTORY_INVENTORY_COLORS)}
        />
      )}
      {flights.length > 0 && typeof document !== "undefined" &&
        createPortal(
          flights.map((flight) => (
            <div
              className={s["loot-fly"]}
              key={flight.id}
              style={
                {
                  "--fly-left": `${flight.from.left}px`,
                  "--fly-top": `${flight.from.top}px`,
                  "--fly-x": `${flight.to.left - flight.from.left}px`,
                  "--fly-y": `${flight.to.top - flight.from.top}px`,
                  "--fly-w": `${flight.width}px`,
                  "--fly-h": `${flight.height}px`,
                  "--fly-delay": `${flight.delayMs}ms`,
                } as CSSProperties
              }
            >
              <ItemSlot stack={flight.stack} showName />
            </div>
          )),
          document.body,
        )}
    </div>
  );
});

export { VictoryLootTray };
