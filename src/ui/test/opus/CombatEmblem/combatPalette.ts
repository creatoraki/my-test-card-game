// 战斗三态 BUFF 图标的配色层 —— 纯数据, 不含 React, 不含 CSS。
//
// ★ 类型直接复用厚涂版培育图标的配色协议(EmblemPalette): 五枚图标共用一套「渐变 + 发光 + 实色」
//   的描述方式, 才谈得上同一套 BUFF 图标。
// ★ 三枚各持一套**独立复合配色**, 不是同色相深浅。去掉形状光看色斑也要能分辨:
//     锋利 = 钢青刃身 + 近白刃口 + 血红落点(冷 · 极高对比 · 五枚里唯一带红的);
//     护盾 = 深海军蓝底 + 亮蓝盾面 + 白蓝盾心(全蓝 · 中亮度 · 体量最大);
//     心眼 = 深褐底 + 白金眼底 + 纯白瞳心(金白 · 亮度最高的一枚)。
//
// ★★ 主题色是**指定的**, 不是从形推出来的: 护盾走蓝、心眼走金白。所以这一层里
//    「哪一枚该是什么色相」不要再按构图去改 —— 要改先确认主题色本身有没有变。
//    两枚换色之后与培育两态的关系也重新核过:
//      培育中是青绿(#4fd8c8), 护盾是天青蓝(#2f7fc9) —— 一个偏绿一个偏紫, 并排不撞;
//      培育完成是金橙 + 黄绿(暖橙调), 心眼是香槟金 + 大量纯白(冷金调, 且底盘更黑),
//      同为"金"但一个是橙金一个是白金, 靠**底盘明度**和**白的占比**分开。
//
// ★★ 主体占满画面之后, **ink 里的 deep(暗描边)是关键色**: 三层同心的轮廓全靠它彼此分开。
//    厚涂里描边不是线稿的残留, 是分层的手段。
//
// ⚠ 配色写死不吃 currentColor: 厚涂的立体感来自同一块面上明面/暗面/高光**三档的相对关系**,
//   单一变量替换不了三档; 而且色相本身就是语义, 不该让调用方改掉。

import type { EmblemPalette } from "@/ui/common/BuffIcon/emblemPalette";

export type { EmblemPalette, GradientSpec } from "@/ui/common/BuffIcon/emblemPalette";

// ── 锋利: 冷钢 · 极高对比 · 见血 ──────────────────────────────────
//
// 这一枚的性格是**对比**而不是亮度: 刃身背光面压到近黑, 右刃口给到纯白, 中间几乎没有过渡档。
//
// ★★ 主题色仍是钢青 —— 血红是**落点**, 不是主色。这一版比上一版更克制: 血只剩**两处**
//    (刃身下段一抹 + 一滴垂血珠), 血流与第二滴血珠都砍掉了, 连同护手宝石在内
//    占的面积大约是冷钢的 1/10, 且只出现在刃的下段。理由有两条:
//      ① 语义上"锋利"是刃本身, 血是刃切过东西的证据 —— 血喧宾夺主, 图标就变成"流血/重伤";
//      ② 并排关系上, 护盾是全蓝、心眼是金白, 锋利若整枚转暗红, 三枚就成了红蓝金三原色,
//         而且暗红压在暗场景图上会直接糊掉。冷钢底 + 一点血, 明度关系才立得住。
// ★ 血分两档: bloodDeep(积在暗处的暗红, 近黑) 与 bloodLit(新鲜血的亮红反光)。
//   只给一个红等于一块红斑, 两档才是"湿的"。

export const KEEN_PALETTE: EmblemPalette = {
  gradients: [
    // 底盘: 中心略亮的一个坑, 冷钢灰蓝。
    {
      key: "plate",
      kind: "radial",
      cx: "50%",
      cy: "42%",
      r: "62%",
      stops: [
        { offset: "0%", color: "#243141" },
        { offset: "58%", color: "#151d28" },
        { offset: "100%", color: "#080b10" },
      ],
    },
    // 刃身外廓: 上亮下暗的暗钢。最外那层本来就该是最暗的。
    {
      key: "blade",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#4a6076" },
        { offset: "50%", color: "#1d2937" },
        { offset: "100%", color: "#0a1119" },
      ],
    },
    // 剑身面: 左暗右亮, 光源在右上。钢的质感全压在这块渐变上。
    {
      key: "face",
      kind: "linear",
      x1: "0%",
      y1: "100%",
      x2: "100%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#2b3b4d" },
        { offset: "40%", color: "#7e97b1" },
        { offset: "78%", color: "#cfe2f5" },
        { offset: "100%", color: "#ffffff" },
      ],
    },
    // 刃面右半 · 受光面: 半透地叠在 face 之上把右半整体提亮。
    // ★ 不做成不透明的独立色块: 叠色才留得住底下 face 的钢质渐变,
    //   一块实色盖上去, 刃就从"打磨过的钢"退回"一片浅灰纸"。
    {
      key: "faceLit",
      kind: "linear",
      x1: "0%",
      y1: "100%",
      x2: "100%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#9fb6cc", opacity: 0.35 },
        { offset: "55%", color: "#e8f2ff", opacity: 0.7 },
        { offset: "100%", color: "#ffffff", opacity: 0.92 },
      ],
    },
    // 刃面左半 · 背光面: 同样半透, 沉两档。与受光面沿中轴直接切开, 交界自成中脊。
    {
      key: "faceShade",
      kind: "linear",
      x1: "100%",
      y1: "0%",
      x2: "0%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#0a1119", opacity: 0.62 },
        { offset: "70%", color: "#101b28", opacity: 0.42 },
        { offset: "100%", color: "#1d2937", opacity: 0.18 },
      ],
    },
    // 护手: 比剑身沉一档的青铜钢, 免得横向的护手抢过竖向的剑身。
    {
      key: "guard",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#8ea6bd" },
        { offset: "45%", color: "#455a70" },
        { offset: "100%", color: "#111a24" },
      ],
    },
    // 剑柄: 近黑的皮革, 整枚图标最暗的一块, 用来托住下半张。
    {
      key: "grip",
      kind: "linear",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#0a0f15" },
        { offset: "62%", color: "#25313f" },
        { offset: "100%", color: "#3d5164" },
      ],
    },
    // 刃身下半的血渍: 上缘薄(透出钢) → 下缘厚(近黑红)。血是积下来的, 所以下面重。
    {
      key: "blood",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#e0362c", opacity: 0.82 },
        { offset: "40%", color: "#a3131c" },
        { offset: "100%", color: "#3d060a" },
      ],
    },
    // 血珠: 一颗有体积的液滴 —— 左上受光偏亮, 底部透出深红。
    {
      key: "drop",
      kind: "radial",
      cx: "36%",
      cy: "30%",
      r: "78%",
      stops: [
        { offset: "0%", color: "#ff6a5a" },
        { offset: "34%", color: "#d4202a" },
        { offset: "100%", color: "#4a0810" },
      ],
    },
    // 护手宝石: 全冷画面里唯一的暖, 从白心烧到赤红。
    {
      key: "core",
      kind: "radial",
      stops: [
        { offset: "0%", color: "#ffffff" },
        { offset: "32%", color: "#ffe9c2" },
        { offset: "70%", color: "#ff6a4d" },
        { offset: "100%", color: "#c22a1e" },
      ],
    },
  ],
  glow: { color: "#bcd9ff", blur: 1.9, opacity: 0.75 },
  ink: {
    /** 外框亮边: 冷银, 与培育中的冷银同族但更硬一档。 */
    rim: "#7f9cbd",
    /** 分层描边: 刃身三层与护手 / 柄靠它彼此分开。 */
    deep: "#05090f",
    /** 右刃口亮边与护手受光沿 —— 整枚图标的亮度峰值就在这条线上。 */
    light: "#ffffff",
    /** 左刃口暗边与背光面。 */
    shade: "#101b28",
    /** 贯穿画面的那道斜弧光。 */
    accent: "#cfe2f5",
    /** 血的暗档: 血珠的描边, 近黑红 —— 血在暗处不是红的, 是黑的。 */
    bloodDeep: "#3a0509",
    /** 血的亮档: 血渍上缘的一道薄反光 —— 有这一档血才是"湿"的。 */
    bloodLit: "#ff6a5a",
  },
};

// ── 护盾: 全蓝 · 体量最大 ─────────────────────────────────────────
//
// 主题色蓝。整枚统一在海军蓝 → 天青蓝 → 白蓝的一条明度阶上, 不掺暖色 ——
// 蓝这件事要成立, 靠的是"整枚只有蓝", 掺一点金就会变回更早那种靛金对冲。
//
// ★★ 这一版的明暗不再靠"三层同心一路推亮", 靠**两刀分面**:
//    横腰线切上下(上受光 / 下沉), 盾脊切左右(右受光 / 左背光), 交叉出四个明度块。
//    所以这一层里 beltLit / beltLow / facetShade 三个渐变全部是**半透叠加**,
//    底下的 shield 主渐变要能透上来 —— 换成不透明色块, 金属就变成剪纸了。

export const WARD_PALETTE: EmblemPalette = {
  gradients: [
    {
      key: "plate",
      kind: "radial",
      cx: "50%",
      cy: "44%",
      r: "62%",
      stops: [
        { offset: "0%", color: "#12294f" },
        { offset: "56%", color: "#08142a" },
        { offset: "100%", color: "#030812" },
      ],
    },
    // 盾面: 底部深蓝 → 顶部亮蓝。上亮下暗, 与右上光源一致。
    {
      key: "shield",
      kind: "linear",
      y1: "100%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#0e2f5c" },
        { offset: "34%", color: "#2166ab" },
        { offset: "74%", color: "#4fa0e0" },
        { offset: "100%", color: "#b6e0ff" },
      ],
    },
    // 腰线以上 · 打磨过的受光面: 顶沿最亮, 到腰线收干净。
    // 上一版这里是"内盾"那层套娃, 换成分面之后, 盾读起来是**一块金属**而不是三个同心盾形。
    {
      key: "beltLit",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#dff1ff", opacity: 0.72 },
        { offset: "46%", color: "#8fd0ff", opacity: 0.36 },
        { offset: "100%", color: "#7fc2f5", opacity: 0.06 },
      ],
    },
    // 腰线以下 · 沉下去的一段: 紧贴腰线处最重, 往盾尖散开(留给底部的一点回光)。
    {
      key: "beltLow",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#02101f", opacity: 0.5 },
        { offset: "58%", color: "#03182e", opacity: 0.26 },
        { offset: "100%", color: "#0a2444", opacity: 0.08 },
      ],
    },
    // 左半背光切面: 明暗交界压在盾脊上, 交界那一侧最重, 往左缘收回去(留给环境反光)。
    {
      key: "facetShade",
      kind: "linear",
      x1: "100%",
      y1: "0%",
      x2: "0%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#020c1a", opacity: 0.62 },
        { offset: "72%", color: "#02101f", opacity: 0.4 },
        { offset: "100%", color: "#02101f", opacity: 0.12 },
      ],
    },
    // 盾心五边形: 白蓝爆点, 整枚图标的亮度峰值。
    {
      key: "core",
      kind: "radial",
      stops: [
        { offset: "0%", color: "#ffffff" },
        { offset: "42%", color: "#cfeaff" },
        { offset: "100%", color: "#3f8fd4" },
      ],
    },
  ],
  glow: { color: "#63b8f2", blur: 2.2, opacity: 0.8 },
  ink: {
    /** 外框亮边: 蓝银, 和盾面同族。 */
    rim: "#4f8fc7",
    /** 分层描边: 三层盾形靠它彼此分开。 */
    deep: "#02101f",
    /** 顶沿受光边、腰线亮侧与菱心内环。 */
    light: "#eaf7ff",
    /** 腰线的暗侧: 亮线下面压一道暗, 腰线才是"一道棱"而不是一条画上去的线。 */
    shade: "#0a2444",
    /** 双肩铆钉与菱心四向刻线: 比盾面浅一档的冰蓝, 才不会糊进盾里。 */
    accent: "#cfeaff",
    /** 左下外廓的环境反光 —— 暗面不能死黑, 否则盾的左缘会和底盘粘在一起。 */
    bounce: "#5f9fd6",
  },
};

// ── 心眼: 金 + 白 · 五枚里最亮 ────────────────────────────────────
//
// 主题色金与白。金负责"贵"、白负责"亮", 两者之间不留第三个色相 ——
// 眼底是白金渐变, 虹膜是纯金, 瞳心是纯白, 底盘压到近黑褐, 让金白整个浮起来。
// 与培育完成那枚暖橙金的区分: 这枚是**冷金(香槟色)**, 而且白的占比大得多, 底盘也更黑。

export const INSIGHT_PALETTE: EmblemPalette = {
  gradients: [
    {
      key: "plate",
      kind: "radial",
      cx: "50%",
      cy: "46%",
      r: "62%",
      stops: [
        { offset: "0%", color: "#2e2412" },
        { offset: "58%", color: "#171106" },
        { offset: "100%", color: "#070502" },
      ],
    },
    // 眼底: 左上纯白 → 右下沉金。白占大半 —— 这枚是五枚里最亮的一枚。
    {
      key: "eye",
      kind: "linear",
      x1: "10%",
      y1: "0%",
      x2: "90%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#ffffff" },
        { offset: "38%", color: "#f7e6b8" },
        { offset: "76%", color: "#c9a24a" },
        { offset: "100%", color: "#6b5220" },
      ],
    },
    // 虹膜: 心亮金 → 沿沉褐金, 球面感全靠这条。
    {
      key: "iris",
      kind: "radial",
      cx: "40%",
      cy: "30%",
      r: "78%",
      stops: [
        { offset: "0%", color: "#fffdf3" },
        { offset: "28%", color: "#ffe9a8" },
        { offset: "66%", color: "#d4a338" },
        { offset: "100%", color: "#6d4f13" },
      ],
    },
    // 瞳心透光: 纯白爆点。整枚图标的亮度峰值。
    {
      key: "core",
      kind: "radial",
      stops: [
        { offset: "0%", color: "#ffffff" },
        { offset: "40%", color: "#fff6d8" },
        { offset: "100%", color: "#ffd970", opacity: 0.2 },
      ],
    },
  ],
  glow: { color: "#ffd970", blur: 2.2, opacity: 0.72 },
  ink: {
    /** 外框亮边: 香槟金。 */
    rim: "#c9a24a",
    /** 分层描边: 外眶 / 内眶 / 虹膜三层靠它彼此分开。 */
    deep: "#150e03",
    /** 睑弧亮边、虹膜内环、瞳孔描边与眼球高光 —— 这枚的"白"全走这一个色。 */
    light: "#ffffff",
    /** 外眶暗底与下睑暗面。 */
    shade: "#241a08",
    /** 上下那两道大弧(眉弧 / 承光弧)。 */
    accent: "#ffe9a8",
    /** 虹膜纤维: 比虹膜沉两档的褐金 —— 亮了就变成放射线, 沉了才是"深度"。 */
    fiber: "#8a641c",
    /** 下眶环境反光: 近黑底盘上把眼的下缘重新切出来。 */
    bounce: "#b98f34",
  },
};
