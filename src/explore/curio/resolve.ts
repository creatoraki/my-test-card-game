import { CORRIDOR_CURIOS, difficultyMapConfig, getItemDef } from "@/data";
import type { CurioDecision, CurioDef, CurioEffect, CurioEffectContext } from "@/data/curios/types";
import { consumeItems } from "@/items/inventory";
import type { ItemStack } from "@/items/types";
import { changeEnergy } from "../resources/energy";
import { checkWipe, logLine } from "../session";
import { interactionCost } from "../resources/energyCost";
import { areRoomCuriosCleared, currentRoom, syncRoomFromScene } from "../dungeon/dungeonSession";
import { fireExploreRelic } from "../relics/relics";
import type { ExploreState } from "../types";
import type { CorridorObject, CurioKind } from "../corridor/types";
import { matchOffering, takeOfferedStacks, validOfferingPicks, type OfferingPick } from "./offering";
import { applyCurioEffect } from "./effects";
import { settleActorRewards } from "./actorRewards";
import { activeCurioDef, decisionLockReason, feedFoodFor, visibleDecisions } from "./visibility";
import { foodLeftAfterPicks, payServiceFood } from "./foodPayment";
import { validFreeOffer } from "./freeOffer";
import { resolveFailure } from "./failure";
import { expandRolls } from "./roll";

function activeObject(s: ExploreState): CorridorObject | undefined {
  const id = s.corridor?.activeObjectId;
  return id ? s.corridor?.objects.find((object) => object.id === id) : undefined;
}

function historyKind(kind: CurioKind): "loot" | "heal" | "merchant" | "energy" {
  const role = CORRIDOR_CURIOS[kind]?.role;
  if (role === "service") return "merchant";
  if (role === "heal" || role === "loot") return role;
  return "energy";
}

/** 执行者必须是存活队员。 */
function aliveExecutor(s: ExploreState, executorId: string): string | null {
  return s.party.some((member) => member.alive && member.charId === executorId) ? executorId : null;
}

function failureDisabled(s: ExploreState): boolean {
  return Boolean(difficultyMapConfig(s.mapId, s.difficulty).disableCurioFailure);
}

function applyAll(s: ExploreState, effects: CurioEffect[], ctx: CurioEffectContext, notes: string[]): void {
  for (const effect of effects) {
    const before = s.pendingActions.length;
    const applied = applyCurioEffect(s, effect, ctx);
    const note = settleActorRewards(s, ctx.actorId, before) ?? applied;
    if (note) notes.push(note);
  }
}

function executeDecision(
  s: ExploreState,
  decision: CurioDecision,
  executorId: string,
  offered: ItemStack[],
  visibleIndex: number,
  preNotes: string[] = [],
): boolean {
  const object = activeObject(s);
  const def = activeCurioDef(s);
  if (!object || !def) return false;
  const ctx: CurioEffectContext = { actorId: executorId, offered };
  const outcome = resolveFailure(s, decision.failure, executorId, failureDisabled(s));
  const notes = [...preNotes, ...outcome.notes];

  let story = decision.story;
  let effects: CurioEffect[];
  if (!outcome.failed) {
    effects = [...decision.effects, ...outcome.bonusEffects];
  } else if (outcome.converted) {
    story = outcome.converted.story;
    effects = outcome.converted.effects;
  } else {
    story = decision.failure?.story ?? story;
    effects = decision.failure?.effects ?? [];
  }
  s.pendingStory = [story];
  s.pendingNotes = [];
  applyAll(s, expandRolls(s, effects), ctx, notes);
  s.pendingNotes = notes;
  finishInteraction(s, object, def, visibleIndex, decision.label);
  return true;
}

/** 物件耗尽后的公共收尾：写回房间、历史与日志，进入结算阶段。 */
function finishInteraction(
  s: ExploreState,
  object: CorridorObject,
  def: CurioDef,
  choiceIndex: number,
  choiceLabel: string,
): void {
  // 常驻物件(兑换台、传送盆)用过仍留在原地, 可以再次交互。
  object.used = !def.persistent;
  syncRoomFromScene(s);
  const room = currentRoom(s);
  if (room && areRoomCuriosCleared(room)) fireExploreRelic(s, { type: "roomCleared", roomId: room.id });
  s.history.push({
    slot: "node",
    round: s.round,
    segment: object.nodeIndex,
    lane: 0,
    roomLabel: room?.label,
    eventId: `curio-${object.kind}`,
    eventTitle: def.name,
    eventKind: historyKind(object.kind),
    choiceIndex,
    choiceLabel,
    notes: s.pendingNotes,
  });
  logLine(s, `${room?.label ?? "?"} 号房间: ${def.name} · ${choiceLabel}`);
  if (checkWipe(s)) return;
  s.phase = "resolving";
}

function spendCurioInteraction(s: ExploreState): void {
  // 陷阱物件是被动触发的, 不收交互粒子。
  const object = activeObject(s);
  if (object && CORRIDOR_CURIOS[object.kind]?.forced) return;
  if (s.freeNodes > 0) s.freeNodes -= 1;
  else changeEnergy(s, -interactionCost(s));
}

function findVisibleDecision(s: ExploreState, decisionId: string): { decision: CurioDecision; index: number } | null {
  const object = activeObject(s);
  const def = activeCurioDef(s);
  if (!object || !def || object.used || s.phase !== "landed") return null;
  const decisions = visibleDecisions(s, def);
  const index = decisions.findIndex((decision) => decision.id === decisionId);
  if (index < 0 || decisionLockReason(s, decisions[index])) return null;
  // 传送不走普通结算(见 waystone.travelByWaystone)。
  if (decisions[index].effects.some((effect) => effect.type === "WAYSTONE_TRAVEL")) return null;
  return { decision: decisions[index], index };
}

/** 喂养选项：自动扣除背包里的对应食物。 */
function payFeed(s: ExploreState, decision: CurioDecision): string | null | false {
  if (!decision.feed) return null;
  const food = feedFoodFor(s, decision);
  if (!food) return false;
  s.backpack = consumeItems(s.backpack, food, decision.feed.count);
  return `消耗 ${getItemDef(food).name} ×${decision.feed.count}`;
}

export function chooseCurioDecision(s: ExploreState, decisionId: string, executorId: string): boolean {
  const found = findVisibleDecision(s, decisionId);
  if (!found || found.decision.select || found.decision.offer) return false;
  const actorId = aliveExecutor(s, executorId);
  if (!actorId) return false;
  if ((found.decision.foodCost ?? 0) > 0 && !payServiceFood(s, found.decision.foodCost ?? 0)) return false;
  const fed = payFeed(s, found.decision);
  if (fed === false) return false;
  spendCurioInteraction(s);
  return executeDecision(s, found.decision, actorId, [], found.index, fed ? [fed] : []);
}

/**
 * 所选物品是否满足选项要求：配方(select)完全匹配，或自由投入(offer)每件合格且件数在范围内；
 * 放进去的食品不能挤占选项的明码食品价。界面的确认按钮与实际结算共用这一处判断。
 */
export function picksFit(s: ExploreState, decision: CurioDecision, picks: OfferingPick[]): boolean {
  if (!foodLeftAfterPicks(s, decision, picks)) return false;
  if (decision.offer) return Boolean(validFreeOffer(s, decision.offer, picks));
  const offered = validOfferingPicks(s, picks);
  return Boolean(decision.select && offered && matchOffering(decision.select, offered));
}

/**
 * 功能性选物决策：所选物品必须符合要求，不符合时不结算也不扣任何东西。
 * 先取走物品再收食品——投入的物品里可能就有食品，收不齐时由调用方丢弃整份草稿。
 */
export function selectForCurio(
  s: ExploreState,
  decisionId: string,
  executorId: string,
  picks: OfferingPick[],
): boolean {
  const found = findVisibleDecision(s, decisionId);
  if (!found || (!found.decision.select && !found.decision.offer)) return false;
  const actorId = aliveExecutor(s, executorId);
  if (!actorId || !picksFit(s, found.decision, picks)) return false;
  const taken = takeOfferedStacks(s, picks);
  if (!taken.length) return false;
  if ((found.decision.foodCost ?? 0) > 0 && !payServiceFood(s, found.decision.foodCost ?? 0)) return false;
  spendCurioInteraction(s);
  return executeDecision(s, found.decision, actorId, taken, found.index);
}
