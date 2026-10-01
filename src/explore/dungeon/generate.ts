// ============================================================================
// 房间图生成 —— 一趟远征只跑一次。
//
// ① 骨架(房间位置、连通、环路、起点与 BOSS)由 dungeonLayout 按「每日布局种子」生成:
//    同一游戏日、同一地图、同一难度的结构恒定, 换日即换; 原型多样, 起点不再固定居中;
// ② 以下房间内容全部用会话 RNG, 每局都不同;
// ③ BFS 算 depth, 非起点非 BOSS 房按比例投放战斗房与陷阱房;
// ④ 物件清单由 curioPlan.ts 决定: 每房 1-2 个, 陷阱房固定一个陷阱, 治疗按每房概率投放, 其余按权重偏向物品奖励;
//    物件等级由 curioLevel.ts 按地图等级区间与房间深度决定;
// ⑤ 传送门落在固定门位: 左门通左邻、右门通右邻、中门通纵向邻房; BOSS 红门与可交互物避开门附近槽位。
// ============================================================================

import { rngInt, shuffle } from "@/engine/core/rng";
import { difficultyMapConfig } from "@/data";
import { EXPLORE_RULES } from "../core/exploreRules";
import type { ExploreState } from "../types";
import {
  corridorPortalXFor, corridorSlotsFor, CORRIDOR, type CurioKind,
} from "../corridor/types";
import {
  PORTAL_DIRS, PORTAL_LANE,
  type DungeonState, type RoomNode,
} from "./types";
import { generatePlannedDungeon } from "./planned";
import { assignNearMapVariants } from "./nearMapAssignment";
import { growRooms } from "./growRooms";
import { planRoomCurios } from "./curioPlan";
import { rollCurioLevel } from "./curioLevel";
import type { CurioLevel } from "@/data/curios/types";

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

/** 传送门按方向落到固定门位, 并让红门与可交互物避开传送门附近的中段槽位。 */
function layoutRoom(
  s: ExploreState,
  room: RoomNode,
  picks: CurioKind[],
  levelOf: () => CurioLevel,
  bossGate = false,
): void {
  // 门位与小地图方向一一对应, 玩家不必记「哪扇门通哪边」。
  const portalSlots = PORTAL_DIRS.filter((dir) => room.exits[dir]).map((dir) => {
    const x = corridorPortalXFor(room.nearMapVariant, PORTAL_LANE[dir]);
    room.portalX[dir] = x;
    return x;
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

export function generateDungeon(s: ExploreState, layoutSeed: number): DungeonState {
  const map = difficultyMapConfig(s.mapId, s.difficulty);
  if (map.dungeonPlan) return generatePlannedDungeon(s, map.dungeonPlan);
  const roomCount = Math.max(2, map.roomCount);
  const { rooms, order, startId, bossId } = growRooms(layoutSeed, roomCount);
  if (map.nearMapVariants) {
    assignNearMapVariants(s, rooms, order, map.nearMapVariants);
  } else if (map.nearMapVariant) {
    for (const room of Object.values(rooms)) room.nearMapVariant = map.nearMapVariant;
  }
  markDepth(rooms, startId);
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
