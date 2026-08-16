// ★ 区域路线图(等距瓦片) —— opus 版视觉重制 ★
//
// 与 explore/RouteBoard 同一套**投影与数据结构**(2:1 等距, 推进轴朝右上 / 通道轴朝右下,
// 5 通道 × 4 推进段), 区别全在**每一块格子的做法**上。这一版把「一块被轻度染色的菱形砖」
// 换成了一件**完整的物件**, 每块格子由下往上共 8 层:
//   ① 落地投影(椭圆虚影) —— 物件与地面的接触关系
//   ② 地面蚀刻环(仅当前/已访问) —— 从砖底透出的一圈光
//   ③ 台座厚度: 左右两个侧面各自独立渐变(左暗右中), 底棱压一条近黑边
//   ④ 顶面: 沿等距「光照方向」的线性渐变, 而不是一块平色
//   ⑤ 内嵌板: 顶面内缩一圈的凹陷面, 让边框读成一道**实体框**而不是描边
//   ⑥ 中心辉光: 事件色的径向光斑, 图标坐在光里(以前图标是干贴在砖上的)
//   ⑦ 四角铆钉刻线 + 前缘(朝推进方向那条棱)加亮 —— 方向感与工业质感
//   ⑧ 风险斜纹: 只有 risk 节点才有的一组平行警示线, 刻在内嵌板里
// 每块砖的渐变都定义在**自己那颗 <svg> 的 <defs> 里**(id 带唯一后缀):
//   ⚠ 这是必须的 —— CSS 变量在 <defs> 里按 defs 自身的继承链解析, 放到公共 defs 中
//     var(--k) 会取不到调用方那颗按钮上的事件色, 所有砖会变成同一种颜色。
//
// ⛔ 沿用原版的禁闪烁约定: 常驻动效只有匀速位移/呼吸缩放, 明暗一律走 transition 或一次性播完。
// ⚠ 本文件坐标全是「设计 px」, 与 stage.ts 的 1920×1080 同尺度。

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { traceSegment } from "@/explore/route";
import type {
  NodeEvent,
  NodeEventKind,
  RouteBoard as RouteBoardData,
  RouteSegment,
} from "@/explore/types";
import { cx } from "@/ui/common/cx";
import { OpusEventProp } from "./OpusEventProp";
// ⚠ 投影常量与 poly 一律从 opusIso 取: 棋盘、地块、立体物件、棋子必须共享同一套斜率。
import { ADV_X, ADV_Y, LANE_X, LANE_Y, poly } from "./opusIso";
import s from "./OpusRouteBoard.module.css";

// ===================== 版式(设计 px) =====================

const SEG_PITCH = 208; // 相邻两块地板的推进距离 —— 起点 → 段 1 用同一个数, 四段节奏才匀
const ENTRY_RUN = SEG_PITCH;
const LANE_GAP = 132; // 相邻通道中心距

// ⚠ 砖比原版大一档(20 → 27): 这一版每块砖里塞了 8 层零件, 小砖会把内嵌板与铆钉糊成一团。
const TILE_HALF = 27;
// 按钮盒在顶面之下预留的厚度空间 = 台座厚度(TILE_DEPTH) + 一点余量。
// ⚠ 三类台座现在**厚度完全一致**(见 TILE_DEPTH), 所以这里不再需要按最厚那一种取值。
const TILE_D = 14;
// 站在砖上的立体物件的净空 = OpusEventProp 的 viewBox 里脚底以上的高度(60)。
// ⚠ 改那边的 viewBox 必须同步改这里, 否则最远那一排物件会被面板上边界切掉。
const ICON_H = 60;
const ENTRY_U = -104;
const TILE_INSET = 30; // 连线两端缩进量 ⇒ 端帽塞进砖的边缘

const TILE_NUDGE_X = -6;
const TILE_NUDGE_Y = -6;

const TILE_W = 2 * TILE_HALF * (ADV_X + LANE_X); // ≈ 96.6
const TILE_TOP_H = 2 * TILE_HALF * (LANE_Y - ADV_Y); // ≈ 48.3(正好是宽的一半)
const TILE_BOX_H = TILE_TOP_H + TILE_D;

const LANE_COUNT = 5;
const SEG_COUNT = 4;
const ENTRY_LABELS = ["A", "B", "C", "D", "E"];

// 推进动画节奏: 信号点先跑完整段(travelMs), 棋子再以 1/2.6 的速度走同一条线。
const SIGNAL_SPEED = 0.42;
const SIGNAL_MIN_MS = 820;
const SIGNAL_MAX_MS = 2000;
const PAWN_SPEED_DIV = 2.6;
const SEG_TAIL_MS = 280;

export const OPUS_GENERATE_MS = 2100;

// ===================== 坐标换算 =====================
function nodeU(seg: number): number {
  return seg < 0 ? ENTRY_U : ENTRY_U + ENTRY_RUN + seg * SEG_PITCH;
}
const TRACK_LEN = nodeU(SEG_COUNT - 1);
const S_MAX = (LANE_COUNT - 1) * LANE_GAP;

function sx(u: number, sv: number): number {
  return ORIGIN_X + u * ADV_X + sv * LANE_X;
}
function sy(u: number, sv: number): number {
  return ORIGIN_Y + u * ADV_Y + sv * LANE_Y;
}
function laneS(lane: number): number {
  return lane * LANE_GAP;
}

const PAD = 34;
const rawX = (u: number, sv: number) => u * ADV_X + sv * LANE_X;
const rawY = (u: number, sv: number) => u * ADV_Y + sv * LANE_Y;
const U_MIN = ENTRY_U - TILE_HALF;
const S_MIN = -TILE_HALF;
const S_TOP = S_MAX + TILE_HALF;
const X_LO = rawX(U_MIN, S_MIN);
const X_HI = Math.max(rawX(TRACK_LEN, S_MAX), rawX(nodeU(SEG_COUNT - 1) + TILE_HALF, S_TOP));
const Y_LO = Math.min(rawY(nodeU(SEG_COUNT - 1), 0) - ICON_H, rawY(TRACK_LEN, S_MIN));
const Y_HI = rawY(U_MIN, S_TOP) + TILE_D;
const ORIGIN_X = PAD - X_LO;
const ORIGIN_Y = PAD - Y_LO;

export const OPUS_PANEL_W = Math.round(X_HI - X_LO + PAD * 2);
export const OPUS_PANEL_H = Math.round(Y_HI - Y_LO + PAD * 2);

// 桥接在本段内的推进坐标: 段内均分, 首尾各留一格。
function bridgeU(seg: number, row: number, rows: number): number {
  const from = nodeU(seg - 1) + 54;
  const to = nodeU(seg) - 54;
  return from + ((row + 1) * (to - from)) / (rows + 1);
}

export function nodeCenter(seg: number, lane: number): { x: number; y: number } {
  return { x: sx(nodeU(seg), laneS(lane)), y: sy(nodeU(seg), laneS(lane)) };
}
function pt(u: number, lane: number): [number, number] {
  return [sx(u, laneS(lane)), sy(u, laneS(lane))];
}
function pathOf(points: [number, number][]): string {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
}
function lengthOf(points: [number, number][]): number {
  let len = 0;
  for (let i = 1; i < points.length; i++) {
    len += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }
  return len;
}

// ===================== 连线 =====================
// 三层: 近黑轨槽(bed) + 暖铜导线(pipe) + 顶部一线高光(gloss)。
// ⚠ 轨槽必须始终比导线宽, 否则凹槽读成描边; 高光必须比导线细, 否则线变成两根。
function Pipe({ a, b, j = 0 }: { a: [number, number]; b: [number, number]; j?: number }) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const geo = { x1: a[0], y1: a[1], x2: b[0], y2: b[1] };
  return (
    <g style={{ "--len": len.toFixed(1), "--j": j } as CSSProperties}>
      <line className={s["orb-pipe-bed"]} {...geo} />
      <line className={s["orb-pipe"]} {...geo} />
      <line className={s["orb-pipe-gloss"]} {...geo} />
    </g>
  );
}

// ===================== 瓦片几何 =====================
// 局部坐标: 顶面中心落在 (TILE_W/2, TILE_TOP_H/2), 一律经 L() 从世界坐标投影 ——
// ⚠ 不要手写屏幕 px 的斜线, 斜率一旦不是 2:1 就会读成「飘在砖上方的贴纸」。
const L = (du: number, ds: number): [number, number] => [
  TILE_W / 2 + du * ADV_X + ds * LANE_X,
  TILE_TOP_H / 2 + du * ADV_Y + ds * LANE_Y,
];
const corners = (h: number): [number, number][] => [L(h, -h), L(h, h), L(-h, h), L(-h, -h)];

// ★★★ 台座的**造型本身就是信息** ★★★
//   一次实测失败的修正: 只把颜色收干净之后, 20 块格子仍然「都差不多」—— 因为台座是
//   20 个一模一样的底盘, 全部辨识度都压在 40px 高的小物件上。现在**台座按类别分三种造型**,
//   与物件剪影、语义色三条线索互相印证:
//     gain(收益: loot/heal/energy)      = 最厚的**双层圆台**: 完整菱形 + 外扩基座台阶 + 顶面圆环槽
//     util(功能: merchant/route/retreat)= 中等厚的**切角八边形**: 四个尖角削平 + 网格刻线 + 四角铆钉
//     threat(威胁: hazard/battle)       = 最薄的**破损台**: 东角塌掉一块 + 台面裂纹 + 外圈警示带
//   ⇒ 就算把所有颜色抽掉、把物件遮住, 三类格子的**外轮廓**也一眼分得开。
//   ⚠ 新增事件类型时必须在 KIND_SHAPE 里归到某一类, 不要再造第四种台座: 三类是给玩家
//     记的上限, 多了就又变成「都差不多」。
//   ⚠ **厚度不再参与区分**: 全部台座统一削到最薄那一档(原 threat 的 10), 见 TILE_DEPTH。
//     辨识线索因此只剩「外轮廓 + 台面刻线 + 语义色」三条, 改造型时这三条至少要保住两条。
type TileShape = "gain" | "util" | "threat" | "entry";

const KIND_SHAPE: Record<NodeEventKind, TileShape> = {
  loot: "gain",
  heal: "gain",
  energy: "gain",
  merchant: "util",
  route: "util",
  retreat: "util",
  hazard: "threat",
  battle: "threat",
};

// 台座厚度(屏幕垂直方向) —— **所有造型共用同一个数**。
// ⚠ 统一薄台座: 厚砖会让 20 块格子在等距图上互相压住彼此的底棱, 画面读成一堆积木;
//   薄砖之后整张图更像「铺在地上的一片地板」, 站在上面的物件才是视觉主体。
//   立体感因此全部压在「顶面渐变 + 左右两个侧面的明度差 + 底棱压黑」这三笔上, 别再把它调回去。
const TILE_DEPTH = 10;

// 切角八边形(util): 把菱形四个尖角各削掉一段。c = 保留到多远开始切。
const OCT_C = 0.5;
const octagon = (h: number): [number, number][] => [
  L(h * OCT_C, -h),
  L(h, -h * OCT_C),
  L(h, h * OCT_C),
  L(h * OCT_C, h),
  L(-h * OCT_C, h),
  L(-h, h * OCT_C),
  L(-h, -h * OCT_C),
  L(-h * OCT_C, -h),
];
// 破损菱形(threat): 东角(朝右) 塌掉一块, 缺口一直啃进侧面。
const NOTCH = 0.42;
const broken = (h: number): [number, number][] => [
  L(h, -h),
  L(h, h * NOTCH),
  L(h * NOTCH, h * NOTCH),
  L(h * NOTCH, h),
  L(-h, h),
  L(-h, -h),
];

// 各造型的顶面轮廓, 以及把它切成的两条边链:
//   front = **朝观者**的下轮廓(左端 → 最下 → 右端), 台座的厚度就是它下垂形成的;
//   back  = **背对观者**的上轮廓(同样是左端 → 右端), 受光顶棱与前缘边灯沿着它走。
// ⚠ 两条链必须都是完整多边形上真实的边链, 且共用左右两个端点 —— 否则:
//   ① front 写错 ⇒ 台座侧面与顶面错位;
//   ② back 写错(比如偷懒沿用完整菱形的 N/E/W 三个尖角) ⇒ 在**缺角造型**上,
//      那些尖角根本不在轮廓里, 棱线会有一截悬空溢出到砖外面。
function outlineOf(
  shape: TileShape,
  h: number,
): { top: [number, number][]; front: [number, number][]; back: [number, number][] } {
  if (shape === "util") {
    const p = octagon(h);
    // 顺序见 octagon(): p[6]=最左下, p[5]/p[4]=最下两点, p[2]=最右(东南)
    // 北角被削成 p[0]—p[1] 一条短边, 所以 back 要老实地走 p[6]→p[7]→p[0]→p[1]→p[2]
    return { top: p, front: [p[6], p[5], p[4], p[3], p[2]], back: [p[6], p[7], p[0], p[1], p[2]] };
  }
  if (shape === "threat") {
    const p = broken(h);
    // p[4]=南(最下), p[5]=西(最左), 缺口那两点在右下 ⇒ 前轮廓一路啃过缺口;
    // 东角塌掉之后右端点是 p[1](缺口上沿), 不是原来的东角 —— back 必须收在这里。
    return { top: p, front: [p[5], p[4], p[3], p[2], p[1]], back: [p[5], p[0], p[1]] };
  }
  const p = corners(h);
  return { top: p, front: [p[3], p[2], p[1]], back: [p[3], p[0], p[1]] }; // 西 → 南/北 → 东
}

// 前缘 = back 链上「从屏幕最高的那个点到右端」的一段, 即朝推进方向(右上)的那几条边。
// ⚠ 用最高点而不是写死的北角: 缺角造型的北角已经被削掉, 写死就会悬空。
function leadOf(back: [number, number][]): [number, number][] {
  let top = 0;
  for (let i = 1; i < back.length; i++) if (back[i][1] < back[top][1]) top = i;
  return back.slice(top);
}

const dropBy = (p: [number, number], d: number): [number, number] => [p[0], p[1] + d];
// 一条前轮廓链下垂 d 之后围成的侧面多边形。
const sideBand = (chain: [number, number][], d: number): string =>
  poly([...chain, ...[...chain].reverse().map((p) => dropBy(p, d))]);

const INNER = TILE_HALF * 0.66; // 内嵌板

// 四角铆钉刻线: 每个尖角往内一小段的短线, 读作台座的加固件(util 专属)。
const stud = (p: [number, number]): string => {
  const cx0 = TILE_W / 2;
  const cy0 = TILE_TOP_H / 2;
  const at = (t: number): [number, number] => [cx0 + (p[0] - cx0) * t, cy0 + (p[1] - cy0) * t];
  return poly([at(0.76), at(0.92)]);
};

// 风险警示带: 三条平行于通道轴的短线, 刻在**东南外圈**(靠观者那一侧)。
// ⚠ 刻意不放在顶面中央: 那里站着立体物件, 画上去会被整块挡住。
const hazardStripe = (offset: number): string => poly([L(offset, 15), L(offset, 24)]);
// 裂纹(threat): 从缺口往台面里啃进来的两条折线。
const CRACKS = [
  poly([L(11, 11), L(2, 6), L(-6, 9), L(-14, 4)]),
  poly([L(6, 14), L(0, 16), L(-9, 14)]),
];
// 网格刻线(util): 两条平行推进轴 + 两条平行通道轴的细线, 读作检修平台的分格。
const GRID = [
  poly([L(-TILE_HALF * 0.9, -9), L(TILE_HALF * 0.9, -9)]),
  poly([L(-TILE_HALF * 0.9, 9), L(TILE_HALF * 0.9, 9)]),
  poly([L(-9, -TILE_HALF * 0.9), L(-9, TILE_HALF * 0.9)]),
  poly([L(9, -TILE_HALF * 0.9), L(9, TILE_HALF * 0.9)]),
];
// 等距圆(gain 的环槽): 世界坐标里的正圆, 投影后是标准 2:1 椭圆。
const isoCircle = (r: number) => ({ rx: r * (ADV_X + LANE_X), ry: r * (LANE_Y - ADV_Y) });

// 一块格子的全部图形。渐变 id 用 useId 保证同页多块砖互不串色。
function TileArt({ shape }: { shape: TileShape }) {
  const uid = useId().replace(/:/g, "");
  const top = `t${uid}`;
  const sideL = `l${uid}`;
  const sideR = `r${uid}`;
  const glow = `g${uid}`;
  const clip = `c${uid}`;
  const d = TILE_DEPTH;
  const { top: outline, front, back } = outlineOf(shape, TILE_HALF);
  // 侧面沿前轮廓的中点切成左右两半: 左半背光(暗)、右半受光(中) —— 转角靠这一档差立住。
  const mid = Math.floor(front.length / 2);
  const leftChain = front.slice(0, mid + 1);
  const rightChain = front.slice(mid);
  const ring = isoCircle(TILE_HALF * 0.72);
  const ring2 = isoCircle(TILE_HALF * 0.5);
  return (
    <svg
      className={cx(s["orb-tile"], s[`sh-${shape}`])}
      viewBox={`0 0 ${TILE_W} ${TILE_BOX_H}`}
      aria-hidden
    >
      <defs>
        {/* 顶面: 光从左上来 ⇒ 西角最亮、东角最暗。用 objectBoundingBox 的对角线渐变即可。 */}
        <linearGradient id={top} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className={s["orb-g-top-a"]} />
          <stop offset="0.55" className={s["orb-g-top-b"]} />
          <stop offset="1" className={s["orb-g-top-c"]} />
        </linearGradient>
        <linearGradient id={sideL} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className={s["orb-g-side-a"]} />
          <stop offset="1" className={s["orb-g-side-b"]} />
        </linearGradient>
        <linearGradient id={sideR} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className={s["orb-g-sider-a"]} />
          <stop offset="1" className={s["orb-g-side-b"]} />
        </linearGradient>
        <radialGradient id={glow} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" className={s["orb-g-glow-a"]} />
          <stop offset="1" className={s["orb-g-glow-b"]} />
        </radialGradient>
        {/* 顶面轮廓的裁切域: 任何**画在台面上**的椭圆/圆形装饰都要套它 ——
            缺角造型(util 削角 / threat 塌角)的轮廓不是矩形也不是完整菱形,
            不裁就会有一片光漂在缺口外面的空气里。 */}
        <clipPath id={clip}>
          <polygon points={poly(outline)} />
        </clipPath>
      </defs>

      {/* ① 地面蚀刻环: 画在最底层, 台座压在它上面 ⇒ 读作从底下透出来的光。
          ⚠ **只有入口(起点)才有**: 20 块事件砖各自套一圈虚线外框之后, 满图都是断续的虚线,
            等距网格与砖的实体边缘全被它盖住。留给入口是因为那五块要在扫视里第一个被找到。 */}
      {shape === "entry" && (
        <polygon className={s["orb-tile-halo"]} points={poly(outlineOf(shape, TILE_HALF + 9).top)} />
      )}

      {/* ② gain 专属的外扩地台: 台座落在一圈**贴地的**外扩边台上 ⇒ 「双层」这条造型线索还在,
          但它不再有厚度 —— 台座统一削薄之后, 原来那级 6px 的台阶会重新把这一类顶回最厚。 */}
      {shape === "gain" && (
        <polygon
          className={s["orb-tile-base-top"]}
          points={poly(outlineOf("gain", TILE_HALF + 5).top.map((p) => dropBy(p, d)))}
        />
      )}

      {/* ③ 厚度: 前轮廓下垂形成的两个可见侧面 */}
      <polygon className={s["orb-tile-side"]} fill={`url(#${sideL})`} points={sideBand(leftChain, d)} />
      <polygon className={s["orb-tile-side"]} fill={`url(#${sideR})`} points={sideBand(rightChain, d)} />
      {/* 底棱: 台座与地面的交界压一条近黑线, 台座才「落」在地上而不是浮着。 */}
      <polyline className={s["orb-tile-foot"]} points={poly(front.map((p) => dropBy(p, d)))} />

      {/* ④ 顶面 */}
      <polygon className={s["orb-tile-top"]} fill={`url(#${top})`} points={poly(outline)} />

      {/* ⑤ 台面细节 —— 三类各一套, 这是「不靠颜色也分得开」的第二条线索 */}
      {shape === "gain" && (
        <>
          {/* 圆环槽: 物件正好站在环心里, 读作补给平台/充电座 */}
          <ellipse
            className={s["orb-tile-ring"]}
            cx={TILE_W / 2}
            cy={TILE_TOP_H / 2}
            rx={ring.rx}
            ry={ring.ry}
          />
          <ellipse
            className={s["orb-tile-ring-in"]}
            cx={TILE_W / 2}
            cy={TILE_TOP_H / 2}
            rx={ring2.rx}
            ry={ring2.ry}
          />
        </>
      )}
      {(shape === "util" || shape === "entry") && (
        <>
          <polygon
            className={s["orb-tile-inlay"]}
            points={poly(outlineOf(shape, INNER).top)}
          />
          {shape === "util" &&
            GRID.map((g, i) => <polyline key={i} className={s["orb-tile-grid"]} points={g} />)}
          {shape === "util" &&
            octagon(TILE_HALF).map((p, i) => (
              <polyline key={`s${i}`} className={s["orb-tile-stud"]} points={stud(p)} />
            ))}
        </>
      )}
      {shape === "threat" && (
        <>
          {CRACKS.map((c, i) => (
            <polyline key={i} className={s["orb-tile-crack"]} points={c} />
          ))}
          <g className={s["orb-tile-hazard"]}>
            <polyline points={hazardStripe(6)} />
            <polyline points={hazardStripe(0)} />
            <polyline points={hazardStripe(-6)} />
          </g>
        </>
      )}

      {/* ⑥ 中心光池: 常态留一档弱光, 悬停/落点才拉满(见 CSS)。裁到顶面轮廓内。 */}
      <ellipse
        className={s["orb-tile-glow"]}
        cx={TILE_W / 2}
        cy={TILE_TOP_H / 2}
        rx={TILE_HALF * 1.15}
        ry={TILE_HALF * 0.58}
        fill={`url(#${glow})`}
        clipPath={`url(#${clip})`}
      />

      {/* ⑦ 受光顶棱 + 前缘(朝推进方向那几条棱)加亮: 三类共有的方向感。
          ⚠ 两条都沿本造型自己的 back 链走, 缺角造型才不会有悬空的线头。 */}
      <polyline className={s["orb-tile-lead"]} points={poly(leadOf(back))} />
      <polyline className={s["orb-tile-rim"]} points={poly(back)} />

      {shape === "entry" && (
        <>
          {/* 入口独占: 顶面上两枚指向推进方向的人字标 —— 「从这里往右上出发」 */}
          <polyline
            className={s["orb-entry-chevron"]}
            points={poly([L(-4, -11), L(7, 0), L(-4, 11)])}
          />
          <polyline
            className={s["orb-entry-chevron"]}
            points={poly([L(-15, -11), L(-4, 0), L(-15, 11)])}
          />
        </>
      )}
    </svg>
  );
}

// 砖按钮的定位: 盒子 = 顶面包围盒 + 厚度; 站在上面的物件向上溢出。
function tileBox(x: number, y: number): CSSProperties {
  return {
    left: `${x - TILE_W / 2 + TILE_NUDGE_X}px`,
    top: `${y - TILE_TOP_H / 2 + TILE_NUDGE_Y}px`,
    width: `${TILE_W}px`,
    height: `${TILE_BOX_H}px`,
    // 顶面中心距按钮底边的距离(再往下压 2px ⇒ 物件是「踩进」台面而不是浮在上面)。
    // 站在砖上的立体物件与入口字母/光柱都按它对位。
    "--foot": `${(TILE_BOX_H - TILE_TOP_H / 2 - 2).toFixed(1)}px`,
  } as CSSProperties;
}

// ===================== 玩家棋子 =====================
// 实心几何体(事件图标全是线框 ⇒ 一实一虚, 一眼分得清「我」和「这里有什么」)。
// 局部原点在**脚底**, 整个人朝 −y 长出去 ⇒ 定位只需把原点摆到砖的顶面中心。
const PAWN_BW = 12;
const PAWN_TW = 8;
const PAWN_TH = 28;
const PAWN_NECK = 4;
const PAWN_HW = 7.5;
const PAWN_HH = 13;

function diamond(w: number, y: number) {
  return {
    L: [-w, y] as [number, number],
    B: [0, y + w / 2] as [number, number],
    R: [w, y] as [number, number],
  };
}

function Pawn() {
  const t = diamond(PAWN_TW, -PAWN_TH);
  const b = diamond(PAWN_BW, 0);
  const hy0 = -(PAWN_TH + PAWN_NECK);
  const hy1 = hy0 - PAWN_HH;
  return (
    <g className={s["orb-pawn-body"]}>
      {/* 影子不进呼吸组 —— 人起伏时影子跟着飘会立刻穿帮 */}
      <ellipse className={s["orb-pawn-shadow"]} cx={0} cy={0} rx={17} ry={7} />
      <g className={s["orb-pawn-idle"]}>
        <polygon className={s["orb-pawn-dark"]} points={poly([b.L, b.B, t.B, t.L])} />
        <polygon className={s["orb-pawn-mid"]} points={poly([b.B, b.R, t.R, t.B])} />
        <polygon
          className={s["orb-pawn-lit"]}
          points={poly([t.L, t.B, t.R, [0, -PAWN_TH - PAWN_TW / 2]])}
        />
        <polygon
          className={s["orb-pawn-dark"]}
          points={poly([
            [-PAWN_HW, hy0],
            [0, hy0 + PAWN_HW / 2],
            [0, hy1 + PAWN_HW / 2],
            [-PAWN_HW, hy1],
          ])}
        />
        <polygon
          className={s["orb-pawn-mid"]}
          points={poly([
            [0, hy0 + PAWN_HW / 2],
            [PAWN_HW, hy0],
            [PAWN_HW, hy1],
            [0, hy1 + PAWN_HW / 2],
          ])}
        />
        <polygon
          className={s["orb-pawn-lit"]}
          points={poly([
            [-PAWN_HW, hy1],
            [0, hy1 + PAWN_HW / 2],
            [PAWN_HW, hy1],
            [0, hy1 - PAWN_HW / 2],
          ])}
        />
      </g>
    </g>
  );
}

// 段内折线 → 屏幕折线: 顺主线走到岔口, 拐上桥线落到隔壁通道。
function segmentPoints(
  segment: RouteSegment,
  laneIn: number,
  rows: number,
  segIndex: number,
): [number, number][] {
  const startU = segIndex === 0 ? nodeU(-1) : nodeU(segIndex - 1);
  const pts: [number, number][] = [pt(startU, laneIn)];
  const { steps } = traceSegment(segment, laneIn, rows);
  for (const st of steps) {
    if (st.movedFrom == null) continue;
    const u = bridgeU(segIndex, st.row, rows);
    pts.push(pt(u, st.movedFrom));
    pts.push(pt(u, st.lane));
  }
  pts.push(pt(nodeU(segIndex), steps[steps.length - 1].lane));
  return pts;
}

// ===================== 悬浮详情卡 =====================
// ⚠ 不用原生 title 属性(项目约定): 悬停详情一律由组件渲染。
function NodeCard({ ev, x, y, seg }: { ev: NodeEvent; x: number; y: number; seg: number }) {
  const sign = ev.energyDelta > 0 ? "+" : "";
  return (
    <div
      className={cx(s["orb-card"], s[`k-${ev.kind}`])}
      style={{ left: `${x}px`, top: `${y - ICON_H - TILE_TOP_H / 2 - 14}px` }}
      role="status"
    >
      <span className={s["orb-card-seg"]}>第 {seg + 1} 推进段</span>
      <strong className={s["orb-card-title"]}>{ev.title}</strong>
      <p className={s["orb-card-desc"]}>{ev.description}</p>
      <span className={s["orb-card-energy"]}>
        净化粒子 {sign}
        {ev.energyDelta}
      </span>
      {ev.risk && (
        <span className={s["orb-card-risk"]}>
          {ev.risk === "highRisk" ? "高风险" : "纯负面"}
        </span>
      )}
    </div>
  );
}

interface Props {
  board: RouteBoardData;
  /** 桥接是否显形。预览页由控制条驱动; 产线上对应 revealing / disclosure 两相。 */
  showBridges: boolean;
  /** 生成演出(逐条浮现)是否正在播 —— 播放期间锁交互。 */
  generating: boolean;
}

export function OpusRouteBoard({ board, showBridges, generating }: Props) {
  const rows = board.rowsPerSegment;
  const [hoverLane, setHoverLane] = useState<number | null>(null);
  const [hoverNode, setHoverNode] = useState<{ seg: number; lane: number } | null>(null);
  const [entryLane, setEntryLane] = useState<number | null>(null);
  // 已抵达的推进段数(0-4)。walking = 正在播第 `progress` 段的推进。
  const [progress, setProgress] = useState(0);
  const [walking, setWalking] = useState(false);

  // 换一张图 ⇒ 推进状态全清(组件在预览页是靠 key 重挂的, 这条是兜底)。
  useEffect(() => {
    setEntryLane(null);
    setProgress(0);
    setWalking(false);
    setHoverNode(null);
  }, [board]);

  // 每段的入通道序列: lanes[i] = 走第 i 段时所在的入通道; lanes[4] = 终点通道。
  const lanes = useMemo(() => {
    if (entryLane == null) return [];
    const out = [entryLane];
    let lane = entryLane;
    for (let i = 0; i < SEG_COUNT; i++) {
      lane = traceSegment(board.segments[i], lane, rows).laneOut;
      out.push(lane);
    }
    return out;
  }, [board, entryLane, rows]);

  // 正在推进的这一段
  const legPoints = useMemo<[number, number][]>(() => {
    if (!walking || entryLane == null || progress >= SEG_COUNT) return [];
    return segmentPoints(board.segments[progress], lanes[progress], rows, progress);
  }, [walking, board, entryLane, lanes, progress, rows]);

  // 已经走完的那些段
  const donePoints = useMemo<[number, number][]>(() => {
    if (entryLane == null || progress === 0) return [];
    const out: [number, number][] = [];
    for (let i = 0; i < progress; i++) {
      const pts = segmentPoints(board.segments[i], lanes[i], rows, i);
      out.push(...(i === 0 ? pts : pts.slice(1)));
    }
    return out;
  }, [board, entryLane, lanes, progress, rows]);

  const legPath = useMemo(() => pathOf(legPoints), [legPoints]);
  const legLen = useMemo(() => lengthOf(legPoints), [legPoints]);
  const travelMs = Math.min(SIGNAL_MAX_MS, Math.max(SIGNAL_MIN_MS, legLen / SIGNAL_SPEED));
  const pawnDoneMs = travelMs + travelMs * PAWN_SPEED_DIV;

  // 过桥完成的时刻 —— 在那里留一圈扩散环
  const ripples = useMemo(() => {
    const out: { x: number; y: number; t: number }[] = [];
    if (legPoints.length < 2 || legLen <= 0) return out;
    let cum = 0;
    for (let i = 1; i < legPoints.length; i++) {
      const [px, py] = legPoints[i - 1];
      const [x, y] = legPoints[i];
      cum += Math.hypot(x - px, y - py);
      if (py !== y || i === legPoints.length - 1) out.push({ x, y, t: (cum / legLen) * travelMs });
    }
    return out;
  }, [legPoints, legLen, travelMs]);

  // 一段播完 → 落位, 若还有剩余段则接着播下一段。
  useEffect(() => {
    if (!walking || legPoints.length < 2) return;
    const id = window.setTimeout(() => {
      const next = progress + 1;
      setProgress(next);
      if (next >= SEG_COUNT) setWalking(false);
    }, pawnDoneMs + SEG_TAIL_MS);
    return () => window.clearTimeout(id);
  }, [walking, progress, legPath, legPoints.length, pawnDoneMs]);

  // ⚠ animateMotion 必须显式 beginElement(begin="indefinite"):
  //   begin="0s" 是相对 SVG 时间容器启动算的, 第二段之后会直接跳到终态(人凭空瞬移)。
  const motionRef = useRef<SVGElement | null>(null);
  useEffect(() => {
    if (!walking || legPoints.length < 2) return;
    (motionRef.current as SVGAnimationElement | null)?.beginElement();
  }, [walking, legPath, legPoints.length]);

  // 棋子静止站位: 没落过地就站在起点砖上, 否则站在最近一次的落点砖上。
  const pawnAt = useMemo(() => {
    if (entryLane == null) return null;
    if (progress === 0) return nodeCenter(-1, entryLane);
    return nodeCenter(progress - 1, lanes[progress]);
  }, [entryLane, lanes, progress]);

  // ★ 画家算法: 屏幕上越靠下的格子越「近」, 必须后画。
  //   屏幕 y ∝ (s − u), 所以深度键就是 laneS(lane) − nodeU(seg), 升序 = 由远及近。
  //   ⚠ 地块上站着近 60px 高的立体物件之后, 相邻格子在屏幕上真的会重叠 —— 少了这一步,
  //     远处那件物件会压在近处那件前面, 整张等距图的前后关系当场崩掉。
  const sortedNodes = useMemo(() => {
    const out = board.nodes.flatMap((row, seg) => row.map((ev, lane) => ({ ev, seg, lane })));
    return out.sort((a, b) => laneS(a.lane) - nodeU(a.seg) - (laneS(b.lane) - nodeU(b.seg)));
  }, [board]);

  const activeLane = entryLane == null ? null : lanes[Math.min(progress, SEG_COUNT)];
  const interactive = !generating && !walking;
  const hoverEv = hoverNode ? board.nodes[hoverNode.seg][hoverNode.lane] : null;
  const hoverPos = hoverNode ? nodeCenter(hoverNode.seg, hoverNode.lane) : null;

  return (
    <div
      className={cx(s["orb-root"], generating && s["is-generating"])}
      style={{ width: `${OPUS_PANEL_W}px`, height: `${OPUS_PANEL_H}px` }}
    >
      {/* 地面: 等距网格 + 中央的一圈冷光晕, 让棋盘有「站在一块场地上」的底 */}
      <div className={s["orb-ground"]} aria-hidden />
      {generating && (
        <span className={s["orb-scan-clip"]} aria-hidden>
          <span className={s["orb-scan"]} />
        </span>
      )}

      {/* ── 场地: 主线 / 桥线 / 电流 ── */}
      <svg
        className={s["orb-svg"]}
        viewBox={`0 0 ${OPUS_PANEL_W} ${OPUS_PANEL_H}`}
        style={{ height: `${OPUS_PANEL_H}px` }}
        aria-hidden
      >
        {/* 主线: 由远及近(通道 0 → 4)绘制 = 等距场景的画家算法 */}
        {Array.from({ length: board.laneCount }, (_, lane) => {
          const live = hoverLane === lane;
          const dim = activeLane != null && lane !== activeLane;
          const runs: [number, number][] = [];
          for (let seg = 0; seg < SEG_COUNT; seg++) {
            runs.push([nodeU(seg - 1) + TILE_INSET, nodeU(seg) - TILE_INSET]);
          }
          return (
            <g
              key={lane}
              className={cx(s["orb-lane"], live && s["is-live"], dim && s["is-dim"])}
              style={{ "--i": lane } as CSSProperties}
            >
              {runs.map(([u0, u1], i) => (
                <Pipe key={i} a={pt(u0, lane)} b={pt(u1, lane)} j={i} />
              ))}
            </g>
          );
        })}

        {/* 桥线: 与主线完全同款(区分靠朝向相反 + 身上没有砖 + 平时不在画面上)。
            ⚠ 任何阶段都留在 DOM 里, 只改 opacity —— 卸载会让「记不住就没了」被 DevTools 绕过。 */}
        <g className={cx(s["orb-bridges"], !showBridges && s["is-hidden"])}>
          {board.segments.flatMap((seg) =>
            seg.bridges.map((b) => (
              <g key={`${seg.index}-${b.row}-${b.leftLane}`} className={s["orb-bridge"]}>
                <Pipe
                  a={pt(bridgeU(seg.index, b.row, rows), b.leftLane)}
                  b={pt(bridgeU(seg.index, b.row, rows), b.leftLane + 1)}
                />
              </g>
            )),
          )}
        </g>

        {donePoints.length > 1 && (
          <path className={s["orb-trace-done"]} d={pathOf(donePoints)} />
        )}

        {walking && legPoints.length > 1 && (
          <g key={`${board.round}-${progress}`}>
            <path
              className={s["orb-trace-line"]}
              d={legPath}
              style={{ "--len": legLen, animationDuration: `${travelMs}ms` } as CSSProperties}
            />
            <path
              className={s["orb-trace-comet"]}
              d={legPath}
              style={
                {
                  "--len": legLen,
                  strokeDasharray: `150 ${legLen}`,
                  animationDuration: `${travelMs}ms`,
                } as CSSProperties
              }
            />
            {ripples.map((r, i) => (
              <circle
                key={i}
                className={s["orb-ripple"]}
                cx={r.x}
                cy={r.y}
                r={5}
                style={{ animationDelay: `${Math.round(r.t)}ms` } as CSSProperties}
              />
            ))}
            <circle className={s["orb-signal"]} r={9}>
              <animateMotion dur={`${travelMs}ms`} path={legPath} fill="freeze" calcMode="linear" />
            </circle>
          </g>
        )}
      </svg>

      {/* ── 入口 A-E ── */}
      <div className={s["orb-entries"]}>
        {Array.from({ length: board.laneCount }, (_, lane) => {
          const blocked = board.blockedLanes.includes(lane);
          const active = entryLane === lane;
          const usable = interactive && entryLane == null && !blocked;
          const c = nodeCenter(-1, lane);
          return (
            <button
              key={lane}
              type="button"
              className={cx(s["orb-entry"], active && s["is-active"], blocked && s["is-blocked"])}
              style={{ ...tileBox(c.x, c.y), "--i": lane } as CSSProperties}
              disabled={!usable}
              onPointerEnter={() => usable && setHoverLane(lane)}
              onPointerLeave={() => setHoverLane((l) => (l === lane ? null : l))}
              onFocus={() => usable && setHoverLane(lane)}
              onBlur={() => setHoverLane((l) => (l === lane ? null : l))}
              onClick={() => {
                setEntryLane(lane);
                setHoverLane(null);
                setWalking(true);
              }}
            >
              <TileArt shape="entry" />
              <span className={s["orb-tile-shadow"]} aria-hidden />
              <span className={s["orb-entry-beam"]} aria-hidden />
              <span className={s["orb-entry-letter"]}>{ENTRY_LABELS[lane] ?? lane + 1}</span>
            </button>
          );
        })}
      </div>

      {/* ── 20 个事件节点 ──
          ⚠ **必须按等距深度排序渲染**(见 sortedNodes): 地块上站着近 60px 高的立体物件之后,
            相邻两格在屏幕上是真的重叠的, 按 seg→lane 的自然顺序画会让远处那件压在近处那件前面。 */}
      <div className={cx(s["orb-nodes"], !interactive && s["is-inert"])}>
        {sortedNodes.map(({ ev, seg, lane }) => {
          const { x, y } = nodeCenter(seg, lane);
          const landed = entryLane != null && lanes[seg + 1] === lane && seg < progress;
          const isCurrent = landed && seg === progress - 1;
          const settled = landed && seg < progress - 1;
          const hovered = hoverNode?.seg === seg && hoverNode?.lane === lane;
          return (
              <button
                key={`${seg}-${lane}-${ev.id}`}
                type="button"
                className={cx(
                  s["orb-node"],
                  s[`k-${ev.kind}`],
                  isCurrent && s["is-current"],
                  settled && s["is-settled"],
                  hovered && s["is-hovered"],
                  ev.risk && s[`r-${ev.risk}`],
                )}
                style={
                  {
                    ...tileBox(x, y),
                    "--i": seg * 5 + lane,
                    "--seg": seg,
                    "--lane": lane,
                  } as CSSProperties
                }
                tabIndex={interactive ? 0 : -1}
                disabled={!interactive}
                onPointerEnter={() => setHoverNode({ seg, lane })}
                onPointerLeave={() => setHoverNode(null)}
                onFocus={() => setHoverNode({ seg, lane })}
                onBlur={() => setHoverNode(null)}
              >
                <TileArt shape={KIND_SHAPE[ev.kind]} />
                <span className={s["orb-tile-shadow"]} aria-hidden />
                <span className={s["orb-node-prop"]}>
                  <OpusEventProp kind={ev.kind} />
                </span>
              </button>
          );
        })}
      </div>

      {/* ── 玩家棋子(单独一层, 压在砖层之上) ── */}
      {entryLane != null && (
        <svg
          className={s["orb-pawn-layer"]}
          viewBox={`0 0 ${OPUS_PANEL_W} ${OPUS_PANEL_H}`}
          style={{
            height: `${OPUS_PANEL_H}px`,
            transform: `translate(${TILE_NUDGE_X}px, ${TILE_NUDGE_Y}px)`,
          }}
          aria-hidden
        >
          {walking && legPoints.length > 1 ? (
            <g
              key={`${board.round}-${progress}-walk`}
              className={cx(s["orb-pawn"], s["is-walking"])}
            >
              <Pawn />
              {/* 等信号点跑完再起步只能用 keyPoints 做, 不能用 begin 延迟 ——
                  未开始的 animateMotion 会把元素按在自己的原点(面板左上角)上。 */}
              <animateMotion
                ref={motionRef}
                begin="indefinite"
                dur={`${Math.round(pawnDoneMs)}ms`}
                path={legPath}
                keyPoints="0;0;1"
                keyTimes={`0;${(travelMs / pawnDoneMs).toFixed(4)};1`}
                fill="freeze"
                calcMode="linear"
              />
            </g>
          ) : (
            pawnAt && (
              <g
                className={s["orb-pawn"]}
                style={{ transform: `translate(${pawnAt.x}px, ${pawnAt.y}px)` }}
              >
                <Pawn />
              </g>
            )
          )}
        </svg>
      )}

      {hoverNode && hoverEv && hoverPos && (
        <NodeCard ev={hoverEv} x={hoverPos.x} y={hoverPos.y} seg={hoverNode.seg} />
      )}
    </div>
  );
}
