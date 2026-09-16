import { CORRIDOR_CURIOS } from "@/data/curios";
import type { CurioDecision, CurioEffectContext } from "@/data/curios/types";
import { rngFloat, rngPick } from "@/engine/rng";
import { changeEnergy } from "../energy";
import { interactionCost, checkWipe, logLine } from "../session";
import { areRoomCuriosCleared, currentRoom, syncRoomFromScene } from "../dungeon/session";
import { fireExploreRelic } from "../relics";
import type { ExploreState } from "../types";
import type { ItemStack } from "@/items/types";
import { matchOffering, takeOfferedStacks, validOfferingPicks, type OfferingPick } from "./offering";
import { applyCurioEffect } from "./effects";
import { visibleDecisions } from "./visibility";

function activeObject(s: ExploreState) {
  const id = s.corridor?.activeObjectId;
  return id ? s.corridor?.objects.find((object) => object.id === id) : undefined;
}

function historyKind(kind: string): "loot" | "heal" | "merchant" | "energy" {
  if (kind === "merchant" || kind === "dispatch" || kind === "shrine") return "merchant";
  if (kind === "medical" || kind === "sink" || kind === "repairPod" || kind === "tutorialMedical") return "heal";
  if (kind === "crystalVein" || kind === "vending" || kind === "remains" || kind === "compactor"
    || kind === "modBench" || kind === "cardPrinter" || kind === "tutorialArmory"
    || kind === "tutorialModBench" || kind === "tutorialForge") return "loot";
  return "energy";
}

function actorFor(s: ExploreState, decision: CurioDecision): string | null {
  const alive = s.party.filter((member) => member.alive);
  if (!alive.length) return null;
  if (decision.require?.kind === "job") {
    return alive.some((member) => member.charId === decision.require?.charId)
      ? decision.require.charId
      : null;
  }
  return rngPick(s, alive).charId;
}

function executeDecision(
  s: ExploreState,
  decision: CurioDecision,
  actorId: string,
  offered: ItemStack[],
  visibleIndex: number,
): boolean {
  const object = activeObject(s);
  if (!object) return false;
  const def = CORRIDOR_CURIOS[object.kind];
  const notes: string[] = [];
  s.pendingStory = [decision.story];
  s.pendingNotes = [];
  const ctx: CurioEffectContext = { actorId, offered };
  for (const effect of decision.effects) {
    const note = applyCurioEffect(s, effect, ctx);
    if (note) notes.push(note);
  }
  if (decision.risk && rngFloat(s) < Math.max(0, Math.min(1, decision.risk.chance))) {
    notes.push("黑盒的反应比预期更糟");
    for (const effect of decision.risk.effects) {
      const note = applyCurioEffect(s, effect, ctx);
      if (note) notes.push(note);
    }
  }
  s.pendingNotes = notes;
  object.used = true;
  syncRoomFromScene(s);
  const room = currentRoom(s);
  if (room && areRoomCuriosCleared(room)) fireExploreRelic(s, { type: "roomCleared", roomId: room.id });
  s.history.push({
    slot: "node",
    round: s.round,
    segment: object.nodeIndex,
    lane: 0,
    roomLabel: s.dungeon?.rooms[s.dungeon.currentRoomId]?.label,
    eventId: `curio-${object.kind}`,
    eventTitle: def.name,
    eventKind: historyKind(object.kind),
    choiceIndex: visibleIndex,
    choiceLabel: decision.label,
    notes,
  });
  logLine(s, `${s.dungeon?.rooms[s.dungeon.currentRoomId]?.label ?? "?"} 号房间: ${def.name} · ${decision.label}`);
  if (checkWipe(s)) return true;
  s.phase = "resolving";
  return true;
}

function spendCurioInteraction(s: ExploreState): void {
  if (s.freeNodes > 0) s.freeNodes -= 1;
  else changeEnergy(s, -interactionCost(s));
}

function findVisibleDecision(s: ExploreState, decisionId: string): { decision: CurioDecision; index: number } | null {
  const object = activeObject(s);
  if (!object || object.used || s.phase !== "landed") return null;
  const def = CORRIDOR_CURIOS[object.kind];
  const decisions = visibleDecisions(s, def);
  const index = decisions.findIndex((decision) => decision.id === decisionId);
  return index >= 0 ? { decision: decisions[index], index } : null;
}

export function chooseCurioDecision(s: ExploreState, decisionId: string): boolean {
  const found = findVisibleDecision(s, decisionId);
  if (!found || found.decision.require?.kind === "offering") return false;
  const actorId = actorFor(s, found.decision);
  if (!actorId) return false;
  spendCurioInteraction(s);
  return executeDecision(s, found.decision, actorId, [], found.index);
}

export function offerToCurio(s: ExploreState, picks: OfferingPick[]): boolean {
  const object = activeObject(s);
  if (!object || object.used || s.phase !== "landed") return false;
  const def = CORRIDOR_CURIOS[object.kind];
  const decisions = visibleDecisions(s, def);
  const offered = validOfferingPicks(s, picks);
  if (!offered) return false;
  const matchedIndex = decisions.findIndex((decision) =>
    decision.require?.kind === "offering" && matchOffering(decision.require.recipes, offered),
  );
  const actorDecision = matchedIndex >= 0 ? decisions[matchedIndex] : null;
  const actorId = actorDecision ? actorFor(s, actorDecision) : actorFor(s, decisions[0]);
  if (!actorId) return false;
  const taken = takeOfferedStacks(s, picks);
  if (!taken.length) return false;
  spendCurioInteraction(s);
  if (matchedIndex >= 0 && actorDecision) {
    return executeDecision(s, actorDecision, actorId, taken, matchedIndex);
  }
  s.pendingStory = ["黑盒吞下了你放入的物品，却没有给出任何回应。"];
  s.pendingNotes = ["放入的物品被吞掉，物件已经耗尽"];
  object.used = true;
  syncRoomFromScene(s);
  const room = currentRoom(s);
  if (room && areRoomCuriosCleared(room)) fireExploreRelic(s, { type: "roomCleared", roomId: room.id });
  s.history.push({
    slot: "node",
    round: s.round,
    segment: object.nodeIndex,
    lane: 0,
    roomLabel: s.dungeon?.rooms[s.dungeon.currentRoomId]?.label,
    eventId: `curio-${object.kind}`,
    eventTitle: def.name,
    eventKind: historyKind(object.kind),
    choiceIndex: -1,
    choiceLabel: "放错物品",
    notes: s.pendingNotes,
  });
  logLine(s, `${def.name} 吞掉了放入的物品`);
  if (checkWipe(s)) return true;
  s.phase = "resolving";
  return true;
}
