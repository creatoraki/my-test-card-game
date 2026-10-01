// ============================================================================
// 青岚横断的实时布局: 回查各目标的受击点, 推出整条斩线。
//
// 画布铺满战斗画布(.battle, 设计坐标), 目标在敌人平面里由相机 rig 逐帧写变换 ——
// 所以这里**每帧**按 data-vfx-anchor(HitFxLayer 的 0×0 受击锚点)重新量一次,
// 再把屏幕坐标折回设计坐标。镜头推近、震屏时刀痕依旧贴在目标身上。
// ============================================================================

export interface GaleTarget {
  id: string;
  missed: boolean; // 全部落空: 不落刀痕与碎片, 只吃风痕
}

export interface GalePoint {
  x: number;
  y: number;
  missed: boolean;
}

export interface GaleLayout {
  w: number;
  h: number;
  points: GalePoint[]; // 已量到的目标受击点(设计坐标)
  rowY: number; // 斩线在画面中央处的高度
  slope: number; // 斩线斜率(dy/dx), 微微右上扬, 比水平线更有冲劲
  cx: number; // 斩线取高度的基准横坐标
  eyeX: number; // 风眼(风刃射出点)
  endX: number; // 风刃出画点
  bladeH: number; // 月牙风刃高度
}

const SLOPE = -0.07;

/** 斩线上横坐标 x 处的高度。 */
export const lineY = (layout: GaleLayout, x: number) => layout.rowY + layout.slope * (x - layout.cx);

/** 目标锚点元素缓存: 同一次播放内只查一次 DOM, 丢失(卸载)时再查。 */
export function createAnchorLookup(root: ParentNode) {
  const cache = new Map<string, HTMLElement>();
  return (id: string): HTMLElement | null => {
    const hit = cache.get(id);
    if (hit?.isConnected) return hit;
    const found = root.querySelector<HTMLElement>(`[data-cmb-id="${CSS.escape(id)}"] [data-vfx-anchor]`);
    if (found) cache.set(id, found);
    return found;
  };
}

export function measureLayout(
  canvas: HTMLCanvasElement,
  targets: GaleTarget[],
  lookup: (id: string) => HTMLElement | null,
  previous: GaleLayout | null,
): GaleLayout {
  const w = canvas.clientWidth || 1920;
  const h = canvas.clientHeight || 1080;
  const rect = canvas.getBoundingClientRect();
  const kx = rect.width > 0 ? w / rect.width : 1;
  const ky = rect.height > 0 ? h / rect.height : 1;

  const points: GalePoint[] = [];
  for (const target of targets) {
    const anchor = lookup(target.id);
    if (!anchor) continue;
    const box = anchor.getBoundingClientRect();
    points.push({ x: (box.left - rect.left) * kx, y: (box.top - rect.top) * ky, missed: target.missed });
  }
  // 一个锚点都量不到(目标已卸载等): 沿用上一帧, 首帧则退回画面上部的默认站位。
  if (!points.length && previous) return previous;

  const rowY = points.length ? points.reduce((sum, p) => sum + p.y, 0) / points.length : h * 0.42;
  const left = points.length ? Math.min(...points.map((p) => p.x)) : w * 0.3;
  const cx = w / 2;
  return {
    w,
    h,
    points,
    rowY,
    slope: SLOPE,
    cx,
    eyeX: Math.min(Math.max(left - 300, w * 0.06), w * 0.24),
    endX: w * 1.12,
    bladeH: Math.min(Math.max(h * 0.4, 340), 470),
  };
}
