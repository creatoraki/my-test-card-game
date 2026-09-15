// ★ 房间小地图 ★ —— 房间制唯一的空间信息来源。
//
// 场景里的四座传送门外观完全一致、方向不可辨认, 所以「这扇门通往哪里」只有这块小地图知道:
// 玩家站上某座传送门 → 那扇门的目标房间在这里亮起(位置已知, 内容仍未知)。
// 因此它不是装饰性 HUD, 而是这套玩法的主界面之一。
//
// 三种格子状态(见 dungeon/types.ts):
//   · 已访问 —— 画房间序号, 搜干净后加「已探索」角标并降饱和;
//   · 已点亮 —— 被传送门照出过位置, 画「?」;
//   · 已知邻接 —— 与某个已访问房相连但还没被点亮, 画淡「?」占位。

import { isRoomExplored } from "@/explore/dungeon/session";
import type { DungeonState, RoomNode } from "@/explore/dungeon/types";
import type { CorridorState } from "@/explore/corridor/types";
import { EXPLORE_RULES } from "@/explore/rules";
import s from "./Minimap.module.css";

const CELL = 52;
const STEP = 78;

type CellState = "visited" | "revealed" | "hinted";

interface Cell {
  room: RoomNode;
  state: CellState;
  left: number;
  top: number;
}

function stateOf(room: RoomNode, dungeon: DungeonState): CellState | null {
  if (room.visited) return "visited";
  if (dungeon.layoutKnown) return "revealed";
  if (room.revealed) return "revealed";
  // 与任意已访问房相连 ⇒ 玩家已经知道「那边还有一间」, 但不知道是哪一间。
  const touched = Object.values(room.exits).some((id) => dungeon.rooms[id]?.visited);
  return touched ? "hinted" : null;
}

export function Minimap({ dungeon, corridor }: { dungeon: DungeonState; corridor: CorridorState }) {
  const { minX, maxX, minY, maxY } = dungeon.bounds;
  const width = (maxX - minX) * STEP + CELL;
  const height = (maxY - minY) * STEP + CELL;

  const cells: Cell[] = [];
  for (const id of dungeon.order) {
    const room = dungeon.rooms[id];
    const state = stateOf(room, dungeon);
    if (!state) continue;
    cells.push({ room, state, left: (room.gx - minX) * STEP, top: (room.gy - minY) * STEP });
  }
  const shown = new Set(cells.map((cell) => cell.room.id));

  // 连线: 只画「至少一端已访问」的通道 —— 玩家没去过的两间房之间有没有门, 他并不知道。
  const seen = new Set<string>();
  const links: { x1: number; y1: number; x2: number; y2: number; solid: boolean }[] = [];
  for (const cell of cells) {
    for (const targetId of Object.values(cell.room.exits)) {
      const target = dungeon.rooms[targetId];
      if (!target || !shown.has(targetId)) continue;
      if (!dungeon.layoutKnown && !cell.room.visited && !target.visited) continue;
      const key = [cell.room.id, targetId].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      links.push({
        x1: cell.left + CELL / 2, y1: cell.top + CELL / 2,
        x2: (target.gx - minX) * STEP + CELL / 2, y2: (target.gy - minY) * STEP + CELL / 2,
        solid: !dungeon.layoutKnown && cell.room.visited && target.visited,
      });
    }
  }

  const standingDir = corridor.standingPortalDir;
  const targetId = standingDir
    ? corridor.portals.find((portal) => portal.dir === standingDir)?.to ?? null
    : null;
  const target = targetId ? dungeon.rooms[targetId] : null;

  return <div className={s.map} aria-label="房间小地图">
    <div className={s.head}>
      <span>区域图</span>
      <b>{cells.filter((cell) => cell.room.visited).length} / {dungeon.order.length}</b>
    </div>
    <div className={s.grid} style={{ width, height }}>
      <svg className={s.links} width={width} height={height} aria-hidden>
        {links.map((link, index) => <line key={index} x1={link.x1} y1={link.y1} x2={link.x2} y2={link.y2}
          className={link.solid ? s.linkSolid : s.linkDashed} />)}
      </svg>
      {cells.map(({ room, state, left, top }) => {
        const explored = room.visited && isRoomExplored(room);
        const knownThreat = dungeon.threatsKnown || room.visited;
        const badge = knownThreat && room.kind === "boss" ? "☗"
          : knownThreat && room.kind === "battle" && !room.threatDefeated ? "▲"
            : explored ? "✓" : "";
        return <div key={room.id} className={s.cell} data-state={state}
          data-current={room.id === dungeon.currentRoomId || undefined}
          data-explored={explored || undefined}
          data-target={room.id === targetId || undefined}
          style={{ left, top, width: CELL, height: CELL }}
          aria-label={room.visited
            ? `${room.label} 号房间${explored ? "，已探索" : ""}`
            : "未知房间"}>
          <span className={s.face}>{room.visited ? room.label : "?"}</span>
          {badge && <i className={s.badge} aria-hidden>{badge}</i>}
        </div>;
      })}
    </div>
    <p className={s.hint} data-live={Boolean(target) || undefined}>
      {target
        ? `脚下传送门通往${target.visited ? ` ${target.label} 号房间` : "此处"} · 粒子 −${EXPLORE_RULES.dungeon.energyPerRoomMove}`
        : "站上传送门可点亮它通往的房间"}
    </p>
  </div>;
}

export default Minimap;
