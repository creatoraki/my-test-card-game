/** 横向探索使用设计画布坐标；位置随远征会话保留，战后返回原处。 */
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

export interface CorridorState {
  round: number;
  width: number;
  playerX: number;
  facing: -1 | 1;
  exploredX: number;
  objects: CorridorObject[];
  threats: CorridorThreat[];
  activeObjectId: string | null;
  encounterId: string | null;
}

export const CORRIDOR = {
  width: 5600,
  startX: 220,
  floorY: 746,
  speed: 340,
  interactionRadius: 190,
  encounterRadius: 190,
  encounterMs: 1850,
  viewportWidth: 1920,
} as const;
