// 1920×1080 设计画布。左右宽度约 1 : 2.6，保留常驻顶栏和底部导航空间。
// 立绘窗按立绘本身的 9:16 宽度(≈434px)收到接近贴边，让出的 114px 全部并入右侧工作区，
// 两窗之间仍保持 28px 的缝。
// 飞行层、换装候选和卡面预览共用立绘矩形，避免布局与过场落点分离。
export const FIGURE_RECT = { x: 76, y: 196, w: 480, h: 772 };
export const WORKBENCH_RECT = { x: 584, y: 196, w: 1248, h: 772 };
export const FIGURE_ART_WIDTH = FIGURE_RECT.h * 9 / 16;
