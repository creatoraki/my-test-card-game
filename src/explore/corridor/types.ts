// 房间内的横向场景使用设计画布坐标; 宽度由近景素材 2 倍显示宽度决定, 镜头跟随玩家卷动。
// 场景状态随远征会话保留, 战后返回原处; 房间之间的连通关系见 ../dungeon/types.ts。
import type { NearMapVariant, PortalDir } from "../dungeon/types";
import { NEAR_MAP_GEOMETRY } from "../dungeon/nearMapGeometry";

export type CurioKind =
  | "safe"
  | "crystalVein"
  | "vending"
  | "remains"
  | "compactor"
  | "medical"
  | "sink"
  | "repairPod"
  | "modBench"
  | "cardPrinter"
  | "shrine"
  | "dispatch"
  | "merchant";

export interface CorridorObject {
  id: string;
  kind: CurioKind;
  x: number;
  used: boolean;
  nodeIndex: number;
}

export interface CorridorThreat {
  id: string;
  x: number;
  defeated: boolean;
  nodeIndex: number;
}

/** 房间地面上的一座传送门。四个方向外观完全一致, 方向只能从小地图读出。 */
export interface CorridorPortal {
  dir: PortalDir;
  x: number;
  to: string;
}

export interface CorridorState {
  roomId: string;
  width: number;
  playerX: number;
  facing: -1 | 1;
  objects: CorridorObject[];
  threats: CorridorThreat[];
  bossGate: { x: number } | null;
  bossGateOpen: boolean;
  portals: CorridorPortal[];
  activeObjectId: string | null;
  encounterId: string | null;
  /** 玩家当前脚下的传送门方向; 站上去即点亮小地图, 再确认才真的传送。 */
  standingPortalDir: PortalDir | null;
}

export const CORRIDOR = {
  /** 旧布局的参考宽度；只用于按素材宽度换算传送门与物件槽位。 */
  referenceWidth: 3840,
  /** 可视区域宽度, 与设计画布等宽。 */
  viewportWidth: 1920,
  floorY: 680,
  speed: 264,
  /** 可行走范围的左右墙体留白。 */
  walkMin: 170,
  interactionRadius: 190,
  encounterRadius: 190,
  encounterMs: 1850,
  /** 站上传送门的判定半径; 比交互半径小, 避免与相邻物件抢操作。 */
  portalRadius: 120,
  /** 旧布局的传送门边缘槽位，会按当前素材宽度等比换算。 */
  basePortalEdgeSlots: [300, 3540] as readonly number[],
  /** 旧布局的中段槽位，会按当前素材宽度等比换算。 */
  baseSlots: [800, 1120, 1440, 1760, 2080, 2400, 2720, 3040] as readonly number[],
} as const;

/** 当前近景素材 2 倍显示宽度，也就是对应房间的宽度。 */
export function corridorWidthFor(variant: NearMapVariant): number {
  return NEAR_MAP_GEOMETRY[variant].width;
}

/** 把旧场景的横向槽位按素材宽度换算到当前房间。 */
function scaleSlots(slots: readonly number[], variant: NearMapVariant): number[] {
  const ratio = corridorWidthFor(variant) / CORRIDOR.referenceWidth;
  return slots.map((slot) => Math.round(slot * ratio));
}

export function corridorPortalEdgeSlotsFor(variant: NearMapVariant): number[] {
  return scaleSlots(CORRIDOR.basePortalEdgeSlots, variant);
}

export function corridorSlotsFor(variant: NearMapVariant): number[] {
  return scaleSlots(CORRIDOR.baseSlots, variant);
}

export function corridorWalkMax(width: number): number {
  return width - CORRIDOR.walkMin;
}
