/**
 * 绘制层级(renderOrder)。全部材质都是透明且不写深度, 前后遮挡完全由这里决定:
 * 同层内按纵深 z 排序, z 越大(越靠前)越晚画。
 */
export const LAYER = {
  far: 0,
  wall: 10,
  wallAttach: 20,
  floor: 30,
  floorDecal: 40,
  shadow: 50,
  /** 物体层起点: 实际为 objects + z。 */
  objects: 100,
  air: 600,
  atmosphere: 700,
  foreground: 800,
} as const;

/** 物体按纵深排序; bias 用于同一位置上的细分(影子 < 本体 < 特效)。 */
export function orderForZ(z: number, bias = 0): number {
  return LAYER.objects + z + bias * 0.01;
}
