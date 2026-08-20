// ds / BUFF 图标配色层 —— 纯数据, 不含 React, 不含 CSS。
//
// ★ 为什么配色写死在这里而不是 currentColor: 厚涂的立体感来自「同一块面上
//   明面/暗面/高光三档颜色的相对关系」, 单一变量替换不了三档;
//   而且对 BUFF 图标来说**色相本身就是语义**(冷=进行中 / 暖=已完成), 不该让调用方改掉。
// ★ 五枚图标各持一套**独立复合配色**, 不是同一色相的深浅梯度:
//   培育中 = 深靛底 + 暖褐壳 + 青绿芽(冷·暗·内敛);
//   培育完成 = 深赭底 + 金橙瓣 + 黄绿尖(暖·亮·外放);
//   锋利 = 深钢蓝底 + 银白刃 + 金星(锐·冷);
//   心眼 = 深紫底 + 品红紫虹膜 + 金白棱光(聚·艳);
//   护盾 = 深青底 + 青蓝盾 + 亮白核(沉·稳)。
//   这样即使去掉形状, 光看五块色斑也能分辨 —— 小尺寸下最快的区分信号。
// ★ v6 外框规则: 满幅圆角方框的**外亮边**(ink.rim)是图标在暗场景上的边界本身,
//   所以比 v5 的深色 rim 整体提亮一档, 并按色相走 —— 连框都参与语义区分。
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

// ── 锋利: 锐 · 冷 ────────────────────────────────────────────────

export const SHARP_PALETTE: BuffPalette = {
  gradients: [
    {
      key: "plate",
      kind: "radial",
      cx: "50%",
      cy: "40%",
      r: "62%",
      stops: [
        { offset: "0%", color: "#1d3148" },
        { offset: "58%", color: "#13202f" },
        { offset: "100%", color: "#0a1119" },
      ],
    },
    // 刀身: 亮面在左(受光), 暗面在右 —— 银白到钢蓝, 刃口一侧最亮。
    {
      key: "blade",
      kind: "linear",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#f8fcff" },
        { offset: "55%", color: "#c7d6e4" },
        { offset: "100%", color: "#8fa6bc" },
      ],
    },
    // 刀镡与柄: 深钢蓝, 比刀身沉一档。
    {
      key: "hilt",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#3a5674" },
        { offset: "100%", color: "#16222f" },
      ],
    },
    // 剑尖金星: 聚焦点。
    {
      key: "star",
      kind: "radial",
      stops: [
        { offset: "0%", color: "#fff6d8" },
        { offset: "45%", color: "#ffd166", opacity: 0.9 },
        { offset: "100%", color: "#ffb347", opacity: 0 },
      ],
    },
  ],
  glow: { color: "#dcecff", blur: 1.8, opacity: 0.6 },
  ink: {
    /** 外框亮边: 冷银, 与刀身同一系。 */
    rim: "#6b93b8",
    /** 刀身外轮廓。 */
    bladeRim: "#2e4154",
    /** 刃口亮边。 */
    edge: "#ffffff",
    /** 剑脊线。 */
    ridge: "#7e97ad",
    /** 柄头金珠。 */
    gold: "#ffd166",
    goldLit: "#fff3b0",
    /** 剑尖聚焦实心点。 */
    hilite: "#fff3cd",
  },
};

// ── 心眼: 聚 · 艳 ────────────────────────────────────────────────

export const MIND_PALETTE: BuffPalette = {
  gradients: [
    {
      key: "plate",
      kind: "radial",
      cx: "50%",
      cy: "42%",
      r: "62%",
      stops: [
        { offset: "0%", color: "#2a2145" },
        { offset: "58%", color: "#191331" },
        { offset: "100%", color: "#0d0918" },
      ],
    },
    // 金属环带: 上亮下暗的紫铜感, 做出环的圆柱厚度。
    {
      key: "ring",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#a97cf0" },
        { offset: "55%", color: "#6e3fc4" },
        { offset: "100%", color: "#3a1d75" },
      ],
    },
    // 虹膜: 品红紫到深紫。
    {
      key: "iris",
      kind: "radial",
      cx: "50%",
      cy: "50%",
      r: "62%",
      stops: [
        { offset: "0%", color: "#e0a8ff" },
        { offset: "55%", color: "#b06ef2" },
        { offset: "100%", color: "#7d35e0" },
      ],
    },
    // 瞳孔聚焦点。
    {
      key: "pupil",
      kind: "radial",
      stops: [
        { offset: "0%", color: "#fff6d8" },
        { offset: "45%", color: "#ffdf7e", opacity: 0.9 },
        { offset: "100%", color: "#ffb347", opacity: 0 },
      ],
    },
    // 洞察棱光: 金白向上。
    {
      key: "beam",
      kind: "linear",
      y1: "100%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#ffe066", opacity: 0.55 },
        { offset: "100%", color: "#fff6d8", opacity: 0.05 },
      ],
    },
  ],
  glow: { color: "#b06ef2", blur: 2.2, opacity: 0.75 },
  ink: {
    /** 外框亮边: 紫罗兰, 与眼同系。 */
    rim: "#8a6fd0",
    /** 环带左上受光弧。 */
    ringLit: "#e0c4ff",
    /** 眼窝底: 环带内圆挖出的深色(比虹膜再沉一档)。 */
    socket: "#170b2e",
    /** 瞳孔实心与高光。 */
    pupilSolid: "#3d1266",
    hilite: "#fff3cd",
  },
};

// ── 护盾: 沉 · 稳 ────────────────────────────────────────────────

export const SHIELD_PALETTE: BuffPalette = {
  gradients: [
    {
      key: "plate",
      kind: "radial",
      cx: "50%",
      cy: "42%",
      r: "62%",
      stops: [
        { offset: "0%", color: "#16384a" },
        { offset: "58%", color: "#0e2531" },
        { offset: "100%", color: "#071318" },
      ],
    },
    // 盾面: 左上受光的青蓝。
    {
      key: "face",
      kind: "radial",
      cx: "38%",
      cy: "30%",
      r: "80%",
      stops: [
        { offset: "0%", color: "#9fe4ff" },
        { offset: "55%", color: "#56bde8" },
        { offset: "100%", color: "#2a8fc4" },
      ],
    },
    // 核心: 亮白热点。
    {
      key: "core",
      kind: "radial",
      stops: [
        { offset: "0%", color: "#ffffff" },
        { offset: "45%", color: "#dff4ff", opacity: 0.9 },
        { offset: "100%", color: "#9fe4ff", opacity: 0 },
      ],
    },
  ],
  glow: { color: "#56bde8", blur: 2, opacity: 0.7 },
  ink: {
    /** 外框亮边: 青蓝, 与盾同系。 */
    rim: "#4a9cc0",
    /** 盾体外描边。 */
    faceRim: "#155d85",
    /** 核心描边与光芒。 */
    coreRim: "#2f9fd8",
    /** 盾面受光高光。 */
    hilite: "#ffffff",
  },
};
