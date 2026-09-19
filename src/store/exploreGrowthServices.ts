import { getItemDef, rerollBond } from "@/data";
import { rngInt } from "@/engine/rng";
import { payServiceFood } from "@/explore/curio/foodPayment";
import { resolvePendingAction, syncPartyVitals } from "@/explore/session";
import { resetPerfectness } from "@/items/equipRoll";
import type { EquipSlot, ItemStack } from "@/items/types";
import { deriveStats, shiftVitals } from "./characterStats";
import { useExploreStore } from "./exploreStore";
import { useTownStore } from "./townStore";

export type ExploreEquipmentTarget = { kind: "backpack"; uid: string }
  | { kind: "equipped"; charId: string; slot: EquipSlot; uid: string };

export function canTuneEquipment(stack: ItemStack, mode: "bond" | "perfectness"): boolean {
  const def = getItemDef(stack.itemId);
  return def.category === "equipment" && (mode === "bond" ? Boolean(def.affinityRollable)
    : Boolean(def.model && stack.roll && def.model.budget.max > def.model.budget.min));
}

/** 在同一同步操作内检查目标、费用和待办，成功才写回；已穿装备同步探索快照。 */
export function tuneExploreEquipment(target: ExploreEquipmentTarget): boolean {
  const session = useExploreStore.getState().session;
  const action = session?.pendingActions[0];
  if (!session || action?.kind !== "equipmentTune" || action.result) return false;
  const town = useTownStore.getState();
  const character = target.kind === "equipped" ? town.characters[target.charId] : null;
  if (target.kind === "equipped" && !session.party.some(member => member.charId === target.charId && member.alive)) return false;
  const stack = target.kind === "backpack" ? session.backpack.find(item => item.uid === target.uid)
    : character?.equipped[target.slot];
  if (!stack || stack.uid !== target.uid || !canTuneEquipment(stack, action.mode)) return false;
  const draft = structuredClone(session);
  if (!payServiceFood(draft, action.foodCost)) return false;
  const def = getItemDef(stack.itemId);
  const after: ItemStack = action.mode === "bond"
    ? { ...stack, affinity: rerollBond(stack.affinity ?? def.affinity, n => rngInt(draft, n)) }
    : { ...stack, roll: resetPerfectness(def, stack.roll!, n => rngInt(draft, n)) };
  if (target.kind === "backpack") {
    draft.backpack = draft.backpack.map(item => item.uid === target.uid ? after : item);
  } else if (character) {
    const next = shiftVitals(character, { ...character, equipped: { ...character.equipped, [target.slot]: after } });
    const stats = deriveStats(next);
    syncPartyVitals(draft, target.charId, stats.maxHp, stats.burdenAdapt);
    useTownStore.setState({ characters: { ...town.characters, [target.charId]: next } });
  }
  const pending = draft.pendingActions[0];
  if (pending.kind === "equipmentTune") pending.result = { before: structuredClone(stack), after: structuredClone(after) };
  draft.pendingNotes.push(`${action.mode === "bond" ? "重铸羁绊" : "重置完美度"}完成，消耗食品 ×${action.foodCost}`);
  useExploreStore.setState({ session: draft });
  return true;
}

export function replaceExploreCard(charId: string, uid: string): boolean {
  const session = useExploreStore.getState().session;
  const action = session?.pendingActions[0];
  if (!session || action?.kind !== "replaceCard" || !session.party.some(member => member.charId === charId && member.alive)) return false;
  const draft = structuredClone(session);
  if (!payServiceFood(draft, action.foodCost ?? 0)) return false;
  if (!useTownStore.getState().replaceCardWithCommon(charId, uid)) return false;
  resolvePendingAction(draft);
  useExploreStore.setState({ session: draft });
  return true;
}
