// qwen 等距(2:1)投影共享工具 —— 棋盘、连线、地砖共用同一套斜率。
// ⚠ 只要出现第二处手写斜线, 画面上就会有两套透视: 任何斜边一律从这里投影出来。
//
// 两条世界轴(与 opus/ds 两版同源, 保证四套方案能直接对比):
//   推进轴 du: 左下 → 右上   (+0.894, −0.447)
//   通道轴 ds: 左上 → 右下   (+0.894, +0.447)
//   高度   h : 纯屏幕垂直方向, 向上为正(投影里 y 减小)。
//
// ★ 本版与 opus/ds 的根本差别: 地砖不是 SVG 画出来的台座, 而是一个**方形 DOM 盒子**
//   被同一个线性变换压平成菱形 —— 等距投影本身就是线性变换, 所以「把 EventPanel 的
//   插画占位区平放到地上」这件事, 用一条 CSS matrix 就是精确的, 不需要重画任何美工。

export const ADV_X = 0.894;
export const ADV_Y = -0.447;
export const LANE_X = 0.894;
export const LANE_Y = 0.447;

export type P2 = [number, number];

/** 世界坐标 (du, ds, h) → 局部屏幕坐标。原点由调用方决定(地砖用砖面中心)。 */
export function isoPt(du: number, ds: number, h = 0): P2 {
  return [du * ADV_X + ds * LANE_X, du * ADV_Y + ds * LANE_Y - h];
}

export function poly(points: P2[]): string {
  return points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
}

/** 把一个正方形砖面压平成等距菱形的 CSS 变换。
 *  局部 x 轴 ⇒ 推进轴(砖面上的文字沿路面朝右上跑), 局部 y 轴 ⇒ 通道轴。
 *  ⚠ 与尺寸无关: 只要配 `transform-origin: 50% 50%`, 任意边长的方盒都会绕自己的中心压平,
 *    所以砖的大小改了也不用回来动这里。CSS 里一律用 var(--tile-matrix), 不要手抄这四个数。 */
export const TILE_MATRIX = `matrix(${ADV_X}, ${ADV_Y}, ${LANE_X}, ${LANE_Y}, 0, 0)`;

/** 把一个正方形盒子**立起来**、贴着地砖的通道轴站在地面上的 CSS 变换(直立投影屏用)。
 *  局部 x 轴 ⇒ 通道轴(与地砖朝向观者那条棱平行), 局部 y 轴 ⇒ 屏幕垂直方向(= 高度轴)。
 *  ⇒ 屏面法线正是 −推进轴: 玩家沿推进轴走过来, 屏正对着他。
 *  ★ 与 TILE_MATRIX 配套: 两条变换共用同一套斜率, 所以屏与砖在等距投影里严格垂直。
 *  ⚠ 必须配 `transform-origin: 50% 100%`(底边中点): 屏是「站」在砖中心上的, 绕底边中点剪切,
 *    底边才会精确落在地面那条通道轴线上(右端沉、左端抬, 这正是正交投影下的正确读数)。 */
export const PANEL_MATRIX = `matrix(${LANE_X}, ${LANE_Y}, 0, 1, 0, 0)`;

/** 边长 size 的方形砖面压平后的屏幕包围盒(宽 ≈ 1.788·size, 高 ≈ 0.894·size)。 */
export function tileBounds(size: number): { w: number; h: number } {
  return { w: size * (ADV_X + LANE_X), h: size * (LANE_Y - ADV_Y) };
}
