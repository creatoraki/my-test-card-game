// 废弃楼层演示的纯数据类型。坐标单位为米: 房间占据 x∈[0,width], z∈[0,depth], y 向上。
// 镜头从 +x+z 方向斜 45° 俯视, 所以 x0 / z0 两面是完整高度的后墙, x1 / z1 两面是剖切矮墙。

export interface Vec2 { x: number; z: number }

export type WallSide = "x0" | "x1" | "z0" | "z1";

export type FloorFinish = "terrazzo" | "carpet" | "tile" | "concrete";

export interface DoorDef {
  id: string;
  side: WallSide;
  /** 门中心沿墙方向的坐标(x 墙取 z, z 墙取 x)。 */
  offset: number;
  width: number;
  to: { roomId: string; doorId: string };
}

export interface WindowDef {
  side: WallSide;
  offset: number;
  width: number;
  bottom: number;
  top: number;
}

export type PropKind = "filingCabinet" | "vendingMachine" | "remains";

/** rot: 绕 Y 轴的朝向, 模型本地 +z 为正面。 */
export interface PropDef {
  id: string;
  kind: PropKind;
  x: number;
  z: number;
  rot: number;
}

export type DecorKind =
  | "desk" | "partition" | "chair" | "table" | "plant" | "boxes" | "bench" | "counter" | "water"
  | "shelf" | "board"
  | "elevator" | "stairs" | "pipes" | "extinguisher"
  | "debris" | "papers" | "puddle" | "glass" | "tape" | "cable" | "sign";

export interface DecorDef {
  kind: DecorKind;
  x: number;
  z: number;
  rot?: number;
  /** 需要尺寸的装饰(柜台长度、积水、散落范围、楼梯占地等)。 */
  size?: [number, number];
  /** 挂墙类装饰贴在哪面墙上。 */
  wall?: WallSide;
  variant?: number;
}

export type LightKind = "tube" | "emergency" | "moon" | "exit" | "lamp";
export type FlickerMode = "steady" | "flicker" | "dying" | "off" | "pulse";

export interface LightDef {
  kind: LightKind;
  x: number;
  z: number;
  y?: number;
  color?: number;
  intensity?: number;
  flicker?: FlickerMode;
  shadow?: boolean;
  /** 聚光类灯光的照射目标。 */
  target?: [number, number, number];
  /** 挂墙类灯具贴在哪面墙上。 */
  wall?: WallSide;
}

/** 路径只有一个点时守卫原地静立。 */
export interface GuardDef {
  id: string;
  path: Vec2[];
  y?: number;
  speed?: number;
  pause?: number;
  facing?: number;
}

export interface RoomMood {
  /** 半球环境光的天空色 / 地面色 / 强度。 */
  sky: number;
  ground: number;
  ambient: number;
  /** 浮尘密度 0~1。 */
  dust: number;
  /** 贴地雾颜色与浓度。 */
  fog: number;
  fogDensity: number;
}

export interface RoomDef {
  id: string;
  name: string;
  width: number;
  depth: number;
  floor: FloorFinish;
  wallTint: number;
  mood: RoomMood;
  doors: DoorDef[];
  windows: WindowDef[];
  props: PropDef[];
  decor: DecorDef[];
  lights: LightDef[];
  guards: GuardDef[];
  spawn: Vec2;
  spawnYaw: number;
}

export interface PropInfo {
  name: string;
  verb: string;
}
