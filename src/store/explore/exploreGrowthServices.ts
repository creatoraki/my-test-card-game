import { getItemDef, rerollBond } from "@/data";
import { cardDisplayName } from "@/engine";
import { rngInt } from "@/engine/core/rng";
import { payServiceFood } from "@/explore/curio/foodPayment";
import { syncPartyVitals } from "@/explore/session";
import { resetPerfectness } from "@/items/equipRoll";
import type { EquipSlot, ItemStack } from "@/items/types";
import { deriveStats, shiftVitals } from "../town/characterStats";
import { useExploreStore } from "./exploreStore";
import { useTownStore } from "../town/townStore";

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

/**
 * 普通卡替换: 扣食品 → 换卡 → 把前后两张卡写进待办的 result, 待办**不出队**。
 * 奖励弹窗读 result 播放置换演出并展示结果, 玩家点「完成」后才由浮层结算出队。
 */
export function replaceExploreCard(charId: string, uid: string): boolean {
  const session = useExploreStore.getState().session;
  const action = session?.pendingActions[0];
  if (!session || action?.kind !== "replaceCard" || action.result) return false;
  if (!session.party.some(member => member.charId === charId && member.alive)) return false;
  const before = useTownStore.getState().characters[charId]?.deck.find(card => card.uid === uid);
  if (!before) return false;
  const draft = structuredClone(session);
  const foodCost = action.foodCost ?? 0;
  if (!payServiceFood(draft, foodCost)) return false;
  const after = useTownStore.getState().replaceCardWithCommon(charId, uid);
  if (!after) return false;
  const pending = draft.pendingActions[0];
  if (pending.kind === "replaceCard") pending.result = { charId, before: structuredClone(before), after: structuredClone(after) };
  draft.pendingNotes.push(`「${cardDisplayName(before)}」已替换为「${cardDisplayName(after)}」${foodCost ? `，消耗食品 ×${foodCost}` : ""}`);
  useExploreStore.setState({ session: draft });
  return true;
}
