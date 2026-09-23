import { useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { ItemStack } from "@/items/types";
import { useExploreStore } from "@/store/explore/exploreStore";
import ItemSlot from "@/ui/common/item/ItemSlot";
import s from "./LootPickup.module.css";

interface FlyingLoot {
  id: number;
  stack: ItemStack;
  from: { left: number; top: number; width: number };
  to: { left: number; top: number };
}

/**
 * 单件拾取 + 飞入背包栏的动画。独立拾取浮层(LootPickup)与事件面板内的物品栏共用。
 * 物品格需带 data-loot-uid, 飞行起点从那里取; 终点是底部背包栏 #explore-backpack-bar。
 */
export function useLootPick() {
  const takeLoot = useExploreStore((state) => state.takeLoot);
  const [flying, setFlying] = useState<FlyingLoot | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  /** 返回是否成功放进背包。 */
  const pick = (stack: ItemStack): boolean => {
    if (flying) return false;
    const pendingLoot = useExploreStore.getState().session?.pendingLoot ?? [];
    const index = pendingLoot.findIndex((item) => item.uid === stack.uid);
    if (index < 0) return false;
    const sourceRect = document.querySelector<HTMLElement>(`[data-loot-uid="${stack.uid}"]`)?.getBoundingClientRect();
    const targetRect = document.getElementById("explore-backpack-bar")?.getBoundingClientRect();
    if (!takeLoot(index)) {
      setMessage("背包已满");
      return false;
    }
    setMessage(null);
    if (!sourceRect || !targetRect) return true;

    const id = Date.now();
    setFlying({
      id,
      stack,
      from: { left: sourceRect.left, top: sourceRect.top, width: sourceRect.width },
      to: {
        left: targetRect.left + targetRect.width / 2 - sourceRect.width / 2,
        top: targetRect.top + targetRect.height / 2 - sourceRect.height / 2,
      },
    });
    window.setTimeout(() => {
      setFlying((current) => (current?.id === id ? null : current));
    }, 430);
    return true;
  };

  const flyingPortal = flying && typeof document !== "undefined"
    ? createPortal(
      <div
        className={s["loot-fly"]}
        style={{
          "--fly-left": `${flying.from.left}px`,
          "--fly-top": `${flying.from.top}px`,
          "--fly-x": `${flying.to.left - flying.from.left}px`,
          "--fly-y": `${flying.to.top - flying.from.top}px`,
          "--fly-w": `${flying.from.width}px`,
        } as CSSProperties}
      >
        <ItemSlot stack={flying.stack} />
      </div>,
      document.body,
    )
    : null;

  return { pick, message, setMessage, flyingPortal };
}
