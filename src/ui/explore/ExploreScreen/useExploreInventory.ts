import { useCallback, useEffect, useState } from "react";
import { getItemDef } from "@/data";
import { canOpenBackpack, canUseItem } from "@/explore/session";
import type { ExploreState } from "@/explore/types";
import { TARGETED_ITEM_USE_KINDS, type ItemStack, type EquipSlot } from "@/items/types";
import { useExploreStore } from "@/store/explore/exploreStore";
import { useRunStore } from "@/store/run/runStore";

export function useExploreInventory(session: ExploreState | null) {
  const [bagOpen, setBagOpen] = useState(false);
  const [picnicOpen, setPicnicOpen] = useState(false);
  const [beaconPicking, setBeaconPicking] = useState(false);
  const [atlasOpen, setAtlasOpen] = useState(false);
  const [detailCharId, setDetailCharId] = useState<string | null>(null);
  const [target, setTarget] = useState<ItemStack | null>(null);
  // 选人使用物品被拒(目标不适用)时, 在该队员框上闪一下红框 —— seq 让连续点同一人也能重播。
  const [rejected, setRejected] = useState<{ charId: string; seq: number } | null>(null);
  const allowed = Boolean(session && canOpenBackpack(session));

  useEffect(() => {
    if (!allowed) { setBagOpen(false); setPicnicOpen(false); setBeaconPicking(false); setAtlasOpen(false); setDetailCharId(null); setTarget(null); }
  }, [allowed]);
  useEffect(() => {
    if (!rejected) return;
    const timer = window.setTimeout(() => setRejected(null), 520);
    return () => window.clearTimeout(timer);
  }, [rejected]);
  useEffect(() => { if (!target) setRejected(null); }, [target]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setTarget(null); setDetailCharId(null); setPicnicOpen(false); setBeaconPicking(false); setAtlasOpen(false); setBagOpen(false);
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
    useExploreStore.getState().useItem(stack.uid);
  }, []);

  const chooseMember = (charId: string) => {
    if (target) {
      if (useExploreStore.getState().useItem(target.uid, charId)) setTarget(null);
      else setRejected((prev) => ({ charId, seq: (prev?.seq ?? 0) + 1 }));
    } else setDetailCharId(charId);
  };
  const equip = (uid: string) => {
    if (!detailCharId) return;
    useRunStore.getState().equipFromBackpack(detailCharId, uid);
  };
  const unequip = (slot: EquipSlot) => {
    if (!detailCharId) return;
    useRunStore.getState().unequipToBackpack(detailCharId, slot);
  };
  const mustReplace = Boolean(session?.pendingPickup.length);
  return {
    allowed, bagOpen: bagOpen || mustReplace, picnicOpen, beaconPicking, atlasOpen, detailCharId, target, rejected,
    blocked: bagOpen || mustReplace || picnicOpen || atlasOpen || beaconPicking || Boolean(detailCharId || target),
    setBagOpen, setPicnicOpen, setBeaconPicking, setAtlasOpen, setDetailCharId, setTarget, useItem, chooseMember, equip, unequip,
  };
}

export type ExploreInventoryState = ReturnType<typeof useExploreInventory>;
