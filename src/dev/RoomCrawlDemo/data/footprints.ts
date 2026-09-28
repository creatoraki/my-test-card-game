import type { Blocker, DecorDef, DecorKind, PropDef, PropKind } from "../types";

/** 可调查物的中文名(提示条用)。 */
export const PROP_NAMES: Record<PropKind, string> = {
  safe: "物资保险箱",
  vending: "故障售货机",
  remains: "探险者遗骸",
};

/** 可调查物的地面占地半径(x, z)。 */
const PROP_FOOT: Record<PropKind, [number, number]> = {
  safe: [62, 30],
  vending: [66, 34],
  remains: [58, 26],
};

/** 装饰物占地; 0 表示可以踩过去(碎屑、路锥)。 */
const DECOR_FOOT: Record<DecorKind, [number, number]> = {
  crates: [74, 36],
  barrel: [30, 16],
  pallet: [0, 0],
  debris: [0, 0],
  cone: [0, 0],
  spool: [52, 22],
};

export function propBlocker(prop: PropDef): Blocker {
  const [rx, rz] = PROP_FOOT[prop.kind];
  return { x: prop.x, z: prop.z - rz * 0.4, rx, rz };
}

export function decorBlocker(decor: DecorDef): Blocker | null {
  const [rx, rz] = DECOR_FOOT[decor.kind];
  if (!rx) return null;
  const s = decor.scale ?? 1;
  return { x: decor.x, z: decor.z - rz * s * 0.4, rx: rx * s, rz: rz * s };
}
