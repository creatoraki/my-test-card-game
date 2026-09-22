// ============================================================================
// 房间图生成 —— 一趟远征只跑一次, 全程用会话 RNG, 同种子必然生成同一张图。
//
// ① 从起始房间开始随机长出一棵生成树, 直到房间数达到地图的 roomCount;
// ② 追加少量环路边, 让路线出现取舍而不是一条死路走到底;
// ③ BFS 算 depth, 最深的死胡同当 BOSS 房, 其余非起点房按比例投放战斗房与陷阱房;
// ④ 物件清单由 curioPlan.ts 决定: 每房 1-2 个, 陷阱房固定一个陷阱, 治疗按每房概率投放, 其余按权重偏向物品奖励;
//    物件等级由 curioLevel.ts 按地图等级区间与房间深度决定;
// ⑤ 传送门按门数规则分布: 2 门左右、3 门左中右、4 门等距; BOSS 红门与可交互物避开门附近槽位。
// ============================================================================

import { rngInt, shuffle } from "../../engine/rng";
import { difficultyMapConfig } from "../../data";
import { EXPLORE_RULES } from "../rules";
import type { ExploreState } from "../types";
import {
  corridorPortalSlotsFor, corridorSlotsFor, CORRIDOR, type CurioKind,
} from "../corridor/types";
import {
  PORTAL_DIRS,
  type DungeonState, type RoomNode,
} from "./types";
import { generatePlannedDungeon } from "./planned";
import { growRooms } from "./growRooms";
import { planRoomCurios } from "./curioPlan";
import { rollCurioLevel } from "./curioLevel";
import type { CurioLevel } from "../../data/curios/types";

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

/** 按门数规则分布传送门, 并让红门与可交互物避开传送门附近的中段槽位。 */
function layoutRoom(
  s: ExploreState,
  room: RoomNode,
  picks: CurioKind[],
  levelOf: () => CurioLevel,
  bossGate = false,
): void {
  // 先打乱方向, 避免固定方向总被分到中段, 让门的朝向只能从小地图获知。
  const dirs = shuffle(s, PORTAL_DIRS.filter((dir) => room.exits[dir]));
  const portalSlots = dirs.length <= 1
    ? shuffle(s, corridorPortalSlotsFor(room.nearMapVariant, dirs.length)).slice(0, dirs.length)
    : corridorPortalSlotsFor(room.nearMapVariant, dirs.length);
  dirs.forEach((dir, index) => {
    room.portalX[dir] = portalSlots[index];
  });

  const allMiddleSlots = corridorSlotsFor(room.nearMapVariant);
  const portalAvoidanceRadius = CORRIDOR.portalRadius + 80;
  const availableMiddleSlots = allMiddleSlots.filter((slot) => (
    !portalSlots.some((portalX) => Math.abs(slot - portalX) <= portalAvoidanceRadius)
  ));

  const requiredSlotCount = (bossGate ? 1 : 0) + picks.length;
  const blockedMiddleSlots = allMiddleSlots.filter((slot) => (
    !availableMiddleSlots.includes(slot) && !portalSlots.includes(slot)
  ));
  const distanceToPortal = (slot: number) => portalSlots.length
    ? Math.min(...portalSlots.map((portalX) => Math.abs(slot - portalX)))
    : Number.MAX_SAFE_INTEGER;
  const middleSlots = availableMiddleSlots.length >= requiredSlotCount
    ? availableMiddleSlots
    : [
      ...availableMiddleSlots,
      ...blockedMiddleSlots
        .sort((a, b) => distanceToPortal(b) - distanceToPortal(a))
        .slice(0, requiredSlotCount - availableMiddleSlots.length),
    ];
  const middle = shuffle(s, middleSlots);
  let cursor = 0;
  if (bossGate) room.bossGateX = middle[cursor++];
  room.curios = picks.map((kind, index) => ({
    id: `${room.id}-curio-${index}`,
    kind,
    x: middle[cursor++],
    used: false,
    level: levelOf(),
  }));
}

export function generateDungeon(s: ExploreState): DungeonState {
  const map = difficultyMapConfig(s.mapId, s.difficulty);
  if (map.dungeonPlan) return generatePlannedDungeon(s, map.dungeonPlan);
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
  // 陷阱房: 战斗房之外的剩余普通房里按比例投放, 可以为 0 间。
  const trapCount = Math.min(plain.length - battleCount, Math.round(plain.length * EXPLORE_RULES.dungeon.trapRoomRatio));
  for (let i = battleCount; i < battleCount + trapCount; i++) rooms[plain[i]].kind = "trap";

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
  // 起始房祝福匣、货商名额、陷阱与治疗概率统一由 curioPlan.ts 规划。
  const curioPlan = planRoomCurios(s, rooms, order, merchantRooms);
  const maxDepth = Math.max(1, ...order.map((id) => rooms[id].depth));
  for (const id of order) {
    const room = rooms[id];
    const levelOf = () => rollCurioLevel(s, map.curioLevelRange, room.depth, maxDepth);
    layoutRoom(s, room, curioPlan[id], levelOf, room.kind === "boss");
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
