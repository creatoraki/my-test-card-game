import { useEffect, useRef, useState, type CSSProperties, type WheelEvent } from "react";
import { getItemDef } from "@/data";
import type { ItemStack } from "@/items/types";
import ItemSlot from "@/ui/common/item/ItemSlot";
import ItemTooltip, { tooltipPointFromElement, type TooltipPoint } from "@/ui/common/item/ItemTooltip";
import { ItemActionMask, useSlotActionMode } from "@/ui/common/item/ItemActionMask";
import { useLootSlotActions } from "@/ui/common/item/ModuleInstall";
import { inventoryThemeVars } from "@/ui/common/item/shared/inventoryTheme";
import { EXPLORE_BACKPACK_COLORS } from "@/ui/explore/styles/inventoryPalettes";
import s from "./DossierLoot.module.css";

/** 新手引导锚点, 与独立拾取浮层(LootPickup)一致。 */
function guideAnchor(stack: ItemStack, isModule: boolean): string | undefined {
  if (isModule) return "loot-module";
  return getItemDef(stack.itemId).category === "equipment" ? "loot-equipment" : undefined;
}

/**
 * 结算页的可拾取物品栏: 放在右侧插画区下部, 固定宽度、横向滚动(滚轮也横向滚), 从右侧滑入。
 * 点物品进入交互模式: 遮罩上竖排「拾取」(模组为「装载 / 拾取」), 移出格子退出(见 ItemActionMask)。
 * 物品格带 data-loot-uid, 供 useLootPick 取飞行起点。
 */
export function DossierLoot({
  items,
  message,
  onPick,
}: {
  items: ItemStack[];
  message: string | null;
  onPick: (stack: ItemStack) => void;
}) {
  const [hovered, setHovered] = useState<{ uid: string; point: TooltipPoint } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lootActions = useLootSlotActions({ onTake: onPick });
  const actionMode = useSlotActionMode(items.map((stack) => stack.uid));
  const hoveredStack = hovered ? items.find((stack) => stack.uid === hovered.uid) ?? null : null;

  useEffect(() => {
    if (hovered && !hoveredStack) setHovered(null);
  }, [hovered, hoveredStack]);

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    track.scrollLeft += event.deltaY;
  };

  return (
    <div className={s.loot} aria-label="可拾取物品">
      <p className={s.head}>
        <i aria-hidden />
        <span>可拾取物品</span>
        <b>{items.length}</b>
        <span>件</span>
        <em data-alert={message ? true : undefined}>{message ?? "点击物品选择拾取"}</em>
      </p>
      <div ref={trackRef} className={s.track} onWheel={onWheel}>
        {items.map((stack, index) => (
          <div
            key={stack.uid}
            className={s.item}
            style={{ "--i": index } as CSSProperties}
            data-loot-uid={stack.uid}
            data-guide-anchor={guideAnchor(stack, lootActions.isModule(stack))}
            onPointerEnter={(event) => setHovered({ uid: stack.uid, point: tooltipPointFromElement(event.currentTarget) })}
            onPointerLeave={() => {
              setHovered((current) => (current?.uid === stack.uid ? null : current));
              actionMode.closeIf(stack.uid);
            }}
          >
            <ItemSlot
              stack={stack}
              showName={false}
              onClick={() => actionMode.open(stack.uid)}
            />
            {actionMode.activeUid === stack.uid && (
              <ItemActionMask actions={lootActions.actionsFor(stack)} onDismiss={actionMode.close} />
            )}
          </div>
        ))}
      </div>
      {hoveredStack && hovered && (
        <ItemTooltip stack={hoveredStack} point={hovered.point} themeStyle={inventoryThemeVars(EXPLORE_BACKPACK_COLORS)} />
      )}
      {lootActions.overlay}
    </div>
  );
}
