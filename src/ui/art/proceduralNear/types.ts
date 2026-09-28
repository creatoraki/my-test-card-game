/**
 * 程序化近景的几何约定（世界 px，设计画布 1080 高）。
 * 建筑立在 baseY 上；baseY→walkFrontY 是可行走的地面带；其下是前沿唇边与平台下方结构，一直画到底边。
 * 比例基准：角色约 230px ≈ 1.77m，即 1 米 ≈ 130px；一层楼 = 两倍身高 = 460px。
 */
export const NEAR_SCENE_GEOMETRY = {
  height: 1080,
  /** 建筑落地线，也是行走带后沿。 */
  baseY: 690,
  /** 行走带前沿（警示条下缘）。 */
  walkFrontY: 772,
  /** 前沿钢梁下缘，其下为平台下方结构。 */
  lipBottomY: 802,
  /** 角色脚底所在的纵深位置。 */
  standY: 742,
  /** 前景设施的落地线：行走带前沿，角色从它们身后走过。 */
  foreBaseY: 770,
  /** 分块烘焙的单块宽度。 */
  tileWidth: 1024,
  /** 1 米对应的像素。 */
  meter: 130,
  /** 一层楼的高度。 */
  storey: 460,
} as const;

export type NeonTone = "violet" | "blue" | "pink" | "cyan";
/** warm = 暖色灯（少量点缀）；white = 冷白 LED。 */
export type LightTone = NeonTone | "warm" | "white";

export type BuildingKind = "shopRow" | "convenience" | "repairShop" | "nightStall" | "metroEntrance" | "apartment" | "office";

export type StreetKind =
  | "busStop" | "bench" | "shelterSeat"
  | "vending" | "infoKiosk" | "phoneBooth" | "newsstand" | "foodCart"
  | "streetLamp" | "utilityBox" | "hydrant" | "mailbox" | "bins"
  | "motorbike" | "bicycle" | "cones" | "waterBarrier" | "guardRail";

/** 光源：既用于绘制灯具，也用于在地面上投出反光。 */
export interface LampSpot {
  x: number;
  y: number;
  tone: LightTone;
  /** lamp = 点光（壁灯、路灯、售货机）；strip = 条形光（灯箱、霓虹、门楣灯带）。 */
  kind: "lamp" | "strip";
  /** 位于门口正上方：门洞跟随它，交互物要避让它。 */
  door: boolean;
}

export interface BuildingPlacement {
  kind: BuildingKind;
  x: number;
  /** 按 scale=1 的设计宽度；实际占地为 width * scale。 */
  width: number;
  /** 建筑最高点的 y（按 scale=1），可能小于 0（出画）。 */
  top: number;
  /** 层数，可为 1.5（带阁楼）。 */
  storeys: number;
  /** 前排 1；后排缩小后雾化成中景天际线。 */
  scale: number;
  /** 绘制时唯一的随机来源；同一栋建筑跨块绘制时保证完全一致。 */
  seed: number;
  neon: NeonTone;
  lamps: LampSpot[];
}

export interface StreetPlacement {
  kind: StreetKind;
  x: number;
  width: number;
  /** 落地线：身后设施为 baseY + 8，前景设施为 foreBaseY。 */
  ground: number;
  seed: number;
  lamps: LampSpot[];
}

/** 楼间垂坠线缆：两端挂在相邻建筑的屋檐或出画处；flags 时挂一串三角彩旗。 */
export interface CablePlacement {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** 中点下垂量。 */
  sag: number;
  width: number;
  flags: boolean;
  seed: number;
}

/** 纯数据的房间排布：同一 seed + width 永远得到同一份结果。 */
export interface NearScenePlan {
  seed: number;
  width: number;
  /** 后排中景（缩小 + 雾化）。 */
  back: BuildingPlacement[];
  front: BuildingPlacement[];
  cables: CablePlacement[];
  /** 角色身后、立在行走带后沿的街道设施。 */
  street: StreetPlacement[];
  /** 角色前方的前景设施（单独一层，盖在角色之上）。 */
  fore: StreetPlacement[];
  /** 前排建筑 + 身后设施的全部光源，供地面反光使用。 */
  lamps: LampSpot[];
}

export interface BakedTile {
  x: number;
  width: number;
  canvas: HTMLCanvasElement;
}

export interface NearSceneBake {
  plan: NearScenePlan;
  tiles: BakedTile[];
  /** 前景层：只包含有前景设施的块。 */
  foreTiles: BakedTile[];
  /** 纯绘制耗时总和（不含逐帧让出的等待）。 */
  drawMs: number;
  slowestTileMs: number;
}

export interface BakeOptions {
  signal?: AbortSignal;
  onProgress?: (ratio: number) => void;
}
