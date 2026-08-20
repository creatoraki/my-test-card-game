// ds / BUFF 图标几何层 —— 纯数据 / 纯函数, 不含 React, 不含样式。
//
// ★ 为什么把几何单独抽出来: 五个图标的构图是算出来的(花瓣阵列、进度弧 dasharray、
//   极坐标取点、圆角方框), 手写 path 字面量既改不动也读不懂。几何进这一层,
//   组件只负责把形摆上画布、叠「底色/暗面/亮边」三层。
// ⚠ 所有坐标都在 128×128 的图标画布内, 与最终渲染尺寸无关 —— 图标靠 viewBox 缩放,
//   调用方给多大就多大, 这里不要出现任何真实 px 的假设。
//
// ★ 设计语言 v6「厚涂方框」:
//   外框从切角八边铭牌盘换成**满幅 1:1 圆角方框**(外沿暗环 / 底板 / 光池 / 内投影 /
//   三道描边, 内容一律裁进 INNER_FRAME)。方框自带边界, 压在任何背景上都不漏角;
//   厚涂三层(底色 / 暗面 / 亮边)与少元素剪影的构图哲学保持不变 ——
//   每枚只留两到三件形, 缩到 20px 才不糊。

/** 图标画布边长。1:1 的唯一真相: viewBox 恒为 `0 0 128 128`。 */
export const VIEWBOX = 128;

/** 画布中心。 */
export const CENTER = VIEWBOX / 2;

const TAU = Math.PI * 2;

/** 极坐标取点: 角度以 12 点方向为 0°, 顺时针为正 —— 与徽记的阅读方向一致。 */
export function polarPoint(deg: number, radius: number): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CENTER + Math.cos(rad) * radius, y: CENTER + Math.sin(rad) * radius };
}

/** 进度弧的 dasharray: 让一段圆弧只画出 `ratio` 圈 —— 培育中用 2/3 断口表达「还没长完」。 */
export function arcDash(radius: number, ratio: number): string {
  const c = TAU * radius;
  return `${c * ratio} ${c}`;
}

// ── 共用外框: 满幅 1:1 圆角方形 ───────────────────────────────────
//
// ★ 为什么从切角八边盘改成圆角方框: 八边盘是个「圆」, 圆形图标摆进方形槽位必然四角空,
//   靠槽位背景补; 一旦背景是场景图, 那四角就是漏出来的图片, 图标的边界就没了。
//   满幅方框自带边界, 谁来当背景都不影响。
// ★ 三层边缘, 由外到内: 外沿暗环(把图标从暗场景里切出来) / 外亮边(定边界) /
//   内暗边(压出厚度)。暗底上单靠一道亮边不够 —— 亮边一旦和背景亮度撞上就消失了,
//   外面那圈暗环才是保底。

/** 一个圆角方框的规格。x/y 相等(1:1 居中), 所以只存一个 inset。 */
export type FrameRect = { inset: number; size: number; radius: number };

function frame(inset: number, radius: number): FrameRect {
  return { inset, size: VIEWBOX - inset * 2, radius };
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

/** 把 FrameRect 摊成 <rect> 的属性。1:1 由 inset 相等保证, 这里不会出现非方形。 */
export function frameProps(f: FrameRect) {
  return { x: f.inset, y: f.inset, width: f.size, height: f.size, rx: f.radius, ry: f.radius };
}

/**
 * 进度环 / 完成环半径。培育中 2/3, 完成态满圈。
 * 半径按 INNER_FRAME 收过, 环两侧到内沿各留 9。
 */
export const RING_RADIUS = 46;
export const GROWING_RATIO = 0.66;

// ── 培育中: 裂壳种子 ──────────────────────────────────────────────

/**
 * 种子壳轮廓: 上尖下圆的竖立种子。壳心在 (64, 64) 附近,
 * 中央一条裂缝, 嫩芽从裂缝探出 —— 剖面视角的替代, 用「壳」表达孕育中的封闭感。
 */
export const SEED_PATH =
  `M${CENTER} 42` +
  `C76 48 80 61 75 73` +
  `C71 83 62 88 56 83` +
  `C50 73 52 53 ${CENTER} 42` +
  "Z";

/** 壳右半受光边: 厚涂的「圆」靠这一笔立起来。 */
export const SEED_LIT_PATH = `M68 50 C74 56 76 66 72 76`;

/** 壳中央裂缝: 微微 S 弯, 芽从缝里钻出。 */
export const CRACK_PATH = `M${CENTER} 46 C63.2 56 64.8 66 ${CENTER} 78`;

/** 芽茎: 从裂缝里探出壳顶, 带一点自然的偏摆。 */
export const SPROUT_STEM = `M${CENTER} 50 C63 44 64.4 41 ${CENTER} 38`;

/** 两片卷曲的子叶: 未展开, 顶端收成芽尖亮点。 */
export const COTYLEDON_LEFT = `M${CENTER} 40 C56.5 38 52.5 33.5 53.5 29.5 C58.5 29.8 61.5 34 ${CENTER} 38 Z`;
export const COTYLEDON_RIGHT = `M${CENTER} 38 C71 36 75 31.5 74 27.5 C69 27.8 66 32 ${CENTER} 36 Z`;

/** 芽尖亮点: 整枚图标唯一的高亮源(培育中整体压暗)。 */
export const SPROUT_TIP = { x: CENTER, y: 29, r: 2.6 } as const;

/** 壳底须根: 向下探入, 带一条侧须。 */
export const ROOT_PATHS = [
  `M${CENTER} 85 C63.5 89 65 93 63 97`,
  `M${CENTER} 84 C65 88 66 92 68.5 95`,
  `M63.5 92 q-4 1.5 -6 5`,
] as const;

/** 进度弧游标: 停在 2/3 处, 标出「长到哪儿了」。 */
export const PROGRESS_HEAD = polarPoint(GROWING_RATIO * 360, RING_RADIUS);

// ── 培育完成: 八瓣花冠 ────────────────────────────────────────────

/** 完成态花瓣数。环外指针按这个数对齐。 */
export const PETAL_COUNT = 8;

/** 花瓣阵列的旋转角表(度)。 */
export const PETAL_ANGLES = Array.from({ length: PETAL_COUNT }, (_, i) => (i * 360) / PETAL_COUNT);

/**
 * 一枚朝上的花瓣(杏仁形), 起点与终点都在中心, 便于按 45° 阵列旋转。
 * tipR = 瓣尖到中心的距离; waist = 腰宽; belly = 腰部所在的高度比例。
 */
export function petalPath(tipR: number, waist: number, belly = 0.55): string {
  const tipY = CENTER - tipR;
  const waistY = CENTER - tipR * belly;
  const neckY = CENTER - tipR * 0.16;
  return (
    `M${CENTER} ${CENTER}` +
    `C${CENTER - waist * 0.5} ${neckY} ${CENTER - waist} ${waistY} ${CENTER} ${tipY}` +
    `C${CENTER + waist} ${waistY} ${CENTER + waist * 0.5} ${neckY} ${CENTER} ${CENTER}` +
    "Z"
  );
}

/** 外层实瓣尺寸。 */
export const PETAL_TIP = 38;
export const PETAL_WAIST = 16;

/** 内层小瓣尺寸(错开 22.5° 压在外瓣缝里)。 */
export const PETAL_INNER_TIP = 23;
export const PETAL_INNER_WAIST = 10;

/**
 * 一片花瓣的右半边缘线 —— 只取 petalPath 的后半段。
 * 单独描一条亮边(而不是整圈描边)才有「光从一侧来」的厚涂感; 整圈描边会变回线稿。
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

/** 瓣根暗面: 一枚缩短的同形瓣, 叠在瓣根压暗, 把花心从花冠里「顶」出来。 */
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

// ── 锋利: 一把直刃 ────────────────────────────────────────────────
//
// ★ v6 构图按「少元素剪影硬」重做: 上一版的太刀 + 磨石 + 火星 + 放射光四组形,
//   缩到 20px 只剩一片灰。这版**只留刀**: 竖直居中, 刀身饱满、刃口朝右,
//   剑尖一点金星聚焦。磨石与火星全部去掉 —— 「锋利」的语义一把刀就够了。

/**
 * 直刃太刀剪影(竖直, 刀尖朝上, 刃在右背在左):
 * 刀身微弧饱满, 剑根收窄, 是一条占画面主轴的竖形。
 * 组件里不加旋转 —— 竖直纹章位才是这套外框的语言。
 */
export const BLADE_PATH =
  `M${CENTER} 24` +
  `C66.6 32 68 44 67.6 56` +
  `C67.2 64 66.4 69 64.8 72` +
  `L63.2 72` +
  `C61.6 69 60.8 64 60.4 56` +
  `C60 44 61.4 32 ${CENTER} 24` +
  "Z";

/** 刃口亮边: 只描右缘(光从右侧来), 从刀尖一路亮到剑根。 */
export const BLADE_EDGE = `M64.3 26 C66.6 34 67.8 46 67.4 57`;

/** 剑脊线: 居中竖直, 分出亮面与暗面。 */
export const BLADE_RIDGE = `M${CENTER} 26 C${CENTER} 40 ${CENTER} 54 ${CENTER} 70`;

/** 刀镡(圆格): 圆心即剑根, 半径 7。 */
export const TSUBA = { cx: CENTER, cy: 77, r: 7 } as const;

/** 柄 + 缠线 + 柄头(均以剑根为基准向下延伸)。 */
export const HILT_X = CENTER - 2.6;
export const HILT_Y = 84;
export const HILT_W = 5.2;
export const HILT_H = 15;
export const HILT_WRAP_Y = [87, 90.5, 94] as const;
export const POMEL = { cx: CENTER, cy: 101.5, r: 2.4 } as const;

/** 剑尖金星: 刀尖上方一点聚焦光。世界坐标, 不随刀组旋转。 */
export const STAR = { x: CENTER, y: 16 } as const;

// ── 心眼: 一只眼 ──────────────────────────────────────────────────
//
// ★ v6 构图重做: 上一版是外细环 + 粗主环 + 内环 + 12 放射瞳纹 + 四向光芒 + 棱光的
//   五组形, 小尺寸下环套环糊成一团。这版**只留一只眼**: 一条有厚度的金属环带
//   (外圆 / 内圆两圈合成) + 虹膜 + 瞳孔, 眼顶一道棱光保留 —— 「洞悉」的识别特征。

/** 义眼圆心。 */
export const EYE = { cx: CENTER, cy: 63 } as const;

/** 环带两圆: 外圆是环带外缘, 内圆是环带内缘 —— 两圆合成一条有宽度的金属环。 */
export const EYE_RINGS = { outer: 27.5, inner: 21, iris: 16.5, pupil: 6.5 } as const;

/** 环带受光: 左上缘一道亮弧, 让金属环有厚度。 */
export const RING_LIT = `M50.5 42 A 24 20 0 0 1 63 36.5`;

/** 瞳孔高光: 主高光点 + 反光弧。 */
export const PUPIL_HILITE = { x: EYE.cx - 2, y: EYE.cy - 2.5, r: 1.9 } as const;
export const PUPIL_ARC = `M${EYE.cx + 1.6} ${EYE.cy + 2.4} A 3.2 3.2 0 0 0 ${EYE.cx + 4.4} ${EYE.cy}`;

/** 洞察棱光: 眼顶上方一道窄三角, 表示「视线向上放射」。 */
export const BEAM_PATH = `M${EYE.cx} 25 L${EYE.cx + 6} 15.5 L${EYE.cx - 6} 15.5 Z`;

// ── 护盾: 一块盾 ──────────────────────────────────────────────────
//
// ★ v6 构图重做: 上一版是圆盾 + 六边形线 + 菱形核心 + 能量弧 + 投影 + 漂浮泡的六组形。
//   这版**只留一块盾**: 圆盾厚涂(面渐变 + 受光高光) + 中央菱形核心, 其余全部去掉。

/** 盾心与盾体半径。 */
export const SHIELD = { cx: CENTER, cy: 62, r: 32 } as const;

/** 盾面受光高光: 左上缘一道弧。 */
export const SHIELD_LIT = `M50 40 A 28 24 0 0 1 80 38`;

/** 中央菱形核心(比上一版收小一圈, 让盾面本身成为主角)。 */
export const CORE_DIAMOND =
  `M${SHIELD.cx} 53 L${SHIELD.cx + 9} 62 L${SHIELD.cx} 71 L${SHIELD.cx - 9} 62 Z`;

/** 核心高光点。 */
export const CORE_HILITE = { x: SHIELD.cx - 2.4, y: 60, r: 1.7 } as const;
