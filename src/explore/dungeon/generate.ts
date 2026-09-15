// ============================================================================
// 房间图生成 —— 一趟远征只跑一次, 全程用会话 RNG, 同种子必然生成同一张图。
//
// ① 从起始房间开始随机长出一棵生成树, 直到房间数达到地图的 roomCount;
// ② 追加少量环路边, 让路线出现取舍而不是一条死路走到底;
// ③ BFS 算 depth, 最深的死胡同当 BOSS 房, 其余非起点房按比例投放战斗房;
// ④ 传送门优先占最左/最右, BOSS 红门与多出来的门、可交互物共用中段槽位。
// ============================================================================

import { rngInt, rngPick, shuffle } from "../../engine/rng";
import { RANDOM_CURIO_KINDS } from "../../data/curios";
import { difficultyMapConfig } from "../../data";
import { EXPLORE_RULES } from "../rules";
import type { ExploreState } from "../types";
import { corridorPortalEdgeSlotsFor, corridorSlotsFor, type CurioKind } from "../corridor/types";
import {
  DIR_STEP, OPPOSITE_DIR, PORTAL_DIRS, roomIdAt,
  type DungeonState, type NearMapVariant, type PortalDir, type RoomNode,
} from "./types";

/** 网格边长: 够放下 roomCount 个房间并留出分支空间。 */
function gridSize(roomCount: number): number {
  return Math.max(3, Math.ceil(Math.sqrt(roomCount)) + 1);
}

function makeRoom(gx: number, gy: number, label: number): RoomNode {
  return {
    id: roomIdAt(gx, gy), gx, gy, kind: "normal", nearMapVariant: "standard", depth: 0, label,
    curios: [], exits: {}, portalX: {}, visited: false, threatDefeated: false, revealed: false,
  };
}

function link(a: RoomNode, b: RoomNode, dir: PortalDir): void {
  a.exits[dir] = b.id;
  b.exits[OPPOSITE_DIR[dir]] = a.id;
}

/** 生成树 + 少量环路。房间只在 size×size 网格内扩张, 故出口天然不超过 4 个。 */
function growRooms(s: ExploreState, roomCount: number): { rooms: Record<string, RoomNode>; order: string[] } {
  const size = gridSize(roomCount);
  const start = Math.floor(size / 2);
  const rooms: Record<string, RoomNode> = {};
  const order: string[] = [];
  const push = (room: RoomNode) => {
    rooms[room.id] = room;
    order.push(room.id);
  };
  push(makeRoom(start, start, 1));

  let guard = roomCount * 60;
  while (order.length < roomCount && guard-- > 0) {
    const from = rooms[order[rngInt(s, order.length)]];
    const dir = PORTAL_DIRS[rngInt(s, PORTAL_DIRS.length)];
    const step = DIR_STEP[dir];
    const gx = from.gx + step.dx;
    const gy = from.gy + step.dy;
    if (gx < 0 || gy < 0 || gx >= size || gy >= size) continue;
    const id = roomIdAt(gx, gy);
    if (rooms[id]) continue;
    const room = makeRoom(gx, gy, order.length + 1);
    push(room);
    link(from, room, dir);
  }

  // 环路: 把少量相邻但未打通的房间接起来, 让小地图出现回环与近路。
  const extra = Math.floor(order.length * EXPLORE_RULES.dungeon.loopEdgeRatio);
  for (let i = 0; i < extra; i++) {
    const room = rooms[order[rngInt(s, order.length)]];
    const dir = PORTAL_DIRS[rngInt(s, PORTAL_DIRS.length)];
    if (room.exits[dir]) continue;
    const step = DIR_STEP[dir];
    const neighbor = rooms[roomIdAt(room.gx + step.dx, room.gy + step.dy)];
    if (neighbor) link(room, neighbor, dir);
  }

  return { rooms, order };
}

/** 起始房间出发的最短步数。 */
function markDepth(rooms: Record<string, RoomNode>, startId: string): void {
  for (const room of Object.values(rooms)) room.depth = -1;
  rooms[startId].depth = 0;
  const queue = [startId];
  while (queue.length) {
    const room = rooms[queue.shift() as string];
    for (const id of Object.values(room.exits)) {
      const next = rooms[id];
      if (!next || next.depth >= 0) continue;
      next.depth = room.depth + 1;
      queue.push(id);
    }
  }
  // 生成树保证连通; 万一出现孤岛(不应发生)按 0 兜底, 避免负深度污染战斗档位。
  for (const room of Object.values(rooms)) if (room.depth < 0) room.depth = 0;
}

/** BOSS 房: 最深的房间, 同深度优先取只有一个出口的死胡同。 */
function pickBossRoom(s: ExploreState, rooms: Record<string, RoomNode>, startId: string): string {
  const candidates = Object.values(rooms).filter((room) => room.id !== startId);
  if (!candidates.length) return startId;
  const maxDepth = Math.max(...candidates.map((room) => room.depth));
  const deepest = candidates.filter((room) => room.depth === maxDepth);
  const deadEnds = deepest.filter((room) => Object.keys(room.exits).length === 1);
  const pool = deadEnds.length ? deadEnds : deepest;
  return shuffle(s, pool.map((room) => room.id))[0];
}

/** 传送门优先占左右边缘; 多出来的门与可交互物共用中段槽位, 坐标不会重叠。 */
function layoutRoom(
  s: ExploreState,
  room: RoomNode,
  kinds: CurioKind[],
  curioCount: number,
  forceMerchant = false,
  bossGate = false,
): void {
  // 先打乱方向, 避免固定方向总被分到中段, 让门的朝向只能从小地图获知。
  const dirs = shuffle(s, PORTAL_DIRS.filter((dir) => room.exits[dir]));
  const edges = shuffle(s, corridorPortalEdgeSlotsFor(room.nearMapVariant));
  const middle = shuffle(s, corridorSlotsFor(room.nearMapVariant));
  let cursor = 0;
  dirs.forEach((dir, index) => {
    room.portalX[dir] = index < edges.length ? edges[index] : middle[cursor++];
  });
  if (bossGate) room.bossGateX = middle[cursor++];
  // 最多两扇中段门、1 扇红门加三件物件, 共用六个槽位, 不需要绕回制造重复坐标。
  const randomCount = Math.max(0, curioCount - (forceMerchant ? 1 : 0));
  const picks = shuffle(s, [...kinds]).slice(0, randomCount);
  if (forceMerchant) picks.push("merchant");
  room.curios = picks.map((kind, index) => ({
    id: `${room.id}-curio-${index}`,
    kind,
    x: middle[cursor++],
    used: false,
  }));
}

/** 新手关卡随机混排三种近景，并确保整张房间图里三种都会出现。 */
function assignTutorialNearMaps(s: ExploreState, rooms: Record<string, RoomNode>, order: string[]): void {
  if (s.mapId !== "tutorial" || order.length === 0) return;
  const randomizedRooms = shuffle(s, [...order]);
  const variants = shuffle<NearMapVariant>(s, ["standard", "alternate", "third"]);
  for (const [index, id] of randomizedRooms.entries()) {
    rooms[id].nearMapVariant = variants[index] ?? rngPick(s, variants);
  }
}

export function generateDungeon(s: ExploreState): DungeonState {
  const map = difficultyMapConfig(s.mapId, s.difficulty);
  const roomCount = Math.max(2, map.roomCount);
  const { rooms, order } = growRooms(s, roomCount);
  const startId = order[0];
  markDepth(rooms, startId);
  const bossId = pickBossRoom(s, rooms, startId);
  rooms[startId].kind = "start";
  rooms[bossId].kind = "boss";

  // 战斗房: 非起点非 BOSS 的房间里按比例投放, 至少 1 间。
  const plain = shuffle(s, order.filter((id) => id !== startId && id !== bossId));
  const battleCount = Math.min(plain.length, Math.max(1, Math.round(plain.length * EXPLORE_RULES.dungeon.battleRoomRatio)));
  for (let i = 0; i < battleCount; i++) rooms[plain[i]].kind = "battle";

  assignTutorialNearMaps(s, rooms, order);

  const kinds = [...RANDOM_CURIO_KINDS] as CurioKind[];
  const [minCurio, maxCurio] = EXPLORE_RULES.dungeon.curiosPerRoom;
  const merchantRange = map.roomCount <= EXPLORE_RULES.dungeon.merchants.smallMapMaxRooms
    ? EXPLORE_RULES.dungeon.merchants.small
    : EXPLORE_RULES.dungeon.merchants.large;
  const merchantCount = merchantRange[0] + rngInt(s, merchantRange[1] - merchantRange[0] + 1);
  const merchantRooms = new Set(
    shuffle(
      s,
      order.filter((id) => rooms[id].kind === "normal"),
    ).slice(0, merchantCount),
  );
  for (const id of order) {
    const room = rooms[id];
    // BOSS 房也按区间投放物件, 起始房固定 1 件安全投递柜, 其余按区间随机。
    const count = room.kind === "start" ? 1
        : minCurio + rngInt(s, maxCurio - minCurio + 1) + (merchantRooms.has(id) ? 1 : 0);
    const roomKinds = room.kind === "start"
      ? (["dispatch"] as CurioKind[])
      : kinds;
    layoutRoom(s, room, roomKinds, count, merchantRooms.has(id), room.kind === "boss");
  }
  const xs = order.map((id) => rooms[id].gx);
  const ys = order.map((id) => rooms[id].gy);
  return {
    rooms, order, startRoomId: startId, bossRoomId: bossId, currentRoomId: startId,
    layoutKnown: false,
    threatsKnown: false,
    bounds: { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) },
  };
}
