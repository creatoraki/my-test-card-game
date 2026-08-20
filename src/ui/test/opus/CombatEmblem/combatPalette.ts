// 战斗三态 BUFF 图标的配色层 —— 纯数据, 不含 React, 不含 CSS。
//
// ★ 类型直接复用厚涂版培育图标的配色协议(EmblemPalette): 五枚图标共用一套「渐变 + 发光 + 实色」
//   的描述方式, 才谈得上同一套 BUFF 图标。
// ★ 三枚各持一套**独立复合配色**, 不是同色相深浅。去掉形状光看色斑也要能分辨:
//     锋利 = 钢青底 + 银白刃 + 一点赤红火花(冷 · 高对比 · 极亮的一条边);
//     护盾 = 深靛底 + 暖金盾 + 青蓝能量场(冷暖对冲 · 中亮度 · 满框环);
//     心眼 = 深紫底 + 紫青虹膜 + 金色额饰(紫 · 中低亮度 · 中心一个亮点)。
// ★ 亮度也当区分维度用: 锋利靠一条近白的刃口拿最高亮度峰值, 护盾整体最"厚", 心眼整体最沉。
// ⚠ 配色写死不吃 currentColor: 厚涂的立体感来自同一块面上明面/暗面/高光**三档的相对关系**,
//   单一变量替换不了三档; 而且色相本身就是语义, 不该让调用方改掉。

import type { EmblemPalette } from "../CultivationEmblem/emblemPalette";

export type { EmblemPalette, GradientSpec } from "../CultivationEmblem/emblemPalette";

// ── 锋利: 冷 · 硬 · 极高对比 ──────────────────────────────────────
//
// 这一枚的性格是**对比**而不是亮度: 底盘压到近黑, 刃口给到近白, 中间几乎没有过渡档。
// 一点赤红只出现在火花上 —— 全冷的画面里那一点暖是整枚图标的视觉落点。

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
    // 刃身: 左下深钢 → 右上近白。一片刃内部就把明暗分完, 光源在右上。
    {
      key: "blade",
      kind: "linear",
      x1: "10%",
      y1: "100%",
      x2: "85%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#33455a" },
        { offset: "38%", color: "#7e97b1" },
        { offset: "72%", color: "#cfe2f5" },
        { offset: "100%", color: "#ffffff" },
      ],
    },
    // 磨刀台: 近黑的冷灰实体, 上沿略提亮 —— 它是暗底, 不是主角。
    {
      key: "stone",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#1d2836" },
        { offset: "50%", color: "#0f151d" },
        { offset: "100%", color: "#05070a" },
      ],
    },
    // 火花: 全冷画面里唯一的暖, 从白心烧到赤红再散掉。
    {
      key: "spark",
      kind: "radial",
      stops: [
        { offset: "0%", color: "#ffffff" },
        { offset: "35%", color: "#ffe9c2" },
        { offset: "72%", color: "#ff6a4d", opacity: 0.85 },
        { offset: "100%", color: "#ff3b2f", opacity: 0 },
      ],
    },
  ],
  glow: { color: "#bcd9ff", blur: 1.8, opacity: 0.7 },
  ink: {
    /** 外框亮边: 冷银, 与培育中的冷银同族但更硬一档。 */
    rim: "#7f9cbd",
    /** 刃口亮边 —— 整枚图标的亮度峰值就在这条线上。 */
    edge: "#ffffff",
    /** 刃背暗面。 */
    shade: "#0d1520",
    /** 血槽: 压在刃身中轴的暗线。 */
    fuller: "#2b3b4f",
    /** 台面亮边与风刃。 */
    stoneLit: "#8fb6d8",
    wind: "#cfe2f5",
  },
};

// ── 护盾: 冷底 · 暖主体 · 满框环 ──────────────────────────────────
//
// 三枚里"最厚"的一枚: 盾面用饱和的金橙做实体感, 底盘用深靛压住, 外圈能量场给青蓝 ——
// 冷暖对冲让盾面从底盘上跳出来, 而不是靠单纯提亮。

export const WARD_PALETTE: EmblemPalette = {
  gradients: [
    {
      key: "plate",
      kind: "radial",
      cx: "50%",
      cy: "44%",
      r: "62%",
      stops: [
        { offset: "0%", color: "#16294a" },
        { offset: "56%", color: "#0d1729" },
        { offset: "100%", color: "#050912" },
      ],
    },
    // 盾面: 底部深赭 → 顶部亮金。上亮下暗, 与右上光源一致。
    {
      key: "shield",
      kind: "linear",
      y1: "100%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#6b3d0d" },
        { offset: "38%", color: "#c07f22" },
        { offset: "78%", color: "#f2b64a" },
        { offset: "100%", color: "#ffe3a0" },
      ],
    },
    // 能量扫带: 中段青蓝、两端散掉 —— 冷色压在暖盾面上, 是这枚的对冲点。
    {
      key: "band",
      kind: "linear",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#63d5ff", opacity: 0 },
        { offset: "50%", color: "#a8ecff", opacity: 0.85 },
        { offset: "100%", color: "#63d5ff", opacity: 0 },
      ],
    },
    // 盾心亮点。
    {
      key: "core",
      kind: "radial",
      stops: [
        { offset: "0%", color: "#fffaf0" },
        { offset: "38%", color: "#ffe3a0" },
        { offset: "72%", color: "#f2b64a", opacity: 0.8 },
        { offset: "100%", color: "#c07f22", opacity: 0 },
      ],
    },
  ],
  glow: { color: "#ffc65e", blur: 2.2, opacity: 0.8 },
  ink: {
    /** 外框亮边: 暖金, 和盾面同族。 */
    rim: "#b8862f",
    /** 盾面受光边。 */
    edge: "#fff3d0",
    /** 盾面暗侧与盾脊交界。 */
    shade: "#4a2708",
    /** 外圈六边能量场。 */
    field: "#63d5ff",
    fieldTrack: "#1b3450",
    /** 徽记暗环。 */
    crest: "#5c3210",
    hilite: "#fffaf0",
  },
};

// ── 心眼: 沉 · 紫 · 中心一个亮点 ──────────────────────────────────
//
// 整体亮度是三枚里最低的: 除了虹膜和额饰, 画面其余部分都在中低调。
// "看透"这件事的表达是**收**不是放 —— 一枚亮眼睛落在暗背景里, 比满屏发光更像在盯着人。

export const INSIGHT_PALETTE: EmblemPalette = {
  gradients: [
    {
      key: "plate",
      kind: "radial",
      cx: "50%",
      cy: "46%",
      r: "62%",
      stops: [
        { offset: "0%", color: "#2a1748" },
        { offset: "58%", color: "#170d2a" },
        { offset: "100%", color: "#080413" },
      ],
    },
    // 眼白: 不是白, 是一层冷紫的雾 —— 真白会把虹膜的亮度峰值抢掉。
    {
      key: "sclera",
      kind: "linear",
      y1: "0%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#cbb6f0" },
        { offset: "45%", color: "#7f68b8" },
        { offset: "100%", color: "#2e1f52" },
      ],
    },
    // 虹膜: 上缘品紫 → 下缘青。一个球面里冷暖都有, 才不像一枚贴片。
    {
      key: "iris",
      kind: "radial",
      cx: "42%",
      cy: "34%",
      r: "72%",
      stops: [
        { offset: "0%", color: "#e6c8ff" },
        { offset: "30%", color: "#b981ff" },
        { offset: "68%", color: "#6a4bd8" },
        { offset: "100%", color: "#2bd6e6" },
      ],
    },
    // 瞳心的透光: 竖瞳不是死黑, 底下透出一点冷光。
    {
      key: "core",
      kind: "radial",
      stops: [
        { offset: "0%", color: "#eaf8ff" },
        { offset: "40%", color: "#7ef0ff", opacity: 0.75 },
        { offset: "100%", color: "#2bd6e6", opacity: 0 },
      ],
    },
    // 额饰宝石: 金, 全紫画面里唯一的暖。
    {
      key: "gem",
      kind: "linear",
      y1: "100%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#a8720f" },
        { offset: "55%", color: "#ffd166" },
        { offset: "100%", color: "#fff3d0" },
      ],
    },
  ],
  glow: { color: "#a06bff", blur: 2, opacity: 0.65 },
  ink: {
    /** 外框亮边: 冷紫银。 */
    rim: "#8a6ad0",
    /** 上眼睑亮边。 */
    edge: "#e2d3ff",
    /** 下眼睑暗面与眼眶压边。 */
    shade: "#170d2a",
    /** 竖瞳。 */
    pupil: "#0d0518",
    /** 虹膜放射纹。 */
    vein: "#3a2472",
    /** 眉弧与眼下光芒。 */
    brow: "#b981ff",
    /** 扫描线与高光。 */
    scan: "#eaf8ff",
    hilite: "#ffffff",
  },
};
