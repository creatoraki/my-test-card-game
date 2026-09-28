import type { BuildingKind, BuildingPlacement, LampSpot, LightTone, NeonTone } from "../types";
import type { Random } from "../core/base/random";
import { BRICK, CONCRETE, PLASTER, TILE, type Ramp } from "../core/base/palette";
import type { WallKind } from "../core/base/surfaces";
import { BASE } from "../facade/storey";

export { BASE, M, STOREY, floorY } from "../facade/storey";

/** 一种建筑的登记信息：尺寸范围、可选层数、抽取权重、灯位规划与绘制函数。 */
export interface BuildingSpec {
  kind: BuildingKind;
  label: string;
  width: readonly [number, number];
  /** 可选层数，重复项即权重；可为小数（1.5 = 带阁楼）。 */
  storeys: readonly number[];
  /** 屋面之上的额外高度（女儿墙、招牌、顶棚），用于包围盒。 */
  crown: number;
  weight: number;
  /** 规划阶段决定灯位（门洞跟随灯位），保证地面反光与建筑绘制同源。 */
  lamps(x: number, width: number, storeys: number, rnd: Random, neon: NeonTone): LampSpot[];
  /** 只允许用 createRandom(p.seed) 取随机，保证跨块绘制一致。 */
  draw(ctx: CanvasRenderingContext2D, p: BuildingPlacement): void;
}

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** 点光色调：冷白为主，按 warmChance 保留少量暖色点缀。 */
export function lampTone(rnd: Random, warmChance: number): LightTone {
  return rnd.chance(warmChance) ? "warm" : "white";
}

/** 灯光色 → 仅限霓虹的色调（白灯 / 暖灯场合回退为青色）。 */
export function neonOf(tone: LightTone): NeonTone {
  return tone === "warm" || tone === "white" ? "cyan" : tone;
}

/** 门洞 / 店面的开间：按目标开间宽度均分，灯位与绘制共用同一份切分。 */
export function bayLayout(x: number, width: number, target = 500): { x0: number; x1: number }[] {
  const n = Math.max(1, Math.round(width / target));
  const bw = width / n;
  return Array.from({ length: n }, (_, i) => ({ x0: Math.round(x + i * bw), x1: Math.round(x + (i + 1) * bw) }));
}

/** 城市墙面：色阶与材质成对抽取。 */
export function pickWall(r: Random): { ramp: Ramp; kind: WallKind } {
  const roll = r.next();
  if (roll < 0.3) return { ramp: PLASTER, kind: "paint" };
  if (roll < 0.55) return { ramp: TILE, kind: "tile" };
  if (roll < 0.8) return { ramp: BRICK, kind: "brick" };
  return { ramp: CONCRETE, kind: "panel" };
}

/** 门口灯位的便捷构造。 */
export function doorSpot(x: number, y: number, tone: LightTone, kind: "lamp" | "strip"): LampSpot {
  return { x: Math.round(x), y: Math.round(y), tone, kind, door: true };
}

/** 画面顶边在这栋楼局部坐标里的 y（后排缩小绘制时更高），再留一点余量；高于它的部分不必绘制。 */
export function skyY(p: BuildingPlacement): number {
  return Math.round(BASE - (BASE + 90) / p.scale);
}
