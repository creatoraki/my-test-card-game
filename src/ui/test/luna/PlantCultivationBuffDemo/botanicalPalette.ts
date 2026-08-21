export type GradientStop = { offset: string; color: string; opacity?: number };

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
  ink: Record<string, string>;
};

const gradient = (key: string, stops: GradientStop[], extra: Partial<BuffGradient> = {}): BuffGradient => ({
  key,
  kind: "linear",
  y1: "0%",
  y2: "100%",
  stops,
  ...extra,
});

const radial = (key: string, stops: GradientStop[], extra: Partial<BuffGradient> = {}): BuffGradient => ({
  key,
  kind: "radial",
  cx: "50%",
  cy: "50%",
  r: "72%",
  stops,
  ...extra,
});

export const GROWING_PALETTE: BuffPalette = {
  gradients: [
    radial("paper", [{ offset: "0%", color: "#203d46" }, { offset: "58%", color: "#13282d" }, { offset: "100%", color: "#080f15" }], { cx: "50%", cy: "35%" }),
    gradient("pot", [{ offset: "0%", color: "#f2c584" }, { offset: "42%", color: "#b96b57" }, { offset: "100%", color: "#633c4a" }], { x1: "18%", x2: "88%" }),
    gradient("plant", [{ offset: "0%", color: "#e9e8b0" }, { offset: "34%", color: "#9ac58f" }, { offset: "100%", color: "#3d7770" }], { x1: "100%", y1: "0%", x2: "0%", y2: "100%" }),
    radial("core", [{ offset: "0%", color: "#fff8d0" }, { offset: "34%", color: "#e5d38f" }, { offset: "100%", color: "#8c9b69", opacity: 0 }], { cx: "28%", cy: "24%" }),
  ],
  glow: { color: "#9de29f", blur: 2.2, opacity: 0.68 },
  rim: "#d4c37f",
  ink: { deep: "#0d1c25", shadow: "#183541", mid: "#639273", light: "#fff4ca", track: "#35535a", accent: "#9be19b" },
};

export const DONE_PALETTE: BuffPalette = {
  gradients: [
    radial("paper", [{ offset: "0%", color: "#56352b" }, { offset: "58%", color: "#2b1c1f" }, { offset: "100%", color: "#110e14" }], { cy: "44%" }),
    gradient("petal", [{ offset: "0%", color: "#9e3f62" }, { offset: "46%", color: "#e97c76" }, { offset: "100%", color: "#ffe3a0" }], { x1: "25%", x2: "75%", y1: "100%", y2: "0%" }),
    gradient("petalShade", [{ offset: "0%", color: "#421b32" }, { offset: "100%", color: "#b75766" }], { x2: "100%", y2: "0%" }),
    radial("core", [{ offset: "0%", color: "#fffbe5" }, { offset: "34%", color: "#ffd98e" }, { offset: "100%", color: "#e77b73", opacity: 0 }], { cx: "35%", cy: "25%" }),
  ],
  glow: { color: "#f0a276", blur: 2.8, opacity: 0.86 },
  rim: "#f0c88b",
  ink: { deep: "#1b1420", shadow: "#4b203b", mid: "#8b405d", light: "#fff5d7", track: "#5b3440", accent: "#ffd28c" },
};

export const INSIGHT_PALETTE: BuffPalette = {
  gradients: [
    radial("paper", [{ offset: "0%", color: "#263c4b" }, { offset: "55%", color: "#172531" }, { offset: "100%", color: "#0a1018" }], { cy: "40%" }),
    gradient("eye", [{ offset: "0%", color: "#fff7cf" }, { offset: "35%", color: "#e7b84f" }, { offset: "68%", color: "#a76b1d" }, { offset: "100%", color: "#4d3515" }], { x1: "18%", y1: "0%", x2: "82%", y2: "100%" }),
    radial("iris", [{ offset: "0%", color: "#ffffff" }, { offset: "26%", color: "#fff2b0" }, { offset: "58%", color: "#d89b31" }, { offset: "100%", color: "#704515" }], { cx: "36%", cy: "24%" }),
    radial("core", [{ offset: "0%", color: "#ffffff" }, { offset: "34%", color: "#fff0a5" }, { offset: "100%", color: "#d6a33a", opacity: 0 }]),
  ],
  glow: { color: "#f2c45e", blur: 2.3, opacity: 0.84 },
  rim: "#f5d889",
  ink: { deep: "#101522", shadow: "#4f3818", mid: "#b27a25", light: "#ffffff", track: "#655024", accent: "#ffe49a" },
};

export const SHARP_PALETTE: BuffPalette = {
  gradients: [
    radial("paper", [{ offset: "0%", color: "#1d4660" }, { offset: "52%", color: "#12263e" }, { offset: "100%", color: "#080d1a" }], { cx: "50%", cy: "35%" }),
    gradient("blade", [{ offset: "0%", color: "#f7ffff" }, { offset: "27%", color: "#b9d8e8" }, { offset: "49%", color: "#ffffff" }, { offset: "72%", color: "#6794b5" }, { offset: "100%", color: "#244968" }], { x1: "18%", y1: "100%", x2: "82%", y2: "0%" }),
    gradient("facet", [{ offset: "0%", color: "#18354f" }, { offset: "48%", color: "#3e7192" }, { offset: "100%", color: "#b2d9e8" }], { x1: "0%", y1: "100%", x2: "100%", y2: "0%" }),
    gradient("guard", [{ offset: "0%", color: "#fff0a6" }, { offset: "42%", color: "#d49b45" }, { offset: "100%", color: "#744124" }], { x1: "0%", x2: "100%" }),
    gradient("grip", [{ offset: "0%", color: "#251b2b" }, { offset: "50%", color: "#563248" }, { offset: "100%", color: "#120f1c" }], { x1: "0%", x2: "100%" }),
    gradient("blood", [{ offset: "0%", color: "#ff8b76" }, { offset: "32%", color: "#c93849" }, { offset: "72%", color: "#741d36" }, { offset: "100%", color: "#2b1026" }], { x1: "0%", y1: "0%", x2: "100%", y2: "100%" }),
    radial("core", [{ offset: "0%", color: "#ffffff" }, { offset: "32%", color: "#b9f4ff" }, { offset: "70%", color: "#54c9ed" }, { offset: "100%", color: "#2d79b6", opacity: 0 }], { cx: "50%", cy: "32%" }),
  ],
  glow: { color: "#62d9ff", blur: 2.4, opacity: 0.88 },
  rim: "#8cd9ef",
  ink: { deep: "#081625", shadow: "#173b58", mid: "#467d9e", light: "#f2ffff", track: "#245271", accent: "#ffe28e" },
};

export const SHIELD_PALETTE: BuffPalette = {
  gradients: [
    radial("paper", [{ offset: "0%", color: "#274c70" }, { offset: "56%", color: "#162d49" }, { offset: "100%", color: "#080f1c" }], { cy: "38%" }),
    gradient("shield", [{ offset: "0%", color: "#d8f1ff" }, { offset: "28%", color: "#77b8e8" }, { offset: "70%", color: "#2d70aa" }, { offset: "100%", color: "#143653" }], { x1: "20%", x2: "80%" }),
    gradient("innerShield", [{ offset: "0%", color: "#eaf8ff" }, { offset: "42%", color: "#79c7ef" }, { offset: "100%", color: "#275d91" }], { x2: "100%", y2: "100%" }),
    radial("core", [{ offset: "0%", color: "#ffffff" }, { offset: "35%", color: "#c8efff" }, { offset: "70%", color: "#68c5f0" }, { offset: "100%", color: "#2b70b0" }], { cx: "34%", cy: "25%" }),
  ],
  glow: { color: "#72caff", blur: 2.4, opacity: 0.82 },
  rim: "#b8e5ff",
  ink: { deep: "#081a2f", shadow: "#123b63", mid: "#2e72a4", light: "#effaff", track: "#234a69", accent: "#c2ecff" },
};
