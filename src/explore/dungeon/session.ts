// ============================================================================
// 房间之间的移动 —— 纯逻辑, 由 store 层克隆后调用。
// 房间场景内的行走与交互属于 corridor/, 本文件只处理「换房间」这件事:
// 站上传送门点亮小地图 → 确认后扣粒子 → 落地新房间 → 战斗房立即触发黑影。
// ============================================================================

import { beginCorridorEncounter, buildRoomScene, canWalkCorridor, portalAt } from "../corridor/session";
import { CORRIDOR } from "../corridor/types";
import { CORRIDOR_CURIOS } from "../../data/curios";
import { changeEnergy } from "../energy";
import { EXPLORE_RULES } from "../rules";
import type { ExploreState } from "../types";
import type { PortalDir, RoomNode } from "./types";

export function currentRoom(s: ExploreState): RoomNode | null {
  if (!s.dungeon) return null;
  return s.dungeon.rooms[s.dungeon.currentRoomId] ?? null;
}

export function roomOf(s: ExploreState, id: string): RoomNode | null {
  return s.dungeon?.rooms[id] ?? null;
}

/** 房间是否已探索完: 所有可交互物都处理过, 战斗房的黑影也已清除。 */
export function isRoomExplored(room: RoomNode): boolean {
  const guarded = room.kind === "battle";
  return room.curios.every((curio) => {
    if (CORRIDOR_CURIOS[curio.kind]?.persistent) return true;
    return curio.used;
  }) && (!guarded || room.threatDefeated);
}

/** 把场景里的进度(物件已搜、黑影已清)写回房间图 —— 小地图与重进房间都读房间图。 */
export function syncRoomFromScene(s: ExploreState): void {
  const room = currentRoom(s);
  if (!room || !s.corridor || s.corridor.roomId !== room.id) return;
  for (const object of s.corridor.objects) {
    const curio = room.curios[object.nodeIndex];
    if (curio) curio.used = object.used;
  }
  if (s.corridor.threats.some((threat) => threat.defeated)) room.threatDefeated = true;
}

/** 进入一个房间: 写图状态、展开场景、按深度更新战斗压力, 战斗房立刻起黑影。 */
export function enterRoom(s: ExploreState, roomId: string, fromDir: PortalDir | null = null): boolean {
  const room = roomOf(s, roomId);
  if (!room || !s.dungeon) return false;
  s.dungeon.currentRoomId = roomId;
  room.visited = true;
  room.revealed = true;
  // round 在房间制下只表示「当前房间的深度」, 供战斗档位与事件门槛读取。
  s.round = room.depth + 1;
  buildRoomScene(s, room, fromDir);
  const threat = s.corridor?.threats.find((candidate) => !candidate.defeated);
  if (threat) beginCorridorEncounter(s, threat.id);
  return true;
}

/** 站上/离开传送门: 点亮目标房间在小地图上的位置(内容仍未知), 不消耗任何资源。 */
export function standOnPortal(s: ExploreState, x: number): boolean {
  if (!s.corridor || !s.dungeon) return false;
  const portal = canWalkCorridor(s) ? portalAt(s.corridor, x) : null;
  const dir = portal?.dir ?? null;
  if (s.corridor.standingPortalDir === dir) return false;
  s.corridor.standingPortalDir = dir;
  if (portal) {
    const target = roomOf(s, portal.to);
    if (target) target.revealed = true;
  }
  return true;
}

/** 确认传送: 扣 5 点净化粒子, 落到目标房间对向门的边上。 */
export function travelPortal(s: ExploreState, dir: PortalDir): boolean {
  if (!canWalkCorridor(s) || !s.corridor || !s.dungeon) return false;
  const portal = s.corridor.portals.find((candidate) => candidate.dir === dir);
  if (!portal || Math.abs(portal.x - s.corridor.playerX) > CORRIDOR.portalRadius) return false;
  const target = roomOf(s, portal.to);
  if (!target) return false;

  syncRoomFromScene(s);
  changeEnergy(s, -EXPLORE_RULES.dungeon.energyPerRoomMove);
  const known = target.visited ? `${target.label} 号房间` : "未知房间";
  s.log.push(`传送至${known} · 净化粒子 −${EXPLORE_RULES.dungeon.energyPerRoomMove}`);
  return enterRoom(s, portal.to, dir);
}

/** 目标房间在不在小地图上已经点亮过 —— UI 决定画「?」还是画房间类型。 */
export function portalTargetLabel(s: ExploreState, dir: PortalDir): string {
  const portal = s.corridor?.portals.find((candidate) => candidate.dir === dir);
  const target = portal ? roomOf(s, portal.to) : null;
  if (!target) return "未知房间";
  return target.visited ? `${target.label} 号房间` : "未知房间";
}
