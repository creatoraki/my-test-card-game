// 赛博 HUD 外框的轮廓几何。
//
// 形状全部按参考截图逐像素量出来(在 1228×670 的截图里, 线芯盒子是 1179×615):
//   · 四角 45° 大切角, 切边长约 26
//   · 顶边分三段: 两侧高、中间低 26, 之间用 45° 斜边过渡; 中段宽约占整框 45%, 居中
//   · 左右竖线在中部**断开**, 断口占框高约 39%, 断口两端各有一条 15px 的 45° 内折收尾
//   · 底边是一条直线
// 线是一条**发光实线**(白芯 + 粉色外晕), 不是双线 —— 截图里看着像两条, 是白芯把粉色劈开了。
//
// ⚠ 所有台阶/切角/内折都是**固定像素**, 只有直线段随容器伸缩, 所以任意尺寸下比例不会走样。

export type HudFrameSpec = {
  /** 线芯距容器边缘的留白(要给辉光留地方)。 */
  inset: number;
  /** 四角切角的直角边长。 */
  chamfer: number;
  /** 顶边中段相对两侧下沉的深度(也等于 45° 过渡段的水平长度)。 */
  stepDepth: number;
  /** 顶边中段宽度占框宽的比例。 */
  midRatio: number;
  /** 左右竖线断口高度占框高的比例。 */
  breakRatio: number;
  /** 断口两端 45° 内折收尾的长度。 */
  flick: number;
};

export const HUD_FRAME_SPEC: HudFrameSpec = {
  inset: 16,
  chamfer: 26,
  stepDepth: 26,
  midRatio: 0.45,
  breakRatio: 0.39,
  flick: 15,
};

export type HudFramePaths = {
  /** 上半条: 左断口 → 左竖线 → 顶边(带中段台阶) → 右竖线 → 右断口。 */
  upper: string;
  /** 下半条: 左断口 → 左竖线 → 底边 → 右竖线 → 右断口。 */
  lower: string;
  /** 内容区: 忽略断口的闭合轮廓, 给毛玻璃做 clip-path。 */
  fill: string;
};

type Pt = [number, number];

const n = (v: number) => Math.round(v * 100) / 100;
const poly = (pts: Pt[], close = false) =>
  pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${n(x)} ${n(y)}`).join(" ") + (close ? " Z" : "");

/** 按容器尺寸算出这一套轮廓; 尺寸太小时自动把台阶等特征压扁, 保证路径不自交。 */
export function buildHudFrame(
  width: number,
  height: number,
  spec: HudFrameSpec = HUD_FRAME_SPEC,
): HudFramePaths | null {
  if (width <= 0 || height <= 0) return null;

  const left = spec.inset;
  const right = width - spec.inset;
  const top = spec.inset;
  const bottom = height - spec.inset;
  const boxW = right - left;
  const boxH = bottom - top;
  if (boxW <= 0 || boxH <= 0) return null;

  // 小尺寸下给固定特征封顶, 免得斜边越过彼此。
  const cap = Math.min(boxW, boxH) / 4;
  const ch = Math.max(0, Math.min(spec.chamfer, cap));
  const step = Math.max(0, Math.min(spec.stepDepth, cap));
  const flick = Math.max(0, Math.min(spec.flick, cap));

  // 顶边中段: 居中, 两侧留出切角与 45° 过渡的位置。
  const midW = Math.min(boxW * spec.midRatio, Math.max(0, boxW - 2 * (ch + step) - 4));
  const midStart = left + (boxW - midW) / 2;
  const midEnd = midStart + midW;
  const stepTop = top + step;

  // 竖线断口: 垂直居中。
  const gapH = Math.min(boxH * spec.breakRatio, Math.max(0, boxH - 2 * (ch + flick) - 4));
  const gapTop = top + (boxH - gapH) / 2;
  const gapBottom = gapTop + gapH;

  const upper: Pt[] = [
    [left + flick, gapTop],
    [left, gapTop - flick],
    [left, top + ch],
    [left + ch, top],
    [midStart - step, top],
    [midStart, stepTop],
    [midEnd, stepTop],
    [midEnd + step, top],
    [right - ch, top],
    [right, top + ch],
    [right, gapTop - flick],
    [right - flick, gapTop],
  ];

  const lower: Pt[] = [
    [left + flick, gapBottom],
    [left, gapBottom + flick],
    [left, bottom - ch],
    [left + ch, bottom],
    [right - ch, bottom],
    [right, bottom - ch],
    [right, gapBottom + flick],
    [right - flick, gapBottom],
  ];

  // 内容区忽略断口: 直接从左上走到左下。
  const fill: Pt[] = [
    [left, top + ch],
    [left + ch, top],
    [midStart - step, top],
    [midStart, stepTop],
    [midEnd, stepTop],
    [midEnd + step, top],
    [right - ch, top],
    [right, top + ch],
    [right, bottom - ch],
    [right - ch, bottom],
    [left + ch, bottom],
    [left, bottom - ch],
  ];

  return { upper: poly(upper), lower: poly(lower), fill: poly(fill, true) };
}
