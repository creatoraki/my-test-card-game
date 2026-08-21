// ds / BUFF 图标配色层 —— 纯数据, 不含 React, 不含 CSS。
//
// ★ 为什么配色写死在这里而不是 currentColor: 厚涂的立体感来自「同一块面上
//   明面/暗面/高光三档颜色的相对关系」, 单一变量替换不了三档;
//   而且对 BUFF 图标来说**色相本身就是语义**(冷=进行中 / 暖=已完成), 不该让调用方改掉。
// ★ 五枚图标各持一套**独立复合配色**, 不是同一色相的深浅梯度:
//   培育中 = 深靛底 + 暖褐壳 + 青绿芽(冷·暗·内敛);
//   培育完成 = 深赭底 + 金橙瓣 + 黄绿尖(暖·亮·外放);
//   锋利 = 冰蓝底 + 钢青双面 + 霓虹红血(锐·冷);
//   心眼 = 深紫黑底 + 金白双环虹膜 + 香槟金光芒(聚·艳);
//   护盾 = 深蓝底 + 霓虹青能量线 + 白心宝石(沉·稳)。
//   这样即使去掉形状, 光看五块色斑也能分辨 —— 小尺寸下最快的区分信号。
// ★ v9 外框规则: 满幅圆角方框的**外亮边**(ink.rim)是图标在暗场景上的边界本身,
//   按色相走 —— 连框都参与语义区分; 战斗三态的发光与饱和整体比 v8 推高一档,
//   「霓虹宝石徽章」感主要来自 高饱和渐变 + 宝石白心 + 霓虹能量线 三件套。
// ⚠ 这里只描述渐变的「形状与色标」, 具体的 <defs> id 由组件在运行时拼(useId), 不进这一层。

export type GradientStop = {
  offset: string;
  color: string;
  /** 省略表示不透明。 */
  opacity?: number;
};

/** 线性渐变: 默认自上而下(受光在上), 需要斜光时自己给 x1/y1/x2/y2。 */
export type LinearSpec = {
  /** 在同一枚图标内唯一; 会被拼进 defs 的 id。 */
  key: string;
  kind: "linear";
  x1?: string;
  y1?: string;
  x2?: string;
  y2?: string;
  stops: GradientStop[];
};

/** 径向渐变: 用来做底盘的凹陷感和中心热点。 */
export type RadialSpec = {
  key: string;
  kind: "radial";
  cx?: string;
  cy?: string;
  r?: string;
  fx?: string;
  fy?: string;
  stops: GradientStop[];
};

export type GradientSpec = LinearSpec | RadialSpec;

/** 一枚图标的完整配色: 一组渐变 + 若干实色。 */
export type BuffPalette = {
  gradients: GradientSpec[];
  /** 外发光的颜色与强度 —— 「光亮」这一维的主要载体。 */
  glow: { color: string; blur: number; opacity: number };
  /** 描边 / 亮边 / 实色点缀。 */
  ink: Record<string, string>;
};

// ── 培育中: 冷 · 暗 · 内敛 ────────────────────────────────────────
//
// 亮度刻意压低: 只有芽尖与胚点是亮点, 其余都在中低调。
// 「还没成」这件事首先是**暗**, 其次才是「进度弧没走满」。

export const GROWING_PALETTE: BuffPalette = {
  gradients: [
    {
      key: "plate",
      kind: "radial",
      cx: "50%",
      cy: "42%",
      r: "62%",
      stops: [
        { offset: "0%", color: "#1c2940" },
        { offset: "58%", color: "#141d2b" },
        { offset: "100%", color: "#0b1119" },
      ],
    },
    // 种子壳: 顶部受光的暖褐, 越往下越沉。
    {
      key: "seed",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#a5805a" },
        { offset: "45%", color: "#7a5a3a" },
        { offset: "100%", color: "#3f2a18" },
      ],
    },
    // 嫩芽: 青绿到荧光绿, 顶端最亮。
    {
      key: "sprout",
      kind: "linear",
      y1: "100%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#2e9a8c" },
        { offset: "45%", color: "#4fd8c8" },
        { offset: "100%", color: "#89f5a8" },
      ],
    },
    // 芽尖热点: 整枚图标唯一的高亮源。
    {
      key: "tip",
      kind: "radial",
      stops: [
        { offset: "0%", color: "#e8fff6" },
        { offset: "40%", color: "#89f5a8", opacity: 0.9 },
        { offset: "100%", color: "#4fd8c8", opacity: 0 },
      ],
    },
  ],
  glow: { color: "#4fd8c8", blur: 1.6, opacity: 0.55 },
  ink: {
    /** 外框亮边: 冷银, 暗场景上图标边界的保底。 */
    rim: "#5f86b0",
    /** 种子壳右半受光边。 */
    seedLit: "#c9a37a",
    /** 壳中央裂缝(暗)。 */
    crack: "#241810",
    /** 进度弧走过的部分。 */
    arc: "#4fd8c8",
    /** 进度弧没走到的部分(留一道暗轨, 让「未满」读得出来)。 */
    arcTrack: "#233248",
    /** 芽尖亮边与游标实心点。 */
    hilite: "#e8fff6",
    /** 须根。 */
    root: "#7a5a3a",
  },
};

// ── 培育完成: 暖 · 亮 · 外放 ──────────────────────────────────────
//
// 和培育中并排时, **亮度差**是比形状更快的区分信号, 所以这枚整体推高一档,
// 外发光半径和强度都明显大于培育中。

export const DONE_PALETTE: BuffPalette = {
  gradients: [
    {
      key: "plate",
      kind: "radial",
      cx: "50%",
      cy: "46%",
      r: "62%",
      stops: [
        { offset: "0%", color: "#4a2c0e" },
        { offset: "56%", color: "#2b1a08" },
        { offset: "100%", color: "#120a03" },
      ],
    },
    // 外层花瓣: 瓣根金橙 → 瓣尖荧光黄绿。冷暖在一片瓣内部就分完了。
    {
      key: "petal",
      kind: "linear",
      y1: "100%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#ff7a3d" },
        { offset: "40%", color: "#ffb347" },
        { offset: "82%", color: "#ffe07a" },
        { offset: "100%", color: "#d8f329" },
      ],
    },
    // 内层小瓣: 压在外瓣下面, 整体更沉一档, 做出叠压层次。
    {
      key: "petalInner",
      kind: "linear",
      y1: "100%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#a1420f" },
        { offset: "60%", color: "#e8853a" },
        { offset: "100%", color: "#ffc85e" },
      ],
    },
    // 花心: 暖白爆点。
    {
      key: "core",
      kind: "radial",
      stops: [
        { offset: "0%", color: "#fffdf2" },
        { offset: "35%", color: "#fff6d8" },
        { offset: "70%", color: "#ffc85e", opacity: 0.85 },
        { offset: "100%", color: "#ff7a3d", opacity: 0 },
      ],
    },
    // 托带: 一抹品红做冷暖对冲, 免得整枚糊成一团黄。
    {
      key: "crest",
      kind: "linear",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#ff5da2", opacity: 0.15 },
        { offset: "50%", color: "#ff5da2" },
        { offset: "100%", color: "#ff5da2", opacity: 0.15 },
      ],
    },
  ],
  glow: { color: "#ffb347", blur: 2.6, opacity: 0.9 },
  ink: {
    /** 外框亮边: 与培育中的冷银对位的暖金 —— 两态连框都不同色。 */
    rim: "#d09a4a",
    /** 瓣尖亮边。 */
    petalLit: "#fff6d8",
    /** 瓣根暗面(压在瓣与花心的交界)。 */
    petalShade: "#7a2f08",
    /** 完成环: 满圈闭合。 */
    arc: "#ffd166",
    arcTrack: "#4a2c0e",
    /** 环外指针与托带上的高光。 */
    hilite: "#fff6d8",
  },
};

// ── 锋利: 冷钢 · 霓虹红血 · 极高对比 ──────────────────────────────
//
// 主题色钢青。性格是**对比**而不是亮度: 镞面背光侧压到近黑, 右刃口给到近白,
// 中间几乎不设过渡档。血红是**落点**不是主色 —— 血只出现在尖端与血槽,
// 与冷钢的面积比约 10:1; 若是整枚转暗红, 并排时护盾(全蓝)心眼(金白)就成了
// 红蓝金三原色, 而且暗红压在暗场景图上会直接糊掉。
// ★ v9 霓虹化: 底盘与钢面整体提亮一档(冷钢蓝更饱和), 血槽内嵌一道**霓虹红线**
//   (bloodGlow), 收口宝石白心烧到赤红, 外发光改冰蓝(glow) ——
//   血分两档(blood 主档 + 渐变暗档)依然是「湿的」。

export const SHARP_PALETTE: BuffPalette = {
  gradients: [
    // 底盘: 中心略亮的一个坑, 冷钢灰蓝。
    {
      key: "plate",
      kind: "radial",
      cx: "50%",
      cy: "42%",
      r: "62%",
      stops: [
        { offset: "0%", color: "#2a4160" },
        { offset: "55%", color: "#16233a" },
        { offset: "100%", color: "#050a12" },
      ],
    },
    // 第一层 外廓: 上亮下暗的暗钢。最外那层本来就该是最暗的。
    {
      key: "outer",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#6d88a6" },
        { offset: "45%", color: "#2a3d54" },
        { offset: "100%", color: "#0c1522" },
      ],
    },
    // 第二层 左主面(背光): 一路压暗, 给环境反光留位置。
    {
      key: "faceL",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#38506b" },
        { offset: "60%", color: "#1a2b40" },
        { offset: "100%", color: "#0a1420" },
      ],
    },
    // 第二层 右主面(受光): 光源在右上, 高光全压在这一面。
    {
      key: "faceR",
      kind: "linear",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#7e9cba" },
        { offset: "45%", color: "#c8def2" },
        { offset: "80%", color: "#f2f8ff" },
        { offset: "100%", color: "#ffffff" },
      ],
    },
    // 第三层 内芯: 再推亮一档的亮钢。
    {
      key: "core",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#f0f7ff" },
        { offset: "55%", color: "#a9c2da" },
        { offset: "100%", color: "#5a7696" },
      ],
    },
    // 血槽: 凹槽底部积着一层暗血 —— 钢青渐渐转暗红, 这是「血槽」的字面意思。
    {
      key: "fuller",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#0a121c" },
        { offset: "45%", color: "#1c1216" },
        { offset: "100%", color: "#541019" },
      ],
    },
    // 尖端血渍: 上缘薄(透出钢) → 下缘厚(近黑红)。血是积下来的, 所以下面重。
    {
      key: "blood",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#ff5566" },
        { offset: "42%", color: "#c21a2c" },
        { offset: "100%", color: "#45080f" },
      ],
    },
    // 收口宝石: 全冷画面里唯一的暖, 从白心烧到赤红。
    {
      key: "gem",
      kind: "radial",
      stops: [
        { offset: "0%", color: "#ffffff" },
        { offset: "30%", color: "#ffdcc9" },
        { offset: "68%", color: "#ff5d45" },
        { offset: "100%", color: "#a81028" },
      ],
    },
    // 套筒: 比镞身沉一档的青铜钢, 免得横向的套筒抢过竖向的镞身。
    {
      key: "socket",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#9db8d2" },
        { offset: "45%", color: "#465f7a" },
        { offset: "100%", color: "#0f1a28" },
      ],
    },
  ],
  glow: { color: "#6fc3ff", blur: 2.2, opacity: 0.85 },
  ink: {
    /** 外框亮边: 冰蓝, 与钢面同族更霓虹一档。 */
    rim: "#8fd0ff",
    /** 分层描边: 各层镞形与套筒靠它彼此分开。 */
    deep: "#04070d",
    /** 右刃口亮边与宝石内菱 —— 整枚图标的亮度峰值就在这条线上。 */
    light: "#ffffff",
    /** 左刃口暗边与背光面。 */
    shade: "#0e1a28",
    /** 射线、碎片与套筒能量节点。 */
    accent: "#bfe6ff",
    /** 血流主档: 沿血槽下淌的那道。 */
    blood: "#d91f35",
    /** 血槽霓虹能量线: 槽内那道发光的红线。 */
    bloodGlow: "#ff5d70",
    /** 左下环境反光: 背光面不死黑, 左缘才不会和底盘粘在一起。 */
    bounce: "#9cc4e8",
  },
};

// ── 心眼: 金 + 白 · 五枚里最亮 ────────────────────────────────────
//
// 主题色金与白。金负责「贵」、白负责「亮」, 两者之间不留第三个色相 ——
// 眼底是白金渐变, 虹膜是纯金, 瞳心是纯白, 底盘压到近黑褐, 让金白整个浮起来。
// 与培育完成那枚暖橙金的区分: 这枚是**冷金(香槟色)**, 白的占比大得多, 底盘也更黑。
// ★ v9 霓虹化: 底盘从深褐转**深紫黑**(与培育完成的暖褐底拉开), 三角加一层
//   中三角金白渐变主体 + 双层虹膜(外金环 iris / 内白环 irisInner),
//   瞳心透光加强, 顶点宝石白到金, 外发光香槟金。

export const MIND_PALETTE: BuffPalette = {
  gradients: [
    {
      key: "plate",
      kind: "radial",
      cx: "50%",
      cy: "46%",
      r: "62%",
      stops: [
        { offset: "0%", color: "#3a2a55" },
        { offset: "55%", color: "#1f1433" },
        { offset: "100%", color: "#0a0512" },
      ],
    },
    // 中三角(眼底主体): 左上纯白 → 右下沉金。白占大半 —— 五枚里最亮的一枚。
    {
      key: "triMid",
      kind: "linear",
      x1: "10%",
      y1: "0%",
      x2: "90%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#fffdf4" },
        { offset: "38%", color: "#f7e4b0" },
        { offset: "74%", color: "#d8a94f" },
        { offset: "100%", color: "#7a5420" },
      ],
    },
    // 右半受光切面: 一层极淡的白, 从顶往下收。
    {
      key: "facetLit",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#ffffff", opacity: 0.2 },
        { offset: "100%", color: "#ffffff", opacity: 0 },
      ],
    },
    // 左半背光切面: 金字塔背光的一面, 靠它和受光面切出体积。
    {
      key: "facetShade",
      kind: "linear",
      x1: "100%",
      y1: "0%",
      x2: "0%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#1a0f05", opacity: 0.35 },
        { offset: "100%", color: "#1a0f05", opacity: 0.08 },
      ],
    },
    // 虹膜外环: 心亮金 → 沿沉褐金, 球面感全靠这条。
    {
      key: "iris",
      kind: "radial",
      cx: "40%",
      cy: "32%",
      r: "78%",
      stops: [
        { offset: "0%", color: "#fffdf0" },
        { offset: "30%", color: "#ffe9a8" },
        { offset: "66%", color: "#e0b24a" },
        { offset: "100%", color: "#7a5410" },
      ],
    },
    // 虹膜内环: 比外环再推亮一档的白金 —— 双层环的亮度差让眼球「鼓」起来。
    {
      key: "irisInner",
      kind: "radial",
      cx: "42%",
      cy: "34%",
      r: "80%",
      stops: [
        { offset: "0%", color: "#ffffff" },
        { offset: "55%", color: "#fff3cf" },
        { offset: "100%", color: "#efd488" },
      ],
    },
    // 瞳心透光: 纯白爆点。整枚图标的亮度峰值。
    {
      key: "pupilGlow",
      kind: "radial",
      stops: [
        { offset: "0%", color: "#ffffff" },
        { offset: "45%", color: "#fff2c4" },
        { offset: "100%", color: "#ffd96e", opacity: 0.3 },
      ],
    },
    // 顶点宝石: 三角尖的收口, 白到金。
    {
      key: "apex",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#ffffff" },
        { offset: "55%", color: "#ffe7a4" },
        { offset: "100%", color: "#d8a94f" },
      ],
    },
    // 托带: 沉金, 把整枚压稳。
    {
      key: "banner",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#a37a2e" },
        { offset: "55%", color: "#6e5420" },
        { offset: "100%", color: "#33260c" },
      ],
    },
  ],
  glow: { color: "#ffd970", blur: 2.4, opacity: 0.85 },
  ink: {
    /** 外框亮边: 香槟金。 */
    rim: "#e8c879",
    /** 分层描边: 外三角 / 中三角 / 虹膜三层靠它彼此分开。 */
    deep: "#160f04",
    /** 右缘亮边、虹膜内环亮线、瞳孔描边与瞳心透光 —— 这枚的「白」全走这一个色。 */
    light: "#ffffff",
    /** 外三角暗底与左半背光。 */
    shade: "#241a09",
    /** 光芒射线、托带上缘与托带中央小菱。 */
    accent: "#ffe7a4",
    /** 虹膜放射纹: 比虹膜沉两档的褐金 —— 亮了就变成放射线, 沉了才是「深度」。 */
    fiber: "#8c661f",
    /** 左下环境反光: 近黑底盘上把中三角的左沿重新切出来。 */
    bounce: "#c9a049",
  },
};

// ── 护盾: 全蓝 · 体量最大 ─────────────────────────────────────────
//
// 主题色蓝。整枚统一在海军蓝 → 天青蓝 → 白蓝的一条明度阶上, 不掺暖色 ——
// 蓝这件事要成立, 靠的是「整枚只有蓝」, 掺一点金就会变回靛金对冲。
// 同心圆之间的明暗关系: 外环最暗 → 盾面中亮 → 内盘最亮 → 盾心宝石爆点, 一路往里推。
// ★ v9 霓虹化: 外环加一道**霓虹青细环**(ink.energy 一族), 盾面能量导管与
//   盾心辉光环都用霓虹青, 盾心六边形换成**菱形宝石**(core 白心爆点),
//   外发光改电光蓝 —— 冷蓝底的唯一暖色只有宝石白心, 蓝才立得住。

export const SHIELD_PALETTE: BuffPalette = {
  gradients: [
    {
      key: "plate",
      kind: "radial",
      cx: "50%",
      cy: "44%",
      r: "62%",
      stops: [
        { offset: "0%", color: "#16406e" },
        { offset: "55%", color: "#0a1e3c" },
        { offset: "100%", color: "#030a14" },
      ],
    },
    // 外环: 最外的一层, 暗底金属环。
    {
      key: "rim",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#2a5a94" },
        { offset: "50%", color: "#10345e" },
        { offset: "100%", color: "#061226" },
      ],
    },
    // 盾面: 底部深蓝 → 顶部亮蓝。上亮下暗, 与右上光源一致。
    {
      key: "face",
      kind: "linear",
      y1: "100%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#0c2e58" },
        { offset: "36%", color: "#1e63a6" },
        { offset: "74%", color: "#4fa8e8" },
        { offset: "100%", color: "#bce8ff" },
      ],
    },
    // 上缘受光切面: 盖在盾面上沿的月牙亮片。切面而不是渐变 —— 金属靠「面」分明暗。
    {
      key: "facetLit",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#e6f8ff", opacity: 0.55 },
        { offset: "58%", color: "#7fc2f5", opacity: 0.2 },
        { offset: "100%", color: "#7fc2f5", opacity: 0 },
      ],
    },
    // 左半背光切面: 明暗交界压在竖中线上, 交界那一侧最重。
    {
      key: "facetShade",
      kind: "linear",
      x1: "100%",
      y1: "0%",
      x2: "0%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#00101f", opacity: 0.5 },
        { offset: "100%", color: "#00101f", opacity: 0.12 },
      ],
    },
    // 内盘: 比盾面再推亮一档, 嵌套的第三层永远是最亮的那层。
    {
      key: "innerShield",
      kind: "linear",
      y1: "100%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#1a4e84" },
        { offset: "45%", color: "#3f92d4" },
        { offset: "85%", color: "#93d4ff" },
        { offset: "100%", color: "#eaf9ff" },
      ],
    },
    // 盾心宝石: 白心爆点, 整枚图标的亮度峰值。
    {
      key: "core",
      kind: "radial",
      stops: [
        { offset: "0%", color: "#ffffff" },
        { offset: "38%", color: "#dff4ff" },
        { offset: "75%", color: "#5fc2f5" },
        { offset: "100%", color: "#1a5ca0" },
      ],
    },
  ],
  glow: { color: "#3fd4ff", blur: 2.4, opacity: 0.9 },
  ink: {
    /** 外框亮边: 冰蓝, 和盾面同族。 */
    rim: "#6fc4f5",
    /** 分层描边: 各层圆与宝石靠它彼此分开。 */
    deep: "#00101f",
    /** 受光边、内盘亮线、宝石内菱与白心。 */
    light: "#eaf9ff",
    /** 背光切面与暗部。 */
    shade: "#0a2140",
    /** 外环细环线、刻线与能量节点亮心。 */
    accent: "#cfeaff",
    /** 霓虹青: 能量导管、盾心辉光环、力场内弧与节点外圈细环。 */
    energy: "#37d8ff",
    /** 外环左下环境反光 —— 暗环不能死黑, 否则盾的左缘会和底盘粘在一起。 */
    bounce: "#63a8e8",
  },
};
