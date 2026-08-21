// ds / BUFF 图标几何层 —— 纯数据 / 纯函数, 不含 React, 不含样式。
//
// ★ 为什么把几何单独抽出来: 五个图标的构图是算出来的(花瓣阵列、进度弧 dasharray、
//   极坐标取点、圆角方框), 手写 path 字面量既改不动也读不懂。几何进这一层,
//   组件只负责把形摆上画布、叠「底色/暗面/亮边」三层。
// ⚠ 所有坐标都在 128×128 的图标画布内, 与最终渲染尺寸无关 —— 图标靠 viewBox 缩放,
//   调用方给多大就多大, 这里不要出现任何真实 px 的假设。
//
// ★ 设计语言 v9「霓虹宝石徽章」:
//   外框仍是**满幅 1:1 圆角方框**(外沿暗环 / 底板 / 光池 / 内投影 / 三道描边,
//   内容一律裁进 INNER_FRAME), 方框自带边界, 压在任何背景上都不漏角;
//   战斗三态(锋利 / 心眼 / 护盾)在 v9 升级为**多面切割 + 宝石核心 + 霓虹能量线**:
//   层次从三层加到四~五层, 每枚都有一颗「宝石」(菱形 / 双菱 / 大菱)做收口,
//   一处「能量」(血槽霓虹线 / 虹膜放射纹 / 导管与刻线)做点缀 ——
//   缩到 20px 依然可读, 放大看又有细节。

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

// ── 锋利: 霓虹破甲箭镞 ────────────────────────────────────────────
//
// ★ v9 全面升级「霓虹宝石徽章」: 三棱锥换成**多面切割** —— 左右两个主面
//   (右受光 / 左背光) + 中央脊线高光 + 内芯亮带, 层次从三层加到五层;
//   血槽内嵌一道**霓虹红光能量线**(发光); 收口宝石加大加亮(外菱 + 内菱 + 高光点);
//   套筒带能量槽线; 两侧漂浮霓虹碎片 + 尖端 / 中腰四道射线。
// ★ 造型规则(可核对的几何事实):
//   ① 主体顶到框边: 尖端 y18、套筒底 y110, 双侧倒刺 x42~86 —— 不留大片空白;
//   ② 五层内缩: 外廓(带倒刺剪影) → 左右主面 → 内芯 → 血槽, 层间靠近黑描边分开;
//   ③ 多边形核心: 血槽底口赤红菱形宝石, 同时压住血槽与套筒的接缝;
//   ④ 配件: 双侧倒刺 / 套筒 + 能量槽线 + 两枚能量节点 / 四道射线 / 两块漂浮碎片。
// ★ 血只给两处: 尖端血渍(刚穿过去) + 沿血槽下淌的一道血流 ——
//   冷钢与血红面积比约 10:1, 血是落点不是主色。
// ⚠ 主轴压在画布中线 x=64 上。外廓最宽 x42~86、尖端 y18、套筒底 y110,
//   全部落在内沿(9~119)之内, 不会被圆角裁掉。

/** 第一层 外廓剪影: 带双侧倒刺的完整外形。 */
export const ARROW_OUTER =
  "M64 18 L78 94 L86 106 L71 100 L57 100 L42 106 L50 94 Z";

/** 第二层 左主面(背光): 从脊线到左缘。 */
export const ARROW_FACE_L = "M64 24 L50 90 L64 92 Z";

/** 第二层 右主面(受光): 从脊线到右缘, 高光全压在这一面。 */
export const ARROW_FACE_R = "M64 24 L64 92 L78 90 Z";

/** 第三层 内芯: 再内缩一档的亮钢带。 */
export const ARROW_CORE = "M64 28 L57 86 L71 86 Z";

/** 中央脊线高光: 左右面的明暗交界, 一道细白线立起棱。 */
export const ARROW_RIDGE = "M64 24 L64 92";

/** 血槽: 沿中轴的一道暗凹槽 —— 箭镞穿甲后血从这里淌。 */
export const ARROW_FULLER = "M64 36 L67.5 80 L60.5 80 Z";

/** 血槽霓虹能量线: 槽内一道发光的红线, 凹槽因此有「能量在流」的观感。 */
export const ARROW_FULLER_GLOW = "M63 39 L63 78";

/** 尖端血渍: 刚穿过去的血, 只给尖端一点。 */
export const ARROW_BLOOD_TIP = "M64 18 L67 34 L61 34 Z";

/** 沿血槽下淌的血流: 从尖端血渍一路淌到收口宝石。 */
export const ARROW_BLOOD_RUN = "M63.5 36 L63.5 76";

/** 左刃口暗边: 与右刃口的白形成一冷一暗, 镞因此有「两个面」。 */
export const ARROW_EDGE_L = "M64 19 L50.5 93";

/** 右刃口亮边: 整枚图标的亮度峰值。 */
export const ARROW_EDGE_R = "M64 19 L77.5 93";

/** 左下环境反光: 背光面不死黑, 左缘才不会和底盘粘在一起。 */
export const ARROW_BOUNCE = "M59 28 L52 88";

/** 收口宝石: 赤红菱形, 压在血槽底口 —— 同时盖住血槽与套筒的接缝。 */
export const ARROW_GEM = "M64 72 L70 82 L64 92 L58 82 Z";

/** 宝石内菱: 同心嵌套一路贯到最里面。 */
export const ARROW_GEM_INNER = "M64 76.5 L67 82 L64 87.5 L61 82 Z";

/** 宝石高光点: 偏左上的一粒白点, 让宝石「亮起来」而不是一块红。 */
export const ARROW_GEM_HILITE = { x: 64, y: 78.5 } as const;

/** 套筒: 箭杆接口, 上宽下窄。 */
export const ARROW_SOCKET = "M55 96 L73 96 L68 110 L60 110 Z";

/** 套筒能量槽线: 一道横贯套筒的细亮线。 */
export const ARROW_SOCKET_GLOW = "M57 103.5 L71 103.5";

/** 套筒能量节点: 两枚, 把箭镞钉在框上。 */
export const SOCKET_RIVETS = [
  { key: "l", x: 59, y: 103.5 },
  { key: "r", x: 69, y: 103.5 },
] as const;

/** 锋芒射线: 尖端两侧 + 中腰四道短线, 把箭镞两边的空白收掉。 */
export const ARROW_RAYS = [
  "M50 30 L42 22",
  "M78 30 L86 22",
  "M40 62 L33 61",
  "M88 62 L95 61",
] as const;

/** 漂浮能量碎片: 两侧各一枚小菱形, 与射线错位摆放。 */
export const ARROW_SHARDS = [
  "M33 42 L36 46 L33 50 L30 46 Z",
  "M95 42 L98 46 L95 50 L92 46 Z",
] as const;

// ── 心眼: 圣辉全视之眼 ────────────────────────────────────────────
//
// ★ v9 全面升级「霓虹宝石徽章」: 三角从两层加到三层(外暗底 → 中金白渐变主体);
//   虹膜改为**双层环**(外金环 + 内白环) + 8 条放射纹; 瞳孔改为**旋转嵌套双菱**
//   (竖菱 + 45° 错开的内菱 + 瞳心白点); 顶点换成大菱形宝石(外菱 + 内菱 + 高光);
//   光芒从五道加到**七道长短交替**; 托带中央加一枚小菱。
// ★ 三层同心: 外三角(暗底金边) → 中三角(金白渐变 + 左右切面) → 双层虹膜正圆,
//   层间靠近黑描边分开; 眼不是贴在三角上的, 是嵌在三角里的。
// ★ 切面明暗: 中三角沿中线劈成两半 —— 右半受光、左半背光, 金字塔的两面;
//   左下内沿一道环境反光把背光面从底盘上重新切出来。
// ★ 多边形核心: 菱形双瞳(竖菱 + 45° 内菱), 瞳心白点透光, 整枚唯一亮点。
// ★ 配件: 顶点宝石 / 底部托带 + 中央小菱 / 七道放射光芒 / 虹膜放射纹 8 条 /
//   上睑投影(新月形, 眼球「陷」进眼眶全靠它)。
// ⚠ 眼 r=15 放在中三角内: 中三角在眼心 y62 处半宽 16.9, 眼缘 15 —— 留 1.9 余量,
//   不会越出三角边。三角底边 y100 与托带 y102~114 分两段画。

/** 第一层 外三角: 暗底 + 一圈金边。 */
export const EYE_TRI_OUTER = "M64 16 L104 100 L24 100 Z";

/** 第二层 中三角(眼底主体): 内缩 10, 铺金白渐变。 */
export const EYE_TRI_MID = "M64 26 L94 90 L34 90 Z";

/** 右半受光切面: 金字塔朝光的一面。 */
export const EYE_TRI_FACET_LIT = "M64 26 L94 90 L64 90 Z";

/** 左半背光切面: 金字塔背光的一面。 */
export const EYE_TRI_FACET_SHADE = "M64 26 L64 90 L34 90 Z";

/** 左缘暗边 / 右缘亮边: 一冷一暗, 三角因此有体积。 */
export const EYE_TRI_EDGE_L = "M64 17 L25 99";
export const EYE_TRI_EDGE_R = "M64 17 L103 99";

/** 左下环境反光: 贴中三角左沿, 把背光面从底盘上切开。 */
export const EYE_TRI_BOUNCE = "M60 32 L35 86";

/** 眼: 圆心与半径。圆略上移, 给底部托带留位置。 */
export const EYE_CENTER = { x: 64, y: 62 } as const;
export const EYE_RADIUS = 15;

/** 虹膜内环半径: 把虹膜分成外金环与内白环两档。 */
export const EYE_RING_RADIUS = 10.5;

/** 上睑投影: 虹膜上半的新月形暗片 —— 眼球「陷」进眼眶全靠这一片。 */
export const EYE_LID_SHADOW =
  "M49 62 A15 15 0 0 1 79 62 L73.5 62 A9.5 9.5 0 0 0 54.5 62 Z";

/** 瞳孔外菱: 竖菱(上下收尖) —— 有棱角的瞳孔比圆点更像「非人之眼」。 */
export const EYE_PUPIL = "M64 55.5 L70.5 62 L64 68.5 L57.5 62 Z";

/** 瞳孔内菱: 与外菱旋转 45° 错开的水平菱, 叠出双菱嵌套。 */
export const EYE_PUPIL_INNER = "M61.2 59.2 L66.8 59.2 L66.8 64.8 L61.2 64.8 Z";

/** 顶点宝石: 三角尖的收口, 压住外三角的顶点。 */
export const EYE_APEX = "M64 12 L69 20 L64 28 L59 20 Z";

/** 顶点宝石内菱。 */
export const EYE_APEX_INNER = "M64 15.5 L66.5 20 L64 24.5 L61.5 20 Z";

/** 顶点宝石高光点。 */
export const EYE_APEX_HILITE = { x: 64, y: 17.5 } as const;

/** 底部托带: 三角底边下的横带, 把整枚图标压稳。 */
export const EYE_BANNER = "M28 102 L100 102 L94 114 L34 114 Z";

/** 托带上缘亮边。 */
export const EYE_BANNER_LIT = "M29 102.8 L99 102.8";

/** 托带中央小菱: 与托带同宽的收口。 */
export const EYE_BANNER_GEM = "M64 105 L67 109 L64 113 L61 109 Z";

/** 光芒射线: 七道, 长短交替, 从三角四周向外放射, 把三角钉在框上。 */
export const EYE_RAYS = [
  "M64 8 L64 11",
  "M40 24 L34 18",
  "M88 24 L94 18",
  "M20 62 L14 61",
  "M108 62 L114 61",
  "M26 92 L23 97",
  "M102 92 L105 97",
] as const;

/** 虹膜放射纹: 8 条, 45° 一档, 从内白环缘(11)向金环外沿(14)。 */
export const EYE_FIBERS = Array.from({ length: 8 }, (_, i) => {
  const deg = i * 45;
  const rad = ((deg - 90) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    key: `f${i}`,
    x1: EYE_CENTER.x + cos * 11,
    y1: EYE_CENTER.y + sin * 11,
    x2: EYE_CENTER.x + cos * 14,
    y2: EYE_CENTER.y + sin * 14,
  };
});

// ── 护盾: 辉光能量圆盾 ────────────────────────────────────────────
//
// ★ v9 全面升级「霓虹宝石徽章」: 三层同心加到四层(外环 → 盾面 → 内盘 → 盾心宝石);
//   外环加 **12 段刻线**(30° 一档, 与节点错开 15°) + 一道霓虹细环线, 有仪表盘
//   的科技感; 盾面加四根**能量导管**(上下左右, 从内盘缘到盾面缘, 发光);
//   盾心六边形换成**菱形宝石**(外菱 + 内菱 + 白心 + 辉光环);
//   铆钉升级为**能量节点**(暗座 + 亮心 + 高光 + 外圈细环);
//   力场光弧从单线变**双线**(细外弧 + 粗内弧)。
// ★ 四层同心: 外环(暗底金属环) → 盾面(主渐变) → 内盘(最亮) → 盾心宝石(爆点),
//   层间靠近黑描边分开 —— 圆盾天然就是同心嵌套, 一路贯到最里面。
// ★ 切面明暗: 盾面上缘受光月牙 + 左半背光切面, 明暗交界压在中线上;
//   外环右上受光弧 + 左下环境反光, 金属环的「被敲打过」感。

/** 盾心。 */
export const SHIELD_CENTER = { x: 64, y: 60 } as const;

/** 同心圆半径: 外环 / 盾面 / 内盘。 */
export const SHIELD_RING = { outer: 47, face: 38, inner: 27 } as const;

/** 上缘受光切面: 盾面上沿一道月牙, 下缘走弦。 */
export const SHIELD_FACET_LIT =
  "M64 22 A38 38 0 0 1 100 49 L28 49 A38 38 0 0 1 64 22 Z";

/** 左半背光切面: 从弦到盾底, 明暗交界压在竖中线上。 */
export const SHIELD_FACET_SHADE = "M28 49 L64 49 L64 98 A38 38 0 0 1 28 49 Z";

/** 外环右上受光弧: 光源在右上, 金属环的受光沿。 */
export const SHIELD_RIM_LIT = "M70 13.5 A47 47 0 0 1 107 74";

/** 外环左下环境反光: 暗环不死黑, 左下缘才不会和底盘粘在一起。 */
export const SHIELD_BOUNCE = "M19 70 A47 47 0 0 0 33 96";

/** 外环刻线: 12 段, 30° 一档、从 15° 起, 从外缘(47)向内(43) ——
    与六枚节点(0°/60°)错开 15°, 不会叠在一起。 */
export const SHIELD_TICKS = Array.from({ length: 12 }, (_, i) => {
  const a = polarPoint(i * 30 + 15, SHIELD_RING.outer);
  const b = polarPoint(i * 30 + 15, SHIELD_RING.outer - 4);
  return { key: `t${i}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y };
});

/** 能量导管: 四根, 从内盘边缘(27)到盾面边缘(38), 上下左右各一。 */
export const SHIELD_CONDUITS = [
  "M64 33 L64 22",
  "M64 87 L64 98",
  "M37 60 L26 60",
  "M91 60 L102 60",
] as const;

/** 盾心菱形宝石: 外菱(半径 12) / 内菱(半径 7), 棱角与盾同构。 */
export const SHIELD_BOSS = "M64 48 L76 60 L64 72 L52 60 Z";
export const SHIELD_BOSS_INNER = "M64 53 L71 60 L64 67 L57 60 Z";

/** 能量节点: 六个, 沿外环 60° 一档, 把盾钉在框上。 */
export const SHIELD_RIVETS = Array.from({ length: 6 }, (_, i) => {
  const p = polarPoint(i * 60, SHIELD_RING.outer);
  return { key: `r${i}`, x: p.x, y: p.y };
});

/** 力场光弧: 外细弧(亮) + 内粗弧(暗), 左右各两道, 交代「罩着一层力场」。 */
export const SHIELD_HALOS_OUTER = [
  "M11 44 C7.5 56 7.5 76 11 84",
  "M117 44 C120.5 56 120.5 76 117 84",
] as const;

export const SHIELD_HALOS_INNER = [
  "M20 48 C17 56 17 72 20 78",
  "M108 48 C111 56 111 72 108 78",
] as const;
