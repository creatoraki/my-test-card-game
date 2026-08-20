// 厚涂版培育 BUFF 图标的几何层 —— 纯数据 / 纯函数, 不含 React, 不含样式。
//
// ★ 共用的数学不在这里重写: 画布常量、极坐标、花瓣阵列与勾记
//   全部从线稿版的几何层复用 —— 两套图标必须**同规格**才能互换槽位, 规格靠共享同一份
//   代码保证, 而不是靠两边各抄一遍数字。
// ★ 这里只放厚涂版**独有**的形: 圆角方形外框、土台与地平线、对称的双叶芽、瓣面的明暗分区。
//   厚涂的立体感 = 同一个形上叠「底色 / 暗面 / 亮边」三层, 所以每个形往往要配一条
//   只画半边的高光路径 —— 这类"半边路径"是本层的主要产出。
// ⚠ 坐标一律在 128×128 画布内, 不出现任何真实 px 假设。
// ⚠ 外框是**硬边界**: 任何新加的形都必须落在 INNER_FRAME 以内。这一条不是审美偏好 ——
//   图标要摆进偏暗的场景图上, 一旦有元素溢出框外, 它就没有边界了, 会直接糊进背景里。

import { CENTER, SIGIL_VIEWBOX } from "../CultivationSigil/cultivationGeometry";

export {
  CENTER,
  SIGIL_VIEWBOX as EMBLEM_VIEWBOX,
  CHECK_PATH,
  PETAL_ANGLES,
  petalPath,
  polarPoint,
} from "../CultivationSigil/cultivationGeometry";

// ── 共用外框: 满幅 1:1 圆角方形 ───────────────────────────────────
//
// ★ 为什么从切角八边盘改成圆角方框: 八边盘是个「圆」, 圆形图标摆进方形槽位必然四角空,
//   靠槽位背景补; 一旦背景是场景图, 那四角就是漏出来的图片, 图标的边界就没了。
//   满幅方框自带边界, 谁来当背景都不影响。
// ★ 三层边缘, 由外到内: 外沿暗环(把图标从暗场景里切出来) / 外亮边(冷银, 定边界) /
//   内暗边(压出厚度)。暗底上单靠一道亮边不够 —— 亮边一旦和背景亮度撞上就消失了,
//   外面那圈暗环才是保底。

/** 一个圆角方框的规格。x/y 相等(1:1 居中), 所以只存一个 inset。 */
export type FrameRect = { inset: number; size: number; radius: number };

function frame(inset: number, radius: number): FrameRect {
  return { inset, size: SIGIL_VIEWBOX - inset * 2, radius };
}

/** 最外那圈暗环: 贴着画布边, 只负责在暗场景里切出轮廓。 */
export const EDGE_FRAME = frame(1, 26);

/** 外框本体: 底板与外亮边都画在这一圈上。 */
export const OUTER_FRAME = frame(3, 24);

/** 内沿: 图形的**唯一可用区**。内容一律裁进这块, 动画和发光都溢不出去。 */
export const INNER_FRAME = frame(9, 17);

/** 从一个框往内缩一点, 用来叠第二道描边(内暗边 + 内亮线这种)。 */
export function insetFrame(base: FrameRect, delta: number): FrameRect {
  return frame(base.inset + delta, Math.max(0, base.radius - delta));
}

/**
 * 完成环半径。环是**完成态独占**的符号 —— 培育中那一态整枚不带环, 所以这里也不再有
 * 「进度占比」这种东西: 有环 / 无环比一条走了 2/3 的弧更快被读到, 尤其在 20px。
 * 半径按 INNER_FRAME 收过, 环两侧到内沿各留 9。
 */
export const RING_RADIUS = 46;

// ── 培育中: 地平线 + 对称双叶 + 埋在土里的胚珠 ────────────────────
//
// ★ 这一版把构图压到**三件**: 一条地平线切开的实心土台 / 一株左右严格对称的双叶芽 /
//   土里一点发光的胚珠。上一版的抛物线土堆 + 两道暗纹 + 半透荚在 32px 以下会糊成
//   一坨褐色, 元素越少剪影越硬 —— BUFF 图标的可读性是靠剪影, 不是靠细节量。
// ★ 对称是这版的设计语言: 叶子只定义**右半边**, 左半边靠镜像变换生成
//   (MIRROR_X: x → 128-x, 因为 CENTER 恰是画布中线)。两边永远不会画歪。

// 摆位: 主体包围盒 x 24~104(土台最宽) / y 23~102(花苞顶到土台底), 四边到内沿(9~119)
// 的留白都在 15~17 之间。底部比顶部紧一点点 —— 有根的东西压低一点才站得住,
// 数学上严格居中的植物看起来反而像在飘。

/** 地平线的高度: 土台上沿。整枚图标的横向分割线, 上苗下土。 */
export const HORIZON_Y = 86;

/**
 * 土台: 一块实心暗剪影, 上沿是微凸的地平线, 两端向内收 —— 它是一方**悬空的地台**,
 * 不贴框底。贴底就没有下留白了, 图标会像被框切了一刀。
 * 不画任何暗纹 —— 土台的职责只是「压住下半张、给亮点一个暗底」。
 */
export const SOIL_PATH =
  `M24 ${HORIZON_Y}` +
  `Q${CENTER} ${HORIZON_Y - 11} 104 ${HORIZON_Y}` +
  `Q95 101 ${CENTER} 102` +
  `Q33 101 24 ${HORIZON_Y}Z`;

/** 地平线亮边: 这一版唯一保留的土层细节, 一道被芽光反照的冷色细线。 */
export const SOIL_EDGE_PATH = `M24 ${HORIZON_Y}Q${CENTER} ${HORIZON_Y - 11} 104 ${HORIZON_Y}`;

/** 胚珠: 埋在土台里, 是培育中唯一的高亮源 —— 隔着土层透出来的一点光。 */
export const SEED_CORE = { x: CENTER, y: 92, r: 4.4 } as const;

/** 主根: 从胚珠向下探的一笔, 只留一条, 交代"往下扎"而不抢剪影。 */
export const ROOT_PATH = `M${CENTER} ${SEED_CORE.y}c-1 3-2 6-3 8`;

/** 芽茎: 一条从土面直上的竖笔。直茎比弯茎更有构成感, 也更耐缩放。 */
export const STEM_PATH = `M${CENTER} ${HORIZON_Y}V30`;

/** 茎顶的未展开花苞: 对称构图的顶点, 小尺寸下是"这是棵苗"的最后一条线索。 */
export const BUD_POINT = { x: CENTER, y: 27, r: 3.8 } as const;

/**
 * 一片叶子(右侧)。杏仁形, 根部收在茎上、尖端斜指右上。
 * 左侧叶不另写路径, 用 MIRROR_X 镜像同一条 —— 见文件头的对称约定。
 */
export const LEAF_PATH = `M${CENTER} 68C${CENTER + 6} 52 ${CENTER + 15} 41 ${CENTER + 32} 36C${CENTER + 31} 54 ${CENTER + 21} 65 ${CENTER} 68Z`;

/** 叶脉: 沿叶片长轴的一条细线, 厚涂里靠它把平面的叶子分出两个受光面。 */
export const LEAF_VEIN_PATH = `M${CENTER} 67C${CENTER + 9} 58 ${CENTER + 20} 46 ${CENTER + 30} 39`;

/** 叶片上缘的受光亮边: 只描朝向光源(右上)的那半条边。 */
export const LEAF_LIT_PATH = `M${CENTER} 68C${CENTER + 6} 52 ${CENTER + 15} 41 ${CENTER + 32} 36`;

/** 镜像变换: 绕画布中线翻转, 把右侧的形变成左侧的形。 */
export const MIRROR_X = `translate(${CENTER * 2} 0) scale(-1 1)`;

// ── 培育完成: 花冠的明暗分区 ──────────────────────────────────────

/** 外层实瓣尺寸。 */
export const PETAL_TIP = 38;
export const PETAL_WAIST = 17;

/** 内层小瓣尺寸(错开 30° 压在外瓣缝里)。 */
export const PETAL_INNER_TIP = 23;
export const PETAL_INNER_WAIST = 10;

/**
 * 一片花瓣的右半边缘线 —— 只取 petalPath 的后半段。
 * 单独描一条亮边(而不是整圈描边)才有"光从一侧来"的厚涂感; 整圈描边会变回线稿。
 */
export function petalEdgePath(tipR: number, waist: number, belly = 0.55): string {
  const tipY = CENTER - tipR;
  const waistY = CENTER - tipR * belly;
  const neckY = CENTER - tipR * 0.16;
  return (
    `M${CENTER} ${tipY}` +
    `C${CENTER + waist} ${waistY} ${CENTER + waist * 0.5} ${neckY} ${CENTER} ${CENTER}`
  );
}

/** 瓣根暗面: 一枚缩短的同形瓣, 叠在瓣根压暗, 把花心从花冠里"顶"出来。 */
export const PETAL_SHADE_TIP = PETAL_TIP * 0.44;
export const PETAL_SHADE_WAIST = PETAL_WAIST * 0.72;

/** 花心三档: 外环 / 内盘 / 高光点。 */
export const PISTIL = { outer: 11, inner: 7, core: 3.4 } as const;

/**
 * 纹章托带: 底部一条横带, 把整枚图标压稳。
 * 半宽按完成环算出来 —— 带子两端正好**吻在环上**, 不长出去也不缩在里面。
 * 写成算式而不是常量: 改环半径时带子会自己跟着走。
 */
export const CREST_Y = CENTER + 38;
export const CREST_HALF = Math.sqrt(RING_RADIUS ** 2 - (CREST_Y - CENTER) ** 2);

/**
 * 托带画成**有厚度的闭合形**而不是一条描边线。
 * 原因: 渐变默认按图形包围盒取值, 一条水平直线的包围盒高为 0, 渐变在部分实现里会直接失效
 * (整条带子变黑或干脆不显示)。给它 3px 的实体高度, 包围盒才成立。
 */
export const CREST_BAND_PATH =
  `M${CENTER - CREST_HALF} ${CREST_Y - 1.6}h${CREST_HALF * 2}v3.2h${-CREST_HALF * 2}Z`;
