import { useCallback, useEffect, useState } from "react";
import { getItemDef } from "@/data";
import { canOpenBackpack, canUseItem } from "@/explore/session";
import type { ExploreState } from "@/explore/types";
import { TARGETED_ITEM_USE_KINDS, SLOT_LABEL, type ItemStack, type EquipSlot } from "@/items/types";
import { useExploreStore } from "@/store/exploreStore";
import { useRunStore } from "@/store/runStore";

export function useExploreInventory(session: ExploreState | null) {
  const [bagOpen, setBagOpen] = useState(false);
  const [picnicOpen, setPicnicOpen] = useState(false);
  const [detailCharId, setDetailCharId] = useState<string | null>(null);
  const [target, setTarget] = useState<ItemStack | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const allowed = Boolean(session && canOpenBackpack(session));

  useEffect(() => {
    if (!allowed) { setBagOpen(false); setPicnicOpen(false); setDetailCharId(null); setTarget(null); }
  }, [allowed]);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 3000);
    return () => window.clearTimeout(timer);
  }, [message]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setTarget(null); setDetailCharId(null); setPicnicOpen(false); setBagOpen(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);

  const useItem = useCallback((stack: ItemStack) => {
    const current = useExploreStore.getState().session;
    if (!current || !canUseItem(current)) return;
    const def = getItemDef(stack.itemId);
    if (!def.use) return;
    setBagOpen(false);
    if ((TARGETED_ITEM_USE_KINDS as readonly string[]).includes(def.use.kind)) { setTarget(stack); return; }
    setMessage(useExploreStore.getState().useItem(stack.uid));
  }, []);

  const chooseMember = (charId: string) => {
    if (target) {
      const result = useExploreStore.getState().useItem(target.uid, charId);
      setMessage(result ?? "该队员当前无法使用这件物品");
      if (result) setTarget(null);
    } else setDetailCharId(charId);
  };
  const equip = (uid: string) => {
    if (!detailCharId) return;
    setMessage(useRunStore.getState().equipFromBackpack(detailCharId, uid) ? "装备已更换" : "无法更换装备，请检查背包空间");
  };
  const unequip = (slot: EquipSlot) => {
    if (!detailCharId) return;
    setMessage(useRunStore.getState().unequipToBackpack(detailCharId, slot) ? `已卸下${SLOT_LABEL[slot]}` : "背包空间不足，无法卸下装备");
  };
  const mustReplace = Boolean(session?.pendingPickup.length);
  return {
    allowed, bagOpen: bagOpen || mustReplace, picnicOpen, detailCharId, target, message,
    blocked: bagOpen || mustReplace || picnicOpen || Boolean(detailCharId || target),
    setBagOpen, setPicnicOpen, setDetailCharId, setTarget, useItem, chooseMember, equip, unequip,
  };
}

export type ExploreInventoryState = ReturnType<typeof useExploreInventory>;
