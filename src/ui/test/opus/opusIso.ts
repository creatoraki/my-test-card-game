// 等距(2:1)投影的共享工具 —— 棋盘、地块、站在地块上的立体小物件全部走这一套。
// ⚠ 只要有第二处手写斜线, 画面上就会出现两套透视: 任何斜边一律从这里的 isoPt 投影出来。
//
// 两条世界轴(与 OpusRouteBoard 的棋盘同源):
//   推进轴 du: 左下 → 右上   (+0.894, −0.447)
//   通道轴 ds: 左上 → 右下   (+0.894, +0.447)
//   高度   h : 纯屏幕垂直方向, 向上为正(投影里 y 减小) —— 等距投影中高度不参与两条轴的斜率。

export const ADV_X = 0.894;
export const ADV_Y = -0.447;
export const LANE_X = 0.894;
export const LANE_Y = 0.447;

export type P2 = [number, number];

/** 世界坐标 (du, ds, h) → 局部屏幕坐标。原点由调用方决定(地块用顶面中心, 物件用脚底)。 */
export function isoPt(du: number, ds: number, h = 0): P2 {
  return [du * ADV_X + ds * LANE_X, du * ADV_Y + ds * LANE_Y - h];
}

export function poly(points: P2[]): string {
  return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

/** 一个等距长方体在屏幕上只看得见三个面: 顶面 + 朝观者的左右两个侧面。
 *  底面中心在局部原点上方 y0 处, 可再沿两条世界轴平移 (cu, cs);
 *  半尺寸沿两条世界轴给(wu = 推进向, ws = 通道向)。
 *  ⚠ 朝观者的两条底边固定是 W—S 与 S—E(南角屏幕最靠下), 换轴向时这两个面也要跟着换。 */
export function isoBox(wu: number, ws: number, h: number, y0 = 0, cu = 0, cs = 0) {
  const at = (du: number, ds: number, hh: number) => isoPt(cu + du, cs + ds, y0 + hh);
  const N = (hh: number) => at(wu, -ws, hh);
  const E = (hh: number) => at(wu, ws, hh);
  const S = (hh: number) => at(-wu, ws, hh);
  const W = (hh: number) => at(-wu, -ws, hh);
  return {
    top: poly([N(h), E(h), S(h), W(h)]),
    right: poly([S(h), E(h), E(0), S(0)]), // 受光面(朝右下)
    left: poly([W(h), S(h), S(0), W(0)]), // 背光面(朝左下)
    /** 顶面的四个角, 供在盖子/灯具上继续叠零件用 */
    corners: { N: N(h), E: E(h), S: S(h), W: W(h) },
  };
}

/** 世界地平面上的一个**正圆**(半径 r, 离地高 h, 中心可沿两轴平移) → 屏幕上的 2:1 椭圆。
 *  ⚠ 半径按「圆内接于半尺寸 r 的方框的外接圆」算: 圆上最远点落在两轴的对角线上,
 *    所以屏幕半径要乘 √2 —— 直接用 r*(ADV_X+LANE_X) 会把圆画大一圈, 与同尺寸的方盒对不上。 */
export function isoDisc(r: number, h = 0, cu = 0, cs = 0) {
  const [cx, cy] = isoPt(cu, cs, h);
  return { cx, cy, rx: r * Math.SQRT2 * ADV_X, ry: r * Math.SQRT2 * LANE_Y };
}

/** 一块**竖直立起的板**(如警示牌牌面): 沿通道轴展开、朝观者立着。 */
export function isoPanel(ds: number, y0: number, h: number, du = 0): string {
  return poly([isoPt(du, -ds, y0 + h), isoPt(du, ds, y0 + h), isoPt(du, ds, y0), isoPt(du, -ds, y0)]);
}
