// 1920×1080 设计画布。左右宽度约 1 : 1.91，保留常驻顶栏和底部导航空间。
// 飞行层、换装候选和卡面预览共用立绘矩形，避免布局与过场落点分离。
export const FIGURE_RECT = { x: 76, y: 196, w: 594, h: 772 };
export const WORKBENCH_RECT = { x: 698, y: 196, w: 1134, h: 772 };
export const FIGURE_ART_WIDTH = FIGURE_RECT.h * 9 / 16;
