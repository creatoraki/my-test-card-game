// ★ 落点事件面板的形状真相 ★
//
// 这里是事件面板形状的唯一来源 —— clip-path 的多边形与开场动画的中缝态全部由同一份顶点表生成。
//
// 当前造型: 规则矩形。四条边的凹凸节奏表(EDGES)全为空, buildOutline 于是只吐出四个角点。
// 保留这套参数化机制而不是写死矩形, 是为了以后想再给某条边加造型时只需往 EDGES 里填一段 Notch,
// clip-path / SVG 描边 / 开场动画会一起跟上, 不用三处各改一遍。
//
// ⚠ 开场/关闭动画是在 clip-path 上做插值的(见 explorePanel.module.css 的 panelRevealIn/Out),
//   CSS 只在**顶点数一致**时才会平滑插值。所以中缝态不是另画一个形状, 而是把完整态的每个
//   顶点投影到中缝上 —— 点数天然相同, 展开动画就是这些顶点从中缝长开。

/** 内容区尺寸 —— 与 explorePanel.module.css 的 panel-box(936×680) 一致, 换浮层不跳框。 */
export const CONTENT = { w: 936, h: 680 } as const;

/** 面板四周的固定留白(元素比内容区四周各大这么多)—— 给最外圈那道描边留出呼吸位。 */
export const BUMP = 18;

/** 元素(border-box)尺寸 —— 内容区 + 四周的固定留白。 */
export const OUTER = { w: CONTENT.w + BUMP * 2, h: CONTENT.h + BUMP * 2 } as const;

export interface Point { x: number; y: number }

/** 一段凹凸: 沿该边行进方向, 从 at 处起长 len, 深 depth; out = 凸出框外, in = 凹进框内。 */
interface Notch {
  at: number;
  len: number;
  depth: number;
  dir: "out" | "in";
}

/* 四边节奏表。顺时针: 上(左→右) / 右(上→下) / 下(右→左) / 左(下→上)。
   ★ 四条边的凹陷造型已确认为不需要的视觉, 整表清空 —— 外轮廓即规则矩形。
   ★ 想重新加造型: 往对应边的数组里填 Notch 即可, 其余全是推导, 不需要动别处。 */
const EDGES: Record<"top" | "right" | "bottom" | "left", Notch[]> = {
  top: [],
  right: [],
  bottom: [],
  left: [],
};

/**
 * 生成轮廓顶点(顺时针, 全部直角、轴对齐)。
 * inset > 0 时返回整条轮廓向内平移 inset 后的"回声"轮廓:
 * 凹陷会变宽变浅、外凸会变短变浅 —— 这才是真正的等距内缩, 不是简单缩小矩形。
 */
export function buildOutline(inset = 0): Point[] {
  const left = BUMP + inset;
  const top = BUMP + inset;
  const right = BUMP + CONTENT.w - inset;
  const bottom = BUMP + CONTENT.h - inset;

  const points: Point[] = [];
  const push = (x: number, y: number) => points.push({ x, y });

  // 每条边: 起点 + 行进方向 + 朝外法线。段落按行进方向依次展开。
  const edges: { from: Point; dir: Point; normal: Point; span: number; notches: Notch[] }[] = [
    { from: { x: left, y: top }, dir: { x: 1, y: 0 }, normal: { x: 0, y: -1 }, span: right - left, notches: EDGES.top },
    { from: { x: right, y: top }, dir: { x: 0, y: 1 }, normal: { x: 1, y: 0 }, span: bottom - top, notches: EDGES.right },
    { from: { x: right, y: bottom }, dir: { x: -1, y: 0 }, normal: { x: 0, y: 1 }, span: right - left, notches: EDGES.bottom },
    { from: { x: left, y: bottom }, dir: { x: 0, y: -1 }, normal: { x: -1, y: 0 }, span: bottom - top, notches: EDGES.left },
  ];

  for (const edge of edges) {
    push(edge.from.x, edge.from.y);
    for (const notch of edge.notches) {
      const sign = notch.dir === "out" ? 1 : -1;
      // 内缩时: 凸块两端各收 inset、凹口两端各放 inset, 深度一律减 inset。
      const grow = notch.dir === "out" ? -inset : inset;
      const depth = Math.max(0, notch.depth - inset);
      let start = notch.at - grow;
      let end = notch.at + notch.len + grow;
      if (end < start) start = end = (start + end) / 2;
      start = Math.min(Math.max(start, 0), edge.span);
      end = Math.min(Math.max(end, 0), edge.span);
      const at = (distance: number, lift: number) => push(
        edge.from.x + edge.dir.x * distance + edge.normal.x * lift * sign,
        edge.from.y + edge.dir.y * distance + edge.normal.y * lift * sign,
      );
      at(start, 0);
      at(start, depth);
      at(end, depth);
      at(end, 0);
    }
  }
  return points;
}

/** 顶点 → clip-path polygon() 的参数串(不含 polygon 本身, 便于塞进 CSS 变量)。 */
export function toPolygon(points: Point[]): string {
  return points.map((point) => `${round(point.x)}px ${round(point.y)}px`).join(", ");
}

/**
 * 把顶点压到画面中缝上, 用于开场/关闭动画的中间态与种子态。
 * line = 铺满整宽的一条缝; seed = 中间一小截光点。两者都与完整态同点数。
 */
export function projectToSlit(points: Point[], mode: "line" | "seed"): Point[] {
  const cx = OUTER.w / 2;
  const cy = OUTER.h / 2;
  const squeeze = mode === "seed" ? 0.08 : 1;
  return points.map((point) => ({
    x: cx + (point.x - cx) * squeeze,
    y: point.y <= cy ? cy - 2 : cy + 2,
  }));
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
