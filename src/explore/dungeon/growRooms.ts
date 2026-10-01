// 骨架 → 房间节点。骨架由 dungeonLayout 按每日布局种子生成, 这里只负责落成 RoomNode 并连门。
// order 按从起点出发的 BFS 顺序排列: order[0] 必为起点, 小地图序号也由近及远递增。

import { buildLayout, type SkelCell } from "../dungeonLayout";
import { DIR_STEP, roomIdAt, type RoomNode } from "./types";
import { link, makeRoom } from "./roomNode";

const idOf = (cell: SkelCell): string => roomIdAt(cell.x, cell.y);

export function growRooms(layoutSeed: number, roomCount: number) {
  const layout = buildLayout(layoutSeed, roomCount);
  const byId = new Map(layout.cells.map((cell) => [idOf(cell), cell]));

  const order: string[] = [];
  const seen = new Set([idOf(layout.start)]);
  const queue = [layout.start];
  while (queue.length) {
    const cell = queue.shift() as SkelCell;
    order.push(idOf(cell));
    for (const dir of cell.links) {
      const { dx, dy } = DIR_STEP[dir];
      const id = roomIdAt(cell.x + dx, cell.y + dy);
      if (seen.has(id)) continue;
      seen.add(id);
      queue.push(byId.get(id) as SkelCell);
    }
  }

  const rooms: Record<string, RoomNode> = {};
  order.forEach((id, index) => {
    const cell = byId.get(id) as SkelCell;
    rooms[id] = makeRoom(cell.x, cell.y, index + 1);
  });
  for (const id of order) {
    const cell = byId.get(id) as SkelCell;
    for (const dir of cell.links) {
      // 每条边只连一次: 只处理朝右、朝下的那一端。
      if (dir !== "right" && dir !== "down") continue;
      const { dx, dy } = DIR_STEP[dir];
      link(rooms[id], rooms[roomIdAt(cell.x + dx, cell.y + dy)], dir);
    }
  }
  return { rooms, order, startId: idOf(layout.start), bossId: idOf(layout.boss), archetype: layout.archetype };
}
