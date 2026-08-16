// ds 等距(2:1)投影共享工具 —— 棋盘与格子共用同一套斜率。
// ⚠ 只要出现第二处手写斜线, 画面上就会有两套透视: 任何斜边一律从 isoPt 投影出来。
//
// 两条世界轴(与棋盘的推进/通道方向同源):
//   推进轴 du: 左下 → 右上   (+0.894, −0.447)
//   通道轴 ds: 左上 → 右下   (+0.894, +0.447)
//   高度   h : 纯屏幕垂直方向, 向上为正(投影里 y 减小)。

export const ADV_X = 0.894;
export const ADV_Y = -0.447;
export const LANE_X = 0.894;
export const LANE_Y = 0.447;

export type P2 = [number, number];

/** 世界坐标 (du, ds, h) → 局部屏幕坐标。原点由调用方决定(地块用顶面中心)。 */
export function isoPt(du: number, ds: number, h = 0): P2 {
  return [du * ADV_X + ds * LANE_X, du * ADV_Y + ds * LANE_Y - h];
}

export function poly(points: P2[]): string {
  return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}
