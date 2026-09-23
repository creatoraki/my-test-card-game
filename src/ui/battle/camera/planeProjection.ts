import { CINEMA } from "@/ui/battle/choreo/animations";
import { AXIS, type Camera } from "./camera";

// 敌人平面(.battle-plane)的 2D 投影。
//
// 背景/粒子仍在透视容器里吃 cameraCss 的 3D 变换; 敌人单位却必须脱离透视 ——
// Chrome 对带透视的合成层只能近似估算栅格倍率, 推镜时立绘/BUFF/血条会按 1× 位图被拉糊。
// 这里把「世界层 → 相机层 → 透视投影」这条完整的 3D 链路在每个单位的锚点处线性化成一个
// 2D matrix(): 锚点位置与原 3D 成像逐 px 一致, 缩放/旋转随镜头走, 只丢掉 ≤8° 偏航俯仰在
// 单位内部造成的微小梯形形变(肉眼不可辨)。纯 2D 变换不设 will-change, 浏览器会按真实倍率重绘。

/** 世界层的屏幕效果: 平移(冲量 + 漂移)与 punch 缩放, 以画布中心为原点。 */
export interface WorldFx {
  x: number;
  y: number;
  k: number;
}

export interface Point {
  x: number;
  y: number;
}

const RAD = Math.PI / 180;
const JACOBIAN_STEP = 40;

/** 世界平面(z=0)上的一点经完整 3D 链路后的屏幕位置(设计 px)。
 *  顺序与 cameraCss 严格一致: CSS 变换从右往左作用于点。 */
export function projectPoint(camera: Camera, fx: WorldFx, p: Point): Point {
  const P = CINEMA.perspective;
  // 世界层: translate(fx) scale(k), transform-origin = 画布中心
  let x = (p.x - AXIS.x) * fx.k + fx.x + camera.dx;
  let y = (p.y - AXIS.y) * fx.k + fx.y + camera.dy;
  let z = 0;

  // rotateZ(roll)
  const r = camera.roll * RAD;
  [x, y] = [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
  // rotateX(pitch): y' = y cos − z sin, z' = y sin + z cos
  const a = camera.pitch * RAD;
  [y, z] = [y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
  // rotateY(yaw): x' = x cos + z sin, z' = −x sin + z cos
  const b = camera.yaw * RAD;
  [x, z] = [x * Math.cos(b) + z * Math.sin(b), -x * Math.sin(b) + z * Math.cos(b)];
  // translateZ(推进量)
  z += P * (1 - 1 / camera.s);

  // 透视投影: perspective-origin = 画布中心
  const w = P / Math.max(1, P - z);
  return { x: AXIS.x + x * w, y: AXIS.y + y * w };
}

/**
 * 单位包裹层的 2D 变换。
 * @param origin 包裹层左上角的布局位置(transform-origin: 0 0)
 * @param anchor 线性化基点(单位视觉中心)
 */
export function unitPlaneMatrix(camera: Camera, fx: WorldFx, origin: Point, anchor: Point): string {
  const h = JACOBIAN_STEP;
  const px1 = projectPoint(camera, fx, { x: anchor.x + h, y: anchor.y });
  const px0 = projectPoint(camera, fx, { x: anchor.x - h, y: anchor.y });
  const py1 = projectPoint(camera, fx, { x: anchor.x, y: anchor.y + h });
  const py0 = projectPoint(camera, fx, { x: anchor.x, y: anchor.y - h });
  const sa = projectPoint(camera, fx, anchor);
  const a = (px1.x - px0.x) / (2 * h);
  const b = (px1.y - px0.y) / (2 * h);
  const c = (py1.x - py0.x) / (2 * h);
  const d = (py1.y - py0.y) / (2 * h);
  const lx = anchor.x - origin.x;
  const ly = anchor.y - origin.y;
  const e = sa.x - origin.x - (a * lx + c * ly);
  const f = sa.y - origin.y - (b * lx + d * ly);
  return `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`;
}
