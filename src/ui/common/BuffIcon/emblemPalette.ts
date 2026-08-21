// 厚涂版培育 BUFF 图标的配色层 —— 纯数据, 不含 React, 不含 CSS。
//
// ★ 为什么配色写死在这里而不是 currentColor: 线稿版靠调用方给 color, 厚涂版不行。
//   厚涂的立体感来自「同一块面上明面/暗面/高光三档颜色的相对关系」, 单一变量替换不了三档;
//   而且对 BUFF 图标来说**色相本身就是语义**(冷=进行中 / 暖=已完成), 不该让调用方改掉。
// ★ 两枚图标各持一套**独立复合配色**, 不是同一色相的深浅梯度:
//   培育中 = 深靛底 + 墨蓝土 + 青绿芽(全冷调, 只留一个亮点);
//   培育完成 = 深赭底 + 金橙瓣 + 黄绿尖 + 品红托带(全暖调, 整体推亮)。
//   这样即使去掉形状, 光看两块色斑也能分辨 —— 这是小尺寸下最快的区分信号。
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
export type EmblemPalette = {
  gradients: GradientSpec[];
  /** 外发光的颜色与强度 —— 「光亮」这一维的主要载体。 */
  glow: { color: string; blur: number; opacity: number };
  /** 描边 / 亮边 / 实色点缀。 */
  ink: Record<string, string>;
};

// ── 培育中: 冷 · 暗 · 内敛 ────────────────────────────────────────
//
// 亮度刻意压低: 只有胚珠与花苞是亮点, 其余都在中低调。
// 「还没成」这件事首先是**暗**, 其次才是「进度弧没走满」。
//
// ★ 这一版把土也收进冷色系(墨蓝而不是暖褐): 上一版的褐土夹在深靛底盘和青绿芽中间,
//   三个色相各说各的, 缩到 32px 只剩一片脏。整枚统一成「冷调 + 一个亮点」之后,
//   与完成态那枚「暖调 + 满屏亮」的对比反而更狠 —— 色相差没丢, 只是搬到了两枚之间。

export const CULTIVATING_PALETTE: EmblemPalette = {
  gradients: [
    // 底盘: 中心略亮、边缘沉下去, 做出一个凹的坑。
    {
      key: "plate",
      kind: "radial",
      cx: "50%",
      cy: "40%",
      r: "62%",
      stops: [
        { offset: "0%", color: "#1e2c45" },
        { offset: "58%", color: "#141d2b" },
        { offset: "100%", color: "#090e15" },
      ],
    },
    // 土台: 近黑的墨蓝实体, 上沿略提亮 —— 它是暗底, 不是主角。
    {
      key: "soil",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#172234" },
        { offset: "45%", color: "#0d141f" },
        { offset: "100%", color: "#05080d" },
      ],
    },
    // 叶面: 叶根深青 → 叶尖亮青绿。一片叶子内部就把明暗分完。
    {
      key: "leaf",
      kind: "linear",
      x1: "0%",
      y1: "100%",
      x2: "80%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#17605f" },
        { offset: "45%", color: "#2fa79a" },
        { offset: "100%", color: "#7ef0c8" },
      ],
    },
    // 茎与花苞: 比叶面沉一档, 免得竖线抢过叶片的剪影。
    {
      key: "stem",
      kind: "linear",
      y1: "100%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#1c6a63" },
        { offset: "60%", color: "#3fbfae" },
        { offset: "100%", color: "#8ff5cd" },
      ],
    },
    // 胚珠热点: 整枚图标唯一的高亮源。
    {
      key: "core",
      kind: "radial",
      stops: [
        { offset: "0%", color: "#eafff8" },
        { offset: "40%", color: "#7ef0c8", opacity: 0.9 },
        { offset: "100%", color: "#4fd8c8", opacity: 0 },
      ],
    },
  ],
  glow: { color: "#4fd8c8", blur: 1.6, opacity: 0.55 },
  ink: {
    /** 外框的亮边。这一版它是图标的边界本身, 所以要比上一版更亮 —— 暗场景图上,
        边界不够亮就等于没有边界。 */
    rim: "#557ba3",
    /** 地平线亮边: 被芽光反照的冷色细线。 */
    soilLit: "#4fd8c8",
    /** 叶脉: 压在叶面上的暗线, 用色比叶根还深一档。 */
    vein: "#08302f",
    /** 叶缘亮边、花苞高光与胚珠实心点。 */
    hilite: "#eafff8",
  },
};

// ── 培育完成: 暖 · 亮 · 外放 ──────────────────────────────────────
//
// 和培育中并排时, **亮度差**是比形状更快的区分信号, 所以这枚整体推高一档,
// 外发光半径和强度都明显大于培育中。

export const CULTIVATED_PALETTE: EmblemPalette = {
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
    /** 外框亮边: 与培育中的冷银对位的暖金, 两态连框都不同色。 */
    rim: "#c9903a",
    /** 瓣尖亮边。 */
    petalLit: "#fff6d8",
    /** 瓣根暗面(压在瓣与花心的交界)。 */
    petalShade: "#7a2f08",
    /** 完成环: 满圈闭合。 */
    arc: "#ffd166",
    arcTrack: "#4a2c0e",
    /** 结算勾记。 */
    check: "#fffdf2",
    hilite: "#fff6d8",
  },
};
