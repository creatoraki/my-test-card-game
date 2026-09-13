import { CORRIDOR_AMBUSH, CORRIDOR_CURIOS } from "../../data/corridorCurios";
import type { ExploreState } from "../types";
import { CORRIDOR, type CorridorState, type CurioKind } from "./types";

/** 路线数据仅作为现有事件结算的索引，不再生成桥接或要求记忆路线。 */
export function createCorridorRound(s: ExploreState): void {
  const kinds = Object.keys(CORRIDOR_CURIOS) as CurioKind[];
  // 每轮轮换物件顺序；入口始终有一个安全物件，终点前留出休整空间。
  const offset = (s.round - 1) % kinds.length;
  const positions = [720, 1270, 1750, 1860, 3120, 3690, 4230, 4660];
  const objects = positions.map((x, i) => ({
    id: `curio-${s.round}-${i}`,
    kind: kinds[(i + offset) % kinds.length], x, used: false, nodeIndex: i,
  }));
  s.corridor = {
    round: s.round, width: CORRIDOR.width, playerX: CORRIDOR.startX,
    facing: 1, exploredX: CORRIDOR.startX, objects,
    threats: [
      { id: `ambush-${s.round}`, x: 2500, final: false, defeated: false, nodeIndex: objects.length },
      { id: `guardian-${s.round}`, x: 5210, final: true, defeated: false, nodeIndex: -1 },
    ],
    activeObjectId: null, encounterId: null,
  };
  const nodes = [...objects.map((object) => [CORRIDOR_CURIOS[object.kind].event]), [CORRIDOR_AMBUSH]];
  s.board = {
    round: s.round, laneCount: 1, rowsPerSegment: 1,
    segments: nodes.map((_, index) => ({ index, bridges: [] })),
    nodes, revealDurationMs: 0, blockedLanes: [], hiddenNodes: [],
  };
  s.entryLane = null;
  s.currentLane = 0;
  s.currentSegment = 0;
  s.freeNodes = 0;
  s.shop = null;
  s.pendingNotes = [];
  s.pendingStory = [];
  s.pendingBattleTier = null;
  s.battleSource = null;
  s.chuteOpen = false;
  s.phase = "atNode";
}

export function nearbyObjects(corridor: CorridorState, x: number) {
  return corridor.objects.filter((object) => !object.used && Math.abs(object.x - x) <= CORRIDOR.interactionRadius);
}

export function clampCorridorX(corridor: CorridorState, x: number): number {
  const obstacle = corridor.threats.find((threat) => !threat.defeated);
  return Math.max(100, Math.min(obstacle ? obstacle.x - 110 : corridor.width - 180, x));
}

export function hasCorridorRewards(s: ExploreState): boolean {
  return Boolean(s.pendingLoot.length || s.pendingPickup.length || s.pendingActions.length || s.pendingBoons.length || s.pendingCardOffer);
}

export function canWalkCorridor(s: ExploreState): boolean {
  return Boolean(s.corridor && s.phase === "atNode" && !hasCorridorRewards(s));
}

export function openCorridorObject(s: ExploreState, id: string): boolean {
  if (!canWalkCorridor(s) || !s.corridor) return false;
  const object = nearbyObjects(s.corridor, s.corridor.playerX).find((candidate) => candidate.id === id);
  if (!object) return false;
  s.corridor.activeObjectId = id;
  s.currentLane = 0;
  s.currentSegment = object.nodeIndex + 1;
  s.pendingNotes = [];
  s.pendingStory = [];
  s.chuteOpen = false;
  s.phase = "landed";
  return true;
}

export function dismissCorridorObject(s: ExploreState): boolean {
  if (!s.corridor || s.phase !== "landed" || hasCorridorRewards(s)) return false;
  s.corridor.activeObjectId = null;
  s.phase = "atNode";
  return true;
}

export function beginCorridorEncounter(s: ExploreState, id: string): boolean {
  if (!canWalkCorridor(s) || !s.corridor) return false;
  const threat = s.corridor.threats.find((candidate) => candidate.id === id && !candidate.defeated);
  if (!threat || Math.abs(threat.x - s.corridor.playerX) > CORRIDOR.encounterRadius) return false;
  s.corridor.activeObjectId = null;
  s.corridor.encounterId = id;
  s.phase = "encounter";
  return true;
}

export function settleCorridorEncounter(s: ExploreState): void {
  if (!s.corridor?.encounterId) return;
  const threat = s.corridor.threats.find((candidate) => candidate.id === s.corridor?.encounterId);
  if (threat) threat.defeated = true;
  s.corridor.encounterId = null;
}
