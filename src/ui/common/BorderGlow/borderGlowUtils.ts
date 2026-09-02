// BorderGlow 的纯计算工具：颜色解析、CSS 变量拼装与补间动画。

/** 解析 "40 80 80" 形式的 HSL 数值串。 */
export function parseHSL(hslStr: string): { h: number; s: number; l: number } {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  if (!match) return { h: 40, s: 80, l: 80 };
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
}

/** 把十六进制颜色转换成 BorderGlow 使用的 HSL 数值串。 */
export function hexToHslTriplet(hex: string): string {
  const value = hex.trim().replace(/^#/, "");
  const normalized = value.length === 3 ? value.split("").map((char) => char + char).join("") : value;
  if (!/^[\da-f]{6}$/i.test(normalized)) return "40 80 72";

  const red = parseInt(normalized.slice(0, 2), 16) / 255;
  const green = parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;

  if (delta !== 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (max === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }

  return `${Math.round((hue + 360) % 360)} ${Math.round(saturation * 100)} ${Math.round(
    Math.max(62, Math.min(82, lightness * 100)),
  )}`;
}

/** 按强度生成一组不同透明度的发光色变量。 */
export function buildGlowVars(glowColor: string, intensity: number): Record<string, string> {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const opacities = [100, 60, 50, 40, 30, 20, 10];
  const keys = ["", "-60", "-50", "-40", "-30", "-20", "-10"];
  const vars: Record<string, string> = {};
  for (let i = 0; i < opacities.length; i++) {
    vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
  }
  return vars;
}

const GRADIENT_POSITIONS = ["80% 55%", "69% 34%", "8% 6%", "41% 38%", "86% 85%", "82% 18%", "51% 4%"];
const GRADIENT_KEYS = [
  "--gradient-one",
  "--gradient-two",
  "--gradient-three",
  "--gradient-four",
  "--gradient-five",
  "--gradient-six",
  "--gradient-seven",
];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

/** 用给定的几个主色铺成七层网格渐变。 */
export function buildGradientVars(colors: string[]): Record<string, string> {
  const vars: Record<string, string> = {};
  for (let i = 0; i < GRADIENT_KEYS.length; i++) {
    const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
    vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`;
  }
  vars["--gradient-base"] = `linear-gradient(${colors[0]} 0 100%)`;
  return vars;
}

/** 判断十六进制颜色是否为浅色底，用于切换浅色描边与阴影。 */
export function isLightColor(color: string): boolean {
  const value = color.trim().replace("#", "");
  if (!/^[\da-f]{3}([\da-f]{3})?$/i.test(value)) return false;
  const hex = value.length === 3 ? value.split("").map((char) => char + char).join("") : value;
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return red * 0.2126 + green * 0.7152 + blue * 0.0722 > 180;
}

export function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

export function easeInCubic(x: number) {
  return x * x * x;
}

export interface AnimateOpts {
  start?: number;
  end?: number;
  duration?: number;
  delay?: number;
  ease?: (t: number) => number;
  onUpdate: (v: number) => void;
  onEnd?: () => void;
}

/** 极简补间：返回取消函数，便于组件卸载时中断。 */
export function animateValue({
  start = 0,
  end = 100,
  duration = 1000,
  delay = 0,
  ease = easeOutCubic,
  onUpdate,
  onEnd,
}: AnimateOpts): () => void {
  let cancelled = false;
  let rafId = 0;
  const t0 = performance.now() + delay;

  function tick() {
    if (cancelled) return;
    const elapsed = performance.now() - t0;
    const t = Math.min(elapsed / duration, 1);
    onUpdate(start + (end - start) * ease(t));
    if (t < 1) rafId = requestAnimationFrame(tick);
    else if (onEnd) onEnd();
  }

  const timerId = window.setTimeout(() => {
    rafId = requestAnimationFrame(tick);
  }, delay);

  return () => {
    cancelled = true;
    window.clearTimeout(timerId);
    cancelAnimationFrame(rafId);
  };
}
