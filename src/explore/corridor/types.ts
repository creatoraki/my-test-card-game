// 房间内的横向场景使用设计画布坐标; 一个房间正好一屏 1920×1080, 镜头固定不卷轴。
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
  /** 单屏房间宽度, 与设计画布等宽。 */
  width: 1920,
  floorY: 680,
  speed: 340,
  /** 可行走范围, 两侧各留出墙体厚度。 */
  walkMin: 170,
  walkMax: 1750,
  interactionRadius: 190,
  encounterRadius: 190,
  encounterMs: 1850,
  /** 站上传送门的判定半径; 比交互半径小, 避免与相邻物件抢操作。 */
  portalRadius: 120,
  /** 地面等距槽位: 传送门与可交互物都落在其中, 天然不重叠。 */
  slots: [250, 500, 750, 1000, 1250, 1500, 1750] as readonly number[],
} as const;
