import { getRoom, GRID_SIZE, ROOMS } from "../../data";
import type { RoomDef, WorldSnapshot } from "../../types";
import s from "./RoomMinimap.module.css";

const CELL_W = 64;
const CELL_H = 40;
const GAP = 24;

function cellPos(room: RoomDef): { left: number; top: number } {
  return { left: room.grid.col * (CELL_W + GAP), top: room.grid.row * (CELL_H + GAP) };
}

/** 两个房间之间的连线(只画一次: 左→右、上→下)。 */
function links(): { key: string; left: number; top: number; w: number; h: number }[] {
  const out: { key: string; left: number; top: number; w: number; h: number }[] = [];
  for (const room of ROOMS) {
    const a = cellPos(room);
    for (const door of room.doors) {
      if (door.side !== "right" && door.side !== "down") continue;
      if (door.side === "right") out.push({ key: `${room.id}-r`, left: a.left + CELL_W, top: a.top + CELL_H / 2 - 2, w: GAP, h: 4 });
      else out.push({ key: `${room.id}-d`, left: a.left + CELL_W / 2 - 2, top: a.top + CELL_H, w: 4, h: GAP });
    }
    for (const door of room.doors) {
      if (door.side !== "up") continue;
      const other = getRoom(door.to);
      if (other.doors.some((d) => d.side === "down" && d.to === room.id)) continue;
      out.push({ key: `${room.id}-u`, left: a.left + CELL_W / 2 - 2, top: a.top - GAP, w: 4, h: GAP });
    }
  }
  return out;
}

const LINKS = links();

/**
 * DNF 式格子小地图: 已探索房间实心、当前房间高亮呼吸、仍有黑影的房间带红色警示角标,
 * 未探索的房间只显示暗框。
 */
export function RoomMinimap({ snapshot }: { snapshot: WorldSnapshot }) {
  const width = GRID_SIZE.cols * CELL_W + (GRID_SIZE.cols - 1) * GAP;
  const height = GRID_SIZE.rows * CELL_H + (GRID_SIZE.rows - 1) * GAP;
  const current = getRoom(snapshot.roomId);
  return <section className={s.panel} aria-label="楼层地图">
    <header className={s.head}>
      <span className={s.title}>楼层地图</span>
      <span className={s.here}>{current.name}</span>
    </header>
    <div className={s.grid} style={{ width, height }}>
      {LINKS.map((l) => <span key={l.key} className={s.link} style={{ left: l.left, top: l.top, width: l.w, height: l.h }} />)}
      {ROOMS.map((room) => {
        const visited = snapshot.visited.includes(room.id);
        const here = room.id === snapshot.roomId;
        const threat = visited && !snapshot.cleared.includes(room.id);
        const pos = cellPos(room);
        return <div
          key={room.id}
          className={s.cell}
          data-visited={visited || undefined}
          data-here={here || undefined}
          data-threat={threat || undefined}
          style={{ left: pos.left, top: pos.top, width: CELL_W, height: CELL_H }}
        >
          {visited && <span className={s.name}>{room.name.slice(0, 2)}</span>}
          {threat && <span className={s.threat} aria-label="仍有黑影" />}
          {here && <span className={s.marker} aria-hidden />}
        </div>;
      })}
    </div>
  </section>;
}
