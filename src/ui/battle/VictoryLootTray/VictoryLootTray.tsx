import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type CSSProperties } from "react";
import type { ItemStack } from "@/items/types";
import { useExploreStore } from "@/store/exploreStore";
import ItemTooltip, {
  tooltipPointFromElement,
  type TooltipPoint,
} from "@/ui/common/item/ItemTooltip";
import ItemSlot from "@/ui/common/item/ItemSlot";
import { cx } from "@/ui/common/cx";
import { victoryStagger } from "@/ui/battle/victoryChoreo";
import { VICTORY_INVENTORY_COLORS } from "@/ui/battle/styles/inventoryPalettes";
import { inventoryThemeVars } from "@/ui/common/item/inventoryTheme";
import victoryCell from "@/ui/battle/styles/victoryCell.module.css";
import s from "./VictoryLootTray.module.css";

const LOOT_SLOT_COUNT = 8;

interface Props {
  onPicked?: (uid: string) => void;
}

export interface VictoryLootTrayHandle {
  takeAll: () => void;
}

const VictoryLootTray = forwardRef<VictoryLootTrayHandle, Props>(function VictoryLootTray({ onPicked }, ref) {
  const pendingLoot = useExploreStore((state) => state.session?.pendingLoot ?? []);
  const takeLoot = useExploreStore((state) => state.takeLoot);
  const takeAllLoot = useExploreStore((state) => state.takeAllLoot);
  const [hovered, setHovered] = useState<{ uid: string; point: TooltipPoint } | null>(null);
  const entryIndexRef = useRef(new Map<string, number>());

  useEffect(() => {
    if (hovered && !pendingLoot.some((stack) => stack.uid === hovered.uid)) {
      setHovered(null);
    }
  }, [hovered, pendingLoot]);

  const pick = (stack: ItemStack) => {
    setHovered(null);
    const index = pendingLoot.findIndex((item) => item.uid === stack.uid);
    if (index < 0) return;
    takeLoot(index);
    onPicked?.(stack.uid);
  };

  const takeAll = () => {
    setHovered(null);
    const stacks = useExploreStore.getState().session?.pendingLoot ?? pendingLoot;
    if (!stacks.length) return;
    takeAllLoot();
    stacks.forEach((stack) => onPicked?.(stack.uid));
  };

  useImperativeHandle(ref, () => ({ takeAll }));

  const hoveredStack = hovered
    ? pendingLoot.find((stack) => stack.uid === hovered.uid) ?? null
    : null;
  const cells = [
    ...pendingLoot,
    ...Array.from({ length: Math.max(0, LOOT_SLOT_COUNT - pendingLoot.length) }, () => null),
  ];

  return (
    <div className={s["loot-tray"]}>
      <div className={cx(victoryCell.grid, s["loot-grid"])} aria-label="待拾取战利品">
        {cells.map((stack, index) => (
          stack ? (
            <div
              className={cx(victoryCell.cell, s["loot-cell"])}
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
                showName={false}
                onClick={() => pick(stack)}
                className={cx(s["loot-slot"])}
              />
            </div>
          ) : (
            <div className={cx(victoryCell.empty, s["empty-slot"])} key={`empty-${index}`} aria-hidden="true" />
          )
        ))}
      </div>
      {hoveredStack && hovered && (
        <ItemTooltip
          stack={hoveredStack}
          point={hovered.point}
          themeStyle={inventoryThemeVars(VICTORY_INVENTORY_COLORS)}
        />
      )}
    </div>
  );
});

export { VictoryLootTray };
