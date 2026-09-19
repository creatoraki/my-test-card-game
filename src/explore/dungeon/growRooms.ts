import { rngInt, shuffle } from "../../engine/rng";
import { EXPLORE_RULES } from "../rules";
import type { ExploreState } from "../types";
import { DIR_STEP, PORTAL_DIRS, roomIdAt, type PortalDir, type RoomNode } from "./types";
import { link, makeRoom } from "./roomNode";

interface Frontier {
  from: RoomNode;
  dir: PortalDir;
  gx: number;
  gy: number;
  score: number;
}

/** 优先填充紧凑区域，最多三行；更大的地图只增加列数。 */
export function growRooms(s: ExploreState, roomCount: number) {
  const rows = Math.min(3, Math.max(1, Math.floor(Math.sqrt(roomCount))));
  const cols = Math.max(rows, Math.ceil(roomCount / rows));
  const start = makeRoom(Math.floor(cols / 2), Math.floor(rows / 2), 1);
  const rooms: Record<string, RoomNode> = { [start.id]: start };
  const order = [start.id];
  let minX = start.gx;
  let maxX = start.gx;
  let minY = start.gy;
  let maxY = start.gy;

  while (order.length < roomCount) {
    const frontier: Frontier[] = [];
    for (const id of order) {
      const from = rooms[id];
      for (const dir of PORTAL_DIRS) {
        const { dx, dy } = DIR_STEP[dir];
        const gx = from.gx + dx;
        const gy = from.gy + dy;
        if (gx < 0 || gx >= cols || gy < 0 || gy >= rows || rooms[roomIdAt(gx, gy)]) continue;
        const width = Math.max(maxX, gx) - Math.min(minX, gx) + 1;
        const height = Math.max(maxY, gy) - Math.min(minY, gy) + 1;
        // 填补已有轮廓中的空位优先，其次选取接近方形且横向的轮廓。
        const score = width * height + Math.abs(width - height) * 2 + Math.max(0, height - width) * 4;
        frontier.push({ from, dir, gx, gy, score });
      }
    }
    // 连通矩形未满时一定存在前沿，不依赖随机重试次数来保证房间总数。
    const best = Math.min(...frontier.map((entry) => entry.score));
    const choices = frontier.filter((entry) => entry.score === best);
    const chosen = choices[rngInt(s, choices.length)];
    const room = makeRoom(chosen.gx, chosen.gy, order.length + 1);
    rooms[room.id] = room;
    order.push(room.id);
    link(chosen.from, room, chosen.dir);
    minX = Math.min(minX, room.gx);
    maxX = Math.max(maxX, room.gx);
    minY = Math.min(minY, room.gy);
    maxY = Math.max(maxY, room.gy);
  }

  const loops: { from: RoomNode; to: RoomNode; dir: PortalDir }[] = [];
  for (const id of order) {
    const from = rooms[id];
    for (const dir of ["right", "down"] as const) {
      const { dx, dy } = DIR_STEP[dir];
      const to = rooms[roomIdAt(from.gx + dx, from.gy + dy)];
      if (to && !from.exits[dir]) loops.push({ from, to, dir });
    }
  }
  const extra = Math.floor(roomCount * EXPLORE_RULES.dungeon.loopEdgeRatio);
  for (const edge of shuffle(s, loops).slice(0, extra)) link(edge.from, edge.to, edge.dir);
  return { rooms, order };
}
