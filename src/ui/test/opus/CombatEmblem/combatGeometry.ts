// 战斗三态 BUFF 图标(锋利 / 护盾 / 心眼)的几何层 —— 纯数据 / 纯函数, 不含 React, 不含样式。
//
// ★ 外框规格不在这里重造: EDGE / OUTER / INNER 三圈框、极坐标、镜像变换全部从厚涂版培育图标
//   的几何层复用。三枚新图标要和已有的两枚**同规格**才能互换槽位, 规格靠共享同一份代码保证。
// ★ 这一层只放三枚图标各自独有的形。厚涂的立体感 = 同一个形上叠「底色 / 暗面 / 亮边」三层,
//   所以每个主体形往往配一条只走半边的高光路径与一块闭合的暗面 —— 这类"半边路径"是本层的主要产出。
// ⚠ 坐标一律在 128×128 画布内, 且必须落在 INNER_FRAME(9~119, 圆角 17)以内:
//   图标要压在暗场景图上, 一旦有形溢出内沿, 它就没有边界了。

import { CENTER, polarPoint } from "../CultivationEmblem/emblemGeometry";

export {
  CENTER,
  EMBLEM_VIEWBOX,
  EDGE_FRAME,
  OUTER_FRAME,
  INNER_FRAME,
  MIRROR_X,
  insetFrame,
  polarPoint,
  type FrameRect,
} from "../CultivationEmblem/emblemGeometry";

// ── 锋利: 竖向锐三角 ──────────────────────────────────────────────
//
// ★ 剪影是**一条向上收尖的窄长刃**: 三枚图标里只有它是"高瘦"的, 20px 下先读到长宽比,
//   再读到细节。刃身刻意不给护手不给柄 —— 柄会把剪影下半段撑宽, 锐利感当场消失。
// ★ 光源统一在右上(与培育图标一致): 右刃口一道近白亮边, 左半整块压暗, 中脊一条血槽把
//   两个受光面分开。厚涂的三档就在这三笔里。

/** 刃身: 尖端在上, 腰部微鼓, 底端收成一个下尖 —— 上下都是尖, 才不像一把菜刀。 */
export const BLADE_PATH =
  `M${CENTER} 26` +
  `C${CENTER + 5.5} 44 ${CENTER + 10.5} 61 ${CENTER + 13} 77` +
  `L${CENTER} 86` +
  `L${CENTER - 13} 77` +
  `C${CENTER - 10.5} 61 ${CENTER - 5.5} 44 ${CENTER} 26Z`;

/** 右刃口的受光亮边: 只描朝光的那半条边, 整圈描边会退回线稿。 */
export const BLADE_EDGE_PATH =
  `M${CENTER} 26C${CENTER + 5.5} 44 ${CENTER + 10.5} 61 ${CENTER + 13} 77`;

/** 左半暗面: 一块闭合形压在背光侧, 把刃"折"成两个面。 */
export const BLADE_SHADE_PATH =
  `M${CENTER} 26C${CENTER - 5.5} 44 ${CENTER - 10.5} 61 ${CENTER - 13} 77L${CENTER} 86Z`;

/** 血槽: 沿刃身中轴的一道细线, 顺带把中轴钉死在画布中线上。 */
export const BLADE_FULLER_PATH = `M${CENTER} 34V79`;

/** 磨刀台: 悬空的一方梯形暗剪影, 不贴框底 —— 贴底就没有下留白, 图标像被框切了一刀。 */
export const WHETSTONE_PATH = `M42 91H86L80 101H48Z`;

/** 台面亮边: 被刃光反照的一道冷线, 也是画面下半段唯一的细节。 */
export const WHETSTONE_EDGE_PATH = `M42 91H86`;

/**
 * 刃尖火花: 一枚四角星。长轴竖直、短轴很窄, 星形本身就在重复"锐"这个母题。
 * 心在刃尖正上方, 顶点收在 y=9 —— 正好卡在内沿上, 再往上就要被裁。
 */
export const SPARK_PATH =
  `M${CENTER} 9` +
  `C${CENTER + 1.2} 14.4 ${CENTER + 2.2} 15.4 ${CENTER + 7.6} 16.6` +
  `C${CENTER + 2.2} 17.8 ${CENTER + 1.2} 18.8 ${CENTER} 24.2` +
  `C${CENTER - 1.2} 18.8 ${CENTER - 2.2} 17.8 ${CENTER - 7.6} 16.6` +
  `C${CENTER - 2.2} 15.4 ${CENTER - 1.2} 14.4 ${CENTER} 9Z`;

/** 风刃(右侧): 贴着刃身外缘的一道弧, 左侧靠 MIRROR_X 镜像同一条。 */
export const KEEN_WIND_PATH = `M${CENTER + 22} 40C${CENTER + 29} 54 ${CENTER + 29} 68 ${CENTER + 23} 80`;

// ── 护盾: 横向宽厚的盾形 + 外圈六边能量场 ─────────────────────────
//
// ★ 剪影是**上宽下收的盾**, 与锋利的窄长刃、心眼的横椭圆各占一个长宽比。
// ★ 外圈六边形是这枚独占的符号: 三枚图标里只有它带外环, 有环 / 无环在 20px 下比
//   "盾里画了什么"快得多。

/** 盾体: 平顶、肩角外扩、底部收成一个圆润的尖。 */
export const SHIELD_PATH =
  `M${CENTER} 26` +
  `L${CENTER + 33} 37` +
  `V64` +
  `C${CENTER + 33} 83 ${CENTER + 18} 96 ${CENTER} 103` +
  `C${CENTER - 18} 96 ${CENTER - 33} 83 ${CENTER - 33} 64` +
  `V37Z`;

/** 右半受光边: 从顶点沿右肩一路走到底尖。 */
export const SHIELD_EDGE_PATH =
  `M${CENTER} 26L${CENTER + 33} 37V64C${CENTER + 33} 83 ${CENTER + 18} 96 ${CENTER} 103`;

/** 左半暗面: 闭合形, 与右侧亮边一起把盾面折成两个受光面。 */
export const SHIELD_SHADE_PATH =
  `M${CENTER} 26L${CENTER - 33} 37V64C${CENTER - 33} 83 ${CENTER - 18} 96 ${CENTER} 103Z`;

/** 盾脊: 中轴一道竖线, 盾面的"厚"就靠它和暗面的交界。 */
export const SHIELD_SPINE_PATH = `M${CENTER} 30V99`;

/**
 * 能量扫带: 一条横贯盾面的实体带。
 * 写成有厚度的闭合形而不是描边线 —— 渐变按包围盒取值, 水平直线包围盒高为 0,
 * 部分实现里渐变会直接失效(整条变黑或不显示)。带子会被盾形裁掉两端。
 */
export const SHIELD_BAND_PATH = `M24 60H104V68H24Z`;

/** 盾心徽记: 一枚菱形, 中心再压一个亮点。菱形的尖对着盾脊, 和盾形同构。 */
export const SHIELD_CREST_PATH =
  `M${CENTER} 50L${CENTER + 11} 64L${CENTER} 78L${CENTER - 11} 64Z`;

/** 外圈六边能量场的半径。顶点落在 64±52, 两侧到内沿各留 5。 */
export const HEX_RADIUS = 52;

/** 六边形能量场。顶点朝上, 与盾的平顶正好错开, 不会两条边贴在一起。 */
export const HEX_PATH = `${Array.from({ length: 6 }, (_, i) => {
  const p = polarPoint(i * 60, HEX_RADIUS);
  return `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
}).join("")}Z`;

/** 六个顶点上的铆钉: 把能量场"钉"在框上, 免得它像一圈随便描的线。 */
export const HEX_NODES = Array.from({ length: 6 }, (_, i) => {
  const p = polarPoint(i * 60, HEX_RADIUS);
  return { key: `h${i}`, x: p.x, y: p.y };
});

// ── 心眼: 横向杏仁眼 ──────────────────────────────────────────────
//
// ★ 剪影是**横躺的杏仁**: 与刃的竖、盾的方各差一个轴向, 三枚并排时三种长宽比。
// ★ 眼球细节(虹膜纹、竖瞳、扫描线)在 20px 下必然糊掉, 所以可读性全部压在
//   「杏仁外形 + 中心一点亮」上 —— 细节只服务大图。

/** 眼眶: 上下两条对称的弧合成的杏仁形。 */
export const EYE_PATH =
  `M22 ${CENTER}` +
  `C40 40 88 40 106 ${CENTER}` +
  `C88 88 40 88 22 ${CENTER}Z`;

/** 上眼睑的受光亮边。 */
export const EYE_LID_PATH = `M22 ${CENTER}C40 40 88 40 106 ${CENTER}`;

/** 下眼睑的暗面: 只描下半条, 眼眶才有"深"。 */
export const EYE_LOWER_PATH = `M22 ${CENTER}C40 88 88 88 106 ${CENTER}`;

/** 眉弧: 眼上方一道更宽的弧, 把眼撑开、也把上半张画面占住。 */
export const BROW_PATH = `M24 55C44 29 84 29 104 55`;

/** 虹膜 / 瞳孔 / 高光三档。竖瞳是"非人之眼"最省笔墨的一笔。 */
export const IRIS = { r: 17, ringR: 12 } as const;
export const PUPIL = { rx: 4.8, ry: 12.5 } as const;
export const EYE_HILITE = { x: CENTER + 6, y: CENTER - 7, r: 3.1 } as const;

/** 虹膜放射纹: 从瞳孔边缘射向虹膜外沿的细线, 只在大图看得见。 */
export const IRIS_RAYS = Array.from({ length: 12 }, (_, i) => {
  const deg = i * 30 + 15;
  const a = polarPoint(deg, 8.5);
  const b = polarPoint(deg, IRIS.r - 1.5);
  return { key: `r${i}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y };
});

/**
 * 额饰三点冠: 眼上一枚立菱形 + 左右两枚小点, 交代"这是第三只眼"而不是一只普通眼睛。
 * 三点都压在眉弧之上, 与眉弧一起构成上半张的横向节奏。
 */
export const CROWN_GEM_PATH = `M${CENTER} 20L${CENTER + 6} 29L${CENTER} 38L${CENTER - 6} 29Z`;
export const CROWN_DOTS = [
  { key: "l", x: CENTER - 19, y: 33, r: 2.6 },
  { key: "r", x: CENTER + 19, y: 33, r: 2.6 },
] as const;

/** 眼下三道短光芒: 视线落下来的方向, 顺带把下半张的空白收掉。 */
export const SIGHT_RAYS = [
  { key: "l", d: `M${CENTER - 16} 90l-5 9` },
  { key: "c", d: `M${CENTER} 94v9` },
  { key: "r", d: `M${CENTER + 16} 90l5 9` },
] as const;

/** 扫描线: 一条横贯眼球的细带, 靠动画上下扫过, 被虹膜裁在里面。 */
export const EYE_SCAN_PATH = `M${CENTER - 20} ${CENTER - 1.2}h40v2.4h-40Z`;
