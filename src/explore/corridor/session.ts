import { CORRIDOR_AMBUSH, curioEvent } from "../../data/curios";
import { OPPOSITE_DIR, PORTAL_DIRS, type PortalDir, type RoomNode } from "../dungeon/types";
import type { ExploreState } from "../types";
import { corridorSlotsFor, corridorWalkMax, corridorWidthFor, CORRIDOR, type CorridorPortal, type CorridorState } from "./types";

/**
 * 把一个房间展开成可游玩的横向场景。
 * 房间图(谁连通谁)由 dungeon/ 负责, 这里只负责「房间场景里有什么、玩家站在哪」。
 * board 仍是现有事件结算的索引: 第 i 个物件对应第 i 段, 战斗房末段才是黑影。
 */
export function buildRoomScene(s: ExploreState, room: RoomNode, fromDir: PortalDir | null): void {
  const width = corridorWidthFor(room.nearMapVariant);
  const objects = room.curios.map((curio, index) => ({
    id: curio.id, kind: curio.kind, x: curio.x, used: curio.used, nodeIndex: index,
  }));
  const portals: CorridorPortal[] = PORTAL_DIRS
    .filter((dir) => room.exits[dir])
    .map((dir) => ({ dir, x: room.portalX[dir] ?? width / 2, to: room.exits[dir] as string }));
  const guarded = room.kind === "battle" && !room.threatDefeated;

  s.corridor = {
    roomId: room.id,
    width,
    playerX: spawnX(portals, fromDir, width, corridorSlotsFor(room.nearMapVariant)),
    facing: 1,
    objects,
    threats: guarded
      ? [{
        id: `threat-${room.id}`, kind: "guard", x: width / 2,
        defeated: false, nodeIndex: objects.length,
      }]
      : [],
    bossGate: typeof room.bossGateX === "number" ? { x: room.bossGateX } : null,
    bossGateOpen: false,
    portals,
    activeObjectId: null,
    encounterId: null,
    standingPortalDir: null,
  };

  const nodes = objects.map((object) => [curioEvent(object.kind)]);
  if (room.kind === "battle") nodes.push([CORRIDOR_AMBUSH]);
  s.board = {
    round: room.depth + 1, laneCount: 1, rowsPerSegment: 1,
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

/** 落地点: 从哪扇门进来就站在那扇门边上(但不踩在门上), 首次进图站离门最远的槽位。 */
function spawnX(portals: CorridorPortal[], fromDir: PortalDir | null, width: number, slots: number[]): number {
  const back = fromDir ? portals.find((portal) => portal.dir === OPPOSITE_DIR[fromDir]) : null;
  if (back) {
    const offset = CORRIDOR.portalRadius + 80;
    return clampX(back.x < width / 2 ? back.x + offset : back.x - offset, width);
  }
  const farthest = [...slots].sort((a, b) => distanceToPortals(b, portals) - distanceToPortals(a, portals));
  return clampX(farthest[0] ?? width / 2, width);
}

function distanceToPortals(x: number, portals: CorridorPortal[]): number {
  if (!portals.length) return Number.MAX_SAFE_INTEGER;
  return Math.min(...portals.map((portal) => Math.abs(portal.x - x)));
}

function clampX(x: number, width: number): number {
  return Math.max(CORRIDOR.walkMin, Math.min(corridorWalkMax(width), x));
}

export function nearbyObjects(corridor: CorridorState, x: number) {
  return corridor.objects.filter((object) => !object.used && Math.abs(object.x - x) <= CORRIDOR.interactionRadius);
}

export function bossGateNear(corridor: CorridorState, x: number): boolean {
  return Boolean(corridor.bossGate && Math.abs(corridor.bossGate.x - x) <= CORRIDOR.interactionRadius);
}

/** 脚下的传送门(最近且在判定半径内的一座)。 */
export function portalAt(corridor: CorridorState, x: number): CorridorPortal | null {
  const hits = corridor.portals
    .filter((portal) => Math.abs(portal.x - x) <= CORRIDOR.portalRadius)
    .sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x));
  return hits[0] ?? null;
}

export function clampCorridorX(corridor: CorridorState, x: number): number {
  return Math.max(CORRIDOR.walkMin, Math.min(corridorWalkMax(corridor.width), x));
}

export function hasCorridorRewards(s: ExploreState): boolean {
  return Boolean(s.pendingLoot.length || s.pendingPickup.length || s.pendingActions.length || s.pendingBoons.length || s.pendingCardOffer);
}

export function canWalkCorridor(s: ExploreState): boolean {
  return Boolean(s.corridor && s.phase === "atNode" && !s.corridor.bossGateOpen && !hasCorridorRewards(s));
}

export function openBossGate(s: ExploreState): boolean {
  if (!canWalkCorridor(s) || !s.corridor?.bossGate || !bossGateNear(s.corridor, s.corridor.playerX)) return false;
  s.corridor.bossGateOpen = true;
  return true;
}

export function closeBossGate(s: ExploreState): boolean {
  if (!s.corridor?.bossGateOpen || s.phase !== "atNode") return false;
  s.corridor.bossGateOpen = false;
  return true;
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
  if (!s.corridor || (s.phase !== "landed" && s.phase !== "shopping") || hasCorridorRewards(s)) return false;
  s.corridor.activeObjectId = null;
  s.phase = "atNode";
  return true;
}

export function beginCorridorEncounter(s: ExploreState, id: string): boolean {
  if (!s.corridor || hasCorridorRewards(s)) return false;
  if (s.phase !== "atNode") return false;
  const threat = s.corridor.threats.find((candidate) => candidate.id === id && !candidate.defeated);
  if (!threat) return false;
  s.corridor.activeObjectId = null;
  s.corridor.standingPortalDir = null;
  s.corridor.encounterId = id;
  s.phase = "encounter";
  return true;
}

export function settleCorridorEncounter(s: ExploreState): void {
  if (!s.corridor?.encounterId) return;
  const encounterId = s.corridor.encounterId;
  const threat = s.corridor.threats.find((candidate) => candidate.id === encounterId);
  if (threat?.kind === "ambush") {
    s.corridor.threats = s.corridor.threats.filter((candidate) => candidate.id !== encounterId);
  } else if (threat) {
    threat.defeated = true;
  }
  s.corridor.encounterId = null;
}
