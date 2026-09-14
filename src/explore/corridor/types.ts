// 房间内的横向场景使用设计画布坐标; 房间宽两屏(3840×1080), 镜头跟随玩家卷动。
// 场景状态随远征会话保留, 战后返回原处; 房间之间的连通关系见 ../dungeon/types.ts。
import type { PortalDir } from "../dungeon/types";

export type CurioKind = "chest" | "medical" | "terminal" | "vending" | "purifier" | "scrap" | "dispatch" | "camp";

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
  final: boolean;
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
  portals: CorridorPortal[];
  activeObjectId: string | null;
  encounterId: string | null;
  /** 玩家当前脚下的传送门方向; 站上去即点亮小地图, 再确认才真的传送。 */
  standingPortalDir: PortalDir | null;
}

export const CORRIDOR = {
  /** 房间渲染宽度, 为设计画布的两倍。 */
  width: 3840,
  /** 可视区域宽度, 与设计画布等宽。 */
  viewportWidth: 1920,
  floorY: 680,
  speed: 240,
  /** 可行走范围, 两侧各留出墙体厚度。 */
  walkMin: 170,
  walkMax: 3670,
  interactionRadius: 190,
  encounterRadius: 190,
  encounterMs: 1850,
  /** 站上传送门的判定半径; 比交互半径小, 避免与相邻物件抢操作。 */
  portalRadius: 120,
  /** 传送门专用左右边缘槽位。 */
  portalEdgeSlots: [300, 3540] as readonly number[],
  /** 房间中段槽位: 可交互物与额外传送门共用, 跳过黑影所在的正中位置。 */
  slots: [800, 1120, 1440, 1760, 2080, 2400, 2720, 3040] as readonly number[],
} as const;
