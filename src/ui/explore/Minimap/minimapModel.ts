// 小地图数据模型 —— 把房间图翻译成「画哪些格子、每格什么视觉状态、画哪些路」。
// 纯函数, HUD 缩略图与展开大图共用; 视觉映射只对接已有数据:
//   当前 / Boss / 精英(未清的战斗房) / 陷阱(未触发的陷阱房) / 已完成 / 未探索 / 暗提示。
// 宝箱、锁定两种视觉只存在于样式与图例中, 这里不会产出。

import { areRoomCuriosCleared, isRoomExplored } from "@/explore/dungeon/session";
import type { DungeonState, PortalDir, RoomNode } from "@/explore/dungeon/types";
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
}

export interface MapLink {
  from: string;
  to: string;
  /** from → to 的方向; 网格邻接保证只有上下左右。 */
  dir: PortalDir;
  solid: boolean;
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
  const knownThreat = dungeon.threatsKnown || room.visited;
  if (knownThreat && room.kind === "boss") return { tone: "boss", icon: "boss" };
  if (knownThreat && room.kind === "battle" && !room.threatDefeated) return { tone: "elite", icon: "demon" };
  if (knownThreat && room.kind === "trap" && !areRoomCuriosCleared(room)) return { tone: "trap", icon: "trap" };
  if (state === "visited" && isRoomExplored(room)) {
    return { tone: "cleared", icon: room.kind === "battle" ? "swords" : "check" };
  }
  return { tone: "unknown", icon: "question" };
}

export function buildMapModel(dungeon: DungeonState): { cells: MapCell[]; links: MapLink[] } {
  const cells: MapCell[] = [];
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
      links.push({
        from: cell.room.id,
        to: targetId,
        dir,
        // 两端都去过 = 走过的路, 实线; 其余(含神谕揭示出的路)为虚线。
        solid: cell.room.visited && target.visited,
      });
    }
  }
  return { cells, links };
}
