export type GradientStop = {
  offset: string;
  color: string;
  opacity?: number;
};

export type BuffGradient = {
  key: string;
  kind: "linear" | "radial";
  x1?: string;
  y1?: string;
  x2?: string;
  y2?: string;
  cx?: string;
  cy?: string;
  r?: string;
  stops: GradientStop[];
};

export type BuffPalette = {
  gradients: BuffGradient[];
  glow: { color: string; blur: number; opacity: number };
  rim: string;
  darkInk: string;
  midInk: string;
  lightInk: string;
};

export const SHARP_PALETTE: BuffPalette = {
  gradients: [
    {
      key: "plate",
      kind: "radial",
      cx: "47%",
      cy: "38%",
      r: "70%",
      stops: [
        { offset: "0%", color: "#442638" },
        { offset: "52%", color: "#211728" },
        { offset: "100%", color: "#0a0b16" },
      ],
    },
    {
      key: "blade",
      kind: "linear",
      x1: "12%",
      y1: "94%",
      x2: "92%",
      y2: "8%",
      stops: [
        { offset: "0%", color: "#293547" },
        { offset: "28%", color: "#8298a3" },
        { offset: "52%", color: "#f0e6ce" },
        { offset: "72%", color: "#b8d0d2" },
        { offset: "100%", color: "#5e7382" },
      ],
    },
    {
      key: "bladeBevel",
      kind: "linear",
      x1: "0%",
      y1: "100%",
      x2: "100%",
      y2: "0%",
      stops: [
        { offset: "0%", color: "#6e2e43" },
        { offset: "48%", color: "#d95d58" },
        { offset: "82%", color: "#f4bb70" },
        { offset: "100%", color: "#fff0c2" },
      ],
    },
    {
      key: "steelCore",
      kind: "radial",
      cx: "72%",
      cy: "25%",
      r: "70%",
      stops: [
        { offset: "0%", color: "#fffdf0" },
        { offset: "38%", color: "#e8f3e5", opacity: 0.84 },
        { offset: "100%", color: "#89a8b3", opacity: 0 },
      ],
    },
  ],
  glow: { color: "#ef7660", blur: 2.4, opacity: 0.78 },
  rim: "#f0c68a",
  darkInk: "#160f20",
  midInk: "#632e48",
  lightInk: "#fff4d3",
};

export const SHIELD_PALETTE: BuffPalette = {
  gradients: [
    {
      key: "plate",
      kind: "radial",
      cx: "50%",
      cy: "40%",
      r: "70%",
      stops: [
        { offset: "0%", color: "#1b6570" },
        { offset: "48%", color: "#123b4b" },
        { offset: "100%", color: "#081520" },
      ],
    },
    {
      key: "shieldOuter",
      kind: "linear",
      x1: "18%",
      y1: "0%",
      x2: "82%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#a6f4d2" },
        { offset: "24%", color: "#35c7b5" },
        { offset: "66%", color: "#15788a" },
        { offset: "100%", color: "#0e344d" },
      ],
    },
    {
      key: "shieldFace",
      kind: "linear",
      x1: "24%",
      y1: "0%",
      x2: "76%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#d1ffe1" },
        { offset: "30%", color: "#65d5bd" },
        { offset: "70%", color: "#218f9a" },
        { offset: "100%", color: "#14526d" },
      ],
    },
    {
      key: "shieldCore",
      kind: "radial",
      cx: "42%",
      cy: "30%",
      r: "75%",
      stops: [
        { offset: "0%", color: "#ffffff" },
        { offset: "26%", color: "#d9fff0" },
        { offset: "58%", color: "#53d8cc" },
        { offset: "100%", color: "#176781" },
      ],
    },
  ],
  glow: { color: "#57e4cf", blur: 2.8, opacity: 0.82 },
  rim: "#c8ffe1",
  darkInk: "#071c2b",
  midInk: "#0f5267",
  lightInk: "#f2ffe7",
};

export const INSIGHT_PALETTE: BuffPalette = {
  gradients: [
    {
      key: "plate",
      kind: "radial",
      cx: "50%",
      cy: "42%",
      r: "70%",
      stops: [
        { offset: "0%", color: "#4d367e" },
        { offset: "48%", color: "#241e4c" },
        { offset: "100%", color: "#0c1024" },
      ],
    },
    {
      key: "eyeShell",
      kind: "linear",
      x1: "8%",
      y1: "20%",
      x2: "92%",
      y2: "80%",
      stops: [
        { offset: "0%", color: "#c1a8ff" },
        { offset: "28%", color: "#745ac9" },
        { offset: "64%", color: "#43348e" },
        { offset: "100%", color: "#1b2157" },
      ],
    },
    {
      key: "iris",
      kind: "radial",
      cx: "38%",
      cy: "30%",
      r: "74%",
      stops: [
        { offset: "0%", color: "#fff8ff" },
        { offset: "20%", color: "#c5b7ff" },
        { offset: "48%", color: "#896de2" },
        { offset: "78%", color: "#47379c" },
        { offset: "100%", color: "#191b4d" },
      ],
    },
    {
      key: "pupil",
      kind: "linear",
      x1: "0%",
      y1: "0%",
      x2: "100%",
      y2: "100%",
      stops: [
        { offset: "0%", color: "#fefaff" },
        { offset: "28%", color: "#c2aaff" },
        { offset: "55%", color: "#593db5" },
        { offset: "100%", color: "#111630" },
      ],
    },
  ],
  glow: { color: "#a78aff", blur: 2.6, opacity: 0.82 },
  rim: "#e9ddff",
  darkInk: "#0b1028",
  midInk: "#34266f",
  lightInk: "#fff4ff",
};