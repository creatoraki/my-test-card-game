// 三选一底栏两枚按钮的轮廓与装饰几何(按钮自身坐标, 原点 = 按钮左上角)。尺寸与 pickGeometry 的
// SKIP_BUTTON / CONFIRM_BUTTON 同步; 全部按设计稿逐角量取。
import { CONFIRM_BUTTON, SKIP_BUTTON, insetPolygon, type Point } from "./pickGeometry";

export interface ButtonShape {
  /** 按钮面轮廓(顺时针), 同时用作底色层的 clip-path。 */
  outline: readonly Point[];
  /** 内亮线。 */
  inner: readonly Point[];
  /** 外侧托槽细框(只有主按钮有)。 */
  bay?: readonly Point[];
  /** 贴在边上的亮色厚条 / 凸台(折线)。 */
  ridges: readonly (readonly Point[])[];
  /** 面内实心小色块。 */
  plates: readonly (readonly Point[])[];
  /** 面内斜向刻纹(两点线段)。 */
  stripes: readonly (readonly Point[])[];
}

const { w: sw, h: sh } = SKIP_BUTTON;
// 放弃: 左上小切角 28、右下大切角 37, 右上额外一块凸起亮板。
const SKIP_OUTLINE: Point[] = [[28, 0], [sw, 0], [sw, sh - 37], [sw - 37, sh], [0, sh], [0, 28]];

export const SKIP_SHAPE: ButtonShape = {
  outline: SKIP_OUTLINE,
  inner: insetPolygon(SKIP_OUTLINE, 6),
  ridges: [[[150, -6], [sw - 4, -6], [sw + 6, 4], [sw + 6, 40]]],
  plates: [
    [[214, 1.5], [sw - 1.5, 1.5], [sw - 1.5, 5.5], [218, 5.5]],
    [[8, 64], [30, 64], [40, sh - 8], [8, sh - 8]],
    // 右上凸台的板体(凸台亮线之下、按钮顶边之上)
    [[150, -6], [sw - 4, -6], [sw + 6, 4], [sw + 6, 40], [sw, 40], [sw, 0], [156, 0]],
  ],
  stripes: [
    [[214, 74], [234, 54]],
    [[226, 74], [246, 54]],
  ],
};

const { w: cw, h: ch } = CONFIRM_BUTTON;
// 确认: 四角都切(左上 25 / 右上 9 / 右下 33 / 左下 9), 外套一圈托槽细框。
const CONFIRM_OUTLINE: Point[] = [
  [25, 0], [cw - 9, 0], [cw, 9], [cw, ch - 33], [cw - 33, ch], [9, ch], [0, ch - 9], [0, 25],
];

export const CONFIRM_SHAPE: ButtonShape = {
  outline: CONFIRM_OUTLINE,
  inner: insetPolygon(CONFIRM_OUTLINE, 4),
  bay: [[-6, 22], [25, -9], [cw + 1, -9], [cw + 9, -1], [cw + 9, ch - 26], [cw - 26, ch + 9], [8, ch + 9], [-6, ch - 5]],
  ridges: [],
  plates: [],
  stripes: [
    [[240, 60], [275, 25]],
    [[250, 70], [290, 30]],
  ],
};
