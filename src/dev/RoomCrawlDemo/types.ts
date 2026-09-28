/** 可切换的地图: 废弃楼层 / 生态方舟。 */
export type MapId = "ruins" | "ark";

/** 房间所属子区域: 决定后墙、地面、背景层、前景层与空气层的 shader 组合。 */
export type ZoneId = "dock" | "pump" | "arcade" | "server" | "core" | "arkDeck" | "arkGarden" | "arkGrove";

/** 门所在的边: 左右门在地面两端, 上门嵌在后墙, 下门在前沿。 */
export type DoorSide = "left" | "right" | "up" | "down";

/** 可调查物: 废弃楼层三种(保险箱 / 售货机 / 遗骸)+ 生态方舟三种(种子保险柜 / 补给终端 / 培育舱)。 */
export type PropKind = "safe" | "vending" | "remains" | "seedVault" | "terminal" | "incubator";

/** 纯装饰摆件(有占地、参与纵深排序, 不可调查)。前六种属废弃楼层, 后五种属生态方舟。 */
export type DecorKind =
  | "crates" | "barrel" | "pallet" | "debris" | "cone" | "spool"
  | "planter" | "fern" | "bench" | "palmPot" | "mossRock";

/** 灯的闪烁方式: 稳定 / 电流嗡鸣 / 接触不良 / 呼吸 / 旋转警报。 */
export type FlickerMode = "steady" | "buzz" | "broken" | "pulse" | "alarm";

/** 房间坐标: x 横向(px), z 纵深(0 = 后墙根, 向前增大)。 */
export interface FloorPoint {
  x: number;
  z: number;
}

export interface DoorDef {
  side: DoorSide;
  /** 目标房间 id。 */
  to: string;
  /** 上 / 下门的门洞中心 x; 左右门不用。 */
  x?: number;
}

export interface PropDef {
  id: string;
  kind: PropKind;
  x: number;
  z: number;
  /** 调查后飘出的获得物描述。 */
  loot: string;
  flip?: boolean;
}

export interface DecorDef {
  kind: DecorKind;
  x: number;
  z: number;
  scale?: number;
  flip?: boolean;
  seed?: number;
}

export interface GuardDef {
  id: string;
  /** 巡逻折返点, 至少两个。 */
  patrol: FloorPoint[];
}

export interface LightDef {
  x: number;
  /** 离地高度(px)。 */
  h: number;
  z: number;
  color: number;
  intensity: number;
  radius: number;
  flicker?: FlickerMode;
}

/** 场景特效挂点: 滴水 / 电火花 / 腐化孢子 / 余烬 / 花粉。 */
export type FxKind = "drip" | "sparks" | "spores" | "embers" | "pollen";

export interface FxDef {
  kind: FxKind;
  x: number;
  /** 地面纵深; 挂在后墙上的特效为 0。 */
  z?: number;
  /** 离地高度(px)。 */
  h?: number;
  /** 区域型特效(孢子 / 余烬)的横向宽度。 */
  width?: number;
}

/** 地面上的椭圆阻挡(纵深半径已按显示压扁前的 z 计)。 */
export interface Blocker {
  x: number;
  z: number;
  rx: number;
  rz: number;
}

export interface RoomDef {
  id: string;
  name: string;
  zone: ZoneId;
  width: number;
  /** 后墙装饰随机种子。 */
  seed: number;
  doors: DoorDef[];
  props: PropDef[];
  decor: DecorDef[];
  guards: GuardDef[];
  lights: LightDef[];
  fx: FxDef[];
  spawn: FloorPoint;
}

/** 一套地图: 房间表与起点房间。 */
export interface MapDef {
  id: MapId;
  name: string;
  rooms: readonly RoomDef[];
  /** 起点房间 id。 */
  start: string;
}

/** 调查提示: 交给 DOM 层显示「E 调查 · 名称」。 */
export interface PromptInfo {
  id: string;
  name: string;
}

/** 获得物飘字。坐标为设计画布 px。 */
export interface LootNotice {
  key: number;
  text: string;
  x: number;
  y: number;
}

export type EncounterChoice = "banish" | "retreat";

/** 房间加载(着色器编译 + 烘焙)中的黑幕提示。 */
export interface LoadingState {
  /** 正在进入的房间名。 */
  name: string;
  /** 进度 0~1。 */
  progress: number;
}

/** 运行时 → React 的全部回调。坐标均为设计画布 px。 */
export interface CrawlCallbacks {
  /** 房间加载进度; null 表示加载结束。 */
  onLoading(state: LoadingState | null): void;
  onPrompt(info: PromptInfo | null): void;
  onPromptMove(x: number, y: number): void;
  onLoot(notice: LootNotice): void;
  onEncounter(guardId: string): void;
  onDebug(on: boolean): void;
}
