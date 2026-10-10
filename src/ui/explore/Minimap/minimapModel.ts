// 小地图数据模型 —— 把房间图翻译成「画哪些格子、每格什么视觉状态、画哪些路」。
// 纯函数, HUD 缩略图与展开大图共用; 视觉映射只对接已有数据:
//   当前 / Boss / 精英(未清的战斗房) / 陷阱(未触发的陷阱房) / 已完成 / 未探索 / 暗提示,
//   以及路牌揭示过类型的未访问普通房(物资房, 借用宝箱视觉)。
// 锁定视觉只存在于样式与图例中, 这里不会产出。

import { areRoomCuriosCleared, isRoomExplored } from "@/explore/dungeon/dungeonSession";
import { OPPOSITE_DIR, type DungeonState, type PortalDir, type RoomNode } from "@/explore/dungeon/types";
import type { CorridorState } from "@/explore/corridor/types";

export type CellState = "visited" | "revealed" | "hinted";

/** 格子的视觉色调, 与 MinimapTile.module.css 的 data-tone 一一对应。 */
export type MapTone = "current" | "cleared" | "unknown" | "locked" | "elite" | "trap" | "chest" | "boss";

export type MapIcon = "arrow" | "check" | "swords" | "question" | "lock" | "demon" | "trap" | "chest" | "boss";

export interface MapCell {
  room: RoomNode;
  state: CellState;
  tone: MapTone;
  icon: MapIcon;
  /** hinted 格: 与已访问房相连但没被点亮, 画成更暗的虚边问号。 */
  dim: boolean;
  explored: boolean;
  current: boolean;
  /** 房间里的月光传送盆: 去过该房间或任一座已点亮后才标出。 */
  waystone?: "lit" | "dark";
}

export interface MapLink {
  from: string;
  to: string;
  /** from → to 的方向; 网格邻接保证只有上下左右。 */
  dir: PortalDir;
  solid: boolean;
  /** 与当前房间直接相连的出口道路; 此时 from 恒为当前房间, 流光由此向外流动。 */
  active: boolean;
}

/** 玩家脚下那座传送门通往的房间 id; 没站在门上时为 null。 */
export function portalTargetId(corridor: CorridorState): string | null {
  const dir = corridor.standingPortalDir;
  return dir ? corridor.portals.find((portal) => portal.dir === dir)?.to ?? null : null;
}

export function roomAriaLabel(cell: MapCell): string {
  if (!cell.room.visited) return "未知房间";
  return `${cell.room.label} 号房间${cell.current ? "，当前位置" : cell.explored ? "，已探索" : ""}`;
}

function stateOf(room: RoomNode, dungeon: DungeonState): CellState | null {
  if (room.visited) return "visited";
  if (dungeon.layoutKnown) return "revealed";
  if (room.revealed) return "revealed";
  // 与任意已访问房相连 ⇒ 玩家已经知道「那边还有一间」, 但不知道是哪一间。
  const touched = Object.values(room.exits).some((id) => dungeon.rooms[id]?.visited);
  return touched ? "hinted" : null;
}

function visualOf(room: RoomNode, state: CellState, dungeon: DungeonState): { tone: MapTone; icon: MapIcon } {
  if (room.id === dungeon.currentRoomId) return { tone: "current", icon: "arrow" };
  const knownThreat = dungeon.threatsKnown || room.visited || Boolean(room.kindKnown);
  if (knownThreat && room.kind === "boss") return { tone: "boss", icon: "boss" };
  if (knownThreat && room.kind === "battle" && !room.threatDefeated) return { tone: "elite", icon: "demon" };
  if (knownThreat && room.kind === "trap" && !areRoomCuriosCleared(room)) return { tone: "trap", icon: "trap" };
  if (state === "visited" && isRoomExplored(room)) {
    return { tone: "cleared", icon: room.kind === "battle" ? "swords" : "check" };
  }
  if (room.kindKnown && !room.visited && room.kind === "normal") return { tone: "chest", icon: "chest" };
  return { tone: "unknown", icon: "question" };
}

/** 传送盆标记: 任一座点亮后两座都标出, 否则只标去过的房间。 */
function waystoneOf(room: RoomNode, anyLit: boolean): MapCell["waystone"] {
  const stone = room.curios.find((curio) => curio.kind === "waystone");
  if (!stone || (!room.visited && !anyLit)) return undefined;
  return stone.lit ? "lit" : "dark";
}

export function buildMapModel(dungeon: DungeonState): { cells: MapCell[]; links: MapLink[] } {
  const cells: MapCell[] = [];
  const anyLit = dungeon.order.some((id) => dungeon.rooms[id].curios.some((curio) => curio.kind === "waystone" && curio.lit));
  for (const id of dungeon.order) {
    const room = dungeon.rooms[id];
    const state = stateOf(room, dungeon);
    if (!state) continue;
    cells.push({
      room,
      state,
      ...visualOf(room, state, dungeon),
      dim: state === "hinted",
      explored: room.visited && isRoomExplored(room),
      current: room.id === dungeon.currentRoomId,
      waystone: waystoneOf(room, anyLit),
    });
  }
  const shown = new Set(cells.map((cell) => cell.room.id));

  // 连线: 只画「至少一端已访问」的通道 —— 玩家没去过的两间房之间有没有门, 他并不知道。
  const seen = new Set<string>();
  const links: MapLink[] = [];
  for (const cell of cells) {
    for (const [dir, targetId] of Object.entries(cell.room.exits) as [PortalDir, string][]) {
      const target = dungeon.rooms[targetId];
      if (!target || !shown.has(targetId)) continue;
      if (!dungeon.layoutKnown && !cell.room.visited && !target.visited) continue;
      const key = [cell.room.id, targetId].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      // 两端都去过 = 走过的路, 实线; 其余(含神谕揭示出的路)为虚线。
      const solid = cell.room.visited && target.visited;
      // 出口道路统一从当前房间出发, 流光方向才能指向「要去的地方」。
      links.push(targetId === dungeon.currentRoomId
        ? { from: targetId, to: cell.room.id, dir: OPPOSITE_DIR[dir], solid, active: true }
        : { from: cell.room.id, to: targetId, dir, solid, active: cell.room.id === dungeon.currentRoomId });
    }
  }
  return { cells, links };
}
