import { useEffect, useRef, useState } from "react";
import { hasCorridorRewards } from "@/explore/corridor/corridorSession";
import type { ItemStack } from "@/items/types";
import { useExploreStore } from "@/store/explore/exploreStore";
import { playSfx } from "@/ui/audio";
import { useLootPick } from "@/ui/explore/LootPickup";

/** 单件拾取的飞行动画时长; 拾完最后一件要等它飞完再关面板。 */
const FLY_MS = 430;
/** 「放弃一切」二次确认的保留时长, 超时自动撤回。 */
const CONFIRM_MS = 3000;

/**
 * 事件面板内的掉落处理: 单件拾取 / 全部拾取 / 放弃一切(原地二次确认)。
 * 掉落处理完且没有其他待处理奖励时, 直接结束事件、关闭面板。
 */
export function useCurioLoot() {
  const loot = useLootPick();
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);
  useEffect(() => {
    if (!confirmAbandon) return;
    const timer = window.setTimeout(() => setConfirmAbandon(false), CONFIRM_MS);
    return () => window.clearTimeout(timer);
  }, [confirmAbandon]);

  const finishIfClear = () => {
    const store = useExploreStore.getState();
    if (store.session && !hasCorridorRewards(store.session)) store.confirmNode();
  };

  const pick = (stack: ItemStack) => {
    if (!loot.pick(stack)) return;
    playSfx("pickup");
    setConfirmAbandon(false);
    if (!useExploreStore.getState().session?.pendingLoot.length) {
      timers.current.push(window.setTimeout(finishIfClear, FLY_MS));
    }
  };

  const takeAll = () => {
    const store = useExploreStore.getState();
    store.takeAllLoot();
    playSfx("pickupAll");
    setConfirmAbandon(false);
    if (useExploreStore.getState().session?.pendingLoot.length) {
      loot.setMessage("背包已满，剩余物品仍可单独拾取");
      return;
    }
    finishIfClear();
  };

  const abandon = () => {
    if (!confirmAbandon) {
      setConfirmAbandon(true);
      return;
    }
    useExploreStore.getState().abandonLoot();
    setConfirmAbandon(false);
    finishIfClear();
  };

  return { pick, takeAll, abandon, confirmAbandon, message: loot.message, flyingPortal: loot.flyingPortal };
}

export type CurioLoot = ReturnType<typeof useCurioLoot>;
