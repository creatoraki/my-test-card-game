import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { ItemStack } from "@/items/types";
import { useExploreStore } from "@/store/exploreStore";
import ItemTooltip, {
  tooltipPointFromRect,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
import { VICTORY_CHOREO, victoryStagger } from "@/ui/battle/victoryChoreo";
import { VICTORY_INVENTORY_COLORS } from "@/ui/battle/styles/inventoryPalettes";
import { inventoryThemeVars } from "@/ui/common/item/inventoryTheme";
import s from "./VictoryLootTray.module.css";

interface FlyingLoot {
  id: number;
  stack: ItemStack;
  from: { left: number; top: number };
  to: { left: number; top: number };
}

interface Props {
  onPicked?: (uid: string) => void;
}

export function VictoryLootTray({ onPicked }: Props) {
  const pendingLoot = useExploreStore((state) => state.session?.pendingLoot ?? []);
  const takeLoot = useExploreStore((state) => state.takeLoot);
  const [hovered, setHovered] = useState<{ uid: string; point: TooltipPoint } | null>(null);
  const [flying, setFlying] = useState<FlyingLoot | null>(null);

  useEffect(() => {
    if (hovered && !pendingLoot.some((stack) => stack.uid === hovered.uid)) {
      setHovered(null);
    }
  }, [hovered, pendingLoot]);

  const pick = (stack: ItemStack) => {
    setHovered(null);
    if (flying) return;
    const source = document.querySelector<HTMLElement>(`[data-loot-uid="${stack.uid}"]`);
    const target = document.getElementById("victory-backpack-panel");
    const index = pendingLoot.findIndex((item) => item.uid === stack.uid);
    if (index < 0) return;
    if (!source || !target) {
      takeLoot(index);
      return;
    }

    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const id = Date.now();
    setFlying({
      id,
      stack,
      from: { left: sourceRect.left, top: sourceRect.top },
      to: {
        left: targetRect.left + targetRect.width / 2 - sourceRect.width / 2,
        top: targetRect.top + targetRect.height / 2 - sourceRect.height / 2,
      },
    });
    window.setTimeout(() => {
      takeLoot(index);
      const remaining = useExploreStore.getState().session?.pendingLoot ?? [];
      if (!remaining.some((item) => item.uid === stack.uid)) onPicked?.(stack.uid);
      setFlying((current) => (current?.id === id ? null : current));
    }, VICTORY_CHOREO.lootFlyMs);
  };

  const hoveredStack = hovered
    ? pendingLoot.find((stack) => stack.uid === hovered.uid) ?? null
    : null;

  return (
    <div className={s["loot-tray"]}>
      <div className={s["loot-grid"]} aria-label="待拾取战利品">
        {pendingLoot.length ? (
          pendingLoot.map((stack, index) => (
            <div
              className={s["loot-cell"]}
              data-loot-uid={stack.uid}
              key={stack.uid}
              style={{ "--vc-delay": victoryStagger(index) } as CSSProperties}
              onPointerEnter={(event) =>
                setHovered({
                  uid: stack.uid,
                  point: tooltipPointFromRect(event.currentTarget.getBoundingClientRect()),
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
                className={cx(s["loot-slot"], flying?.stack.uid === stack.uid && s["is-flying"])}
              />
            </div>
          ))
        ) : (
          <div className={s["loot-empty"]}>战利品已处理完毕</div>
        )}
      </div>
      {hoveredStack && hovered && (
        <ItemTooltip
          stack={hoveredStack}
          point={hovered.point}
          themeStyle={inventoryThemeVars(VICTORY_INVENTORY_COLORS)}
        />
      )}
      {flying && typeof document !== "undefined" &&
        createPortal(
          <div
            className={s["loot-fly"]}
            style={
              {
                "--fly-left": `${flying.from.left}px`,
                "--fly-top": `${flying.from.top}px`,
                "--fly-x": `${flying.to.left - flying.from.left}px`,
                "--fly-y": `${flying.to.top - flying.from.top}px`,
              } as CSSProperties
            }
          >
            <ItemSlot stack={flying.stack} showName={false} />
          </div>,
          document.body,
        )}
    </div>
  );
}
