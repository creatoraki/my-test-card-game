// BorderGlow 的纯计算工具：颜色解析、CSS 变量拼装、指针几何与补间动画。

export interface PointerGeometry {
  /** 0..1：指针贴近边缘的程度（1 = 正压在边缘上） */
  edge: number;
  /** 0..360：指针相对卡面中心的角度（deg） */
  angle: number;
}

/**
 * 把指针屏幕坐标换算成卡面自身坐标系下的边缘贴近度与角度。
 *
 * 原组件内 getCenterOfElement / getEdgeProximity / getCursorAngle 三个几何函数的
 * zoom 归并实现：全程只用「比例」而不使用 rect 的绝对尺寸语义 ——
 * 先对 rect（含变换后的轴对齐包围盒）归一化得到 nx/ny（同一坐标系内相减，免疫
 * CSS zoom），再用 offsetWidth/offsetHeight 还原到卡面自身坐标系（宽高比正确，
 * 避免 .bento 带 rotateX/rotateY 时 conic-gradient 角度系统性偏移）。
 * 在 zoom=1、无旋转的环境下，结果与旧的 rect 算法逐位一致。
 */
export function pointerGeometry(el: HTMLElement, clientX: number, clientY: number): PointerGeometry {
  const rect = el.getBoundingClientRect();
  // -0.5..0.5：相对中心的归一化偏移，同一坐标系相减，免疫 zoom 与变换包围盒
  const nx = rect.width !== 0 ? (clientX - rect.left) / rect.width - 0.5 : 0;
  const ny = rect.height !== 0 ? (clientY - rect.top) / rect.height - 0.5 : 0;
  // 还原成卡面自身坐标系：缩放等比 ⇒ 宽高比恒定，offsetWidth/Height 与 zoom 无关
  const dx = nx * el.offsetWidth;
  const dy = ny * el.offsetHeight;

  let angle = 0;
  if (dx !== 0 || dy !== 0) {
    angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
  }
  // 与原 getEdgeProximity 数学等价：1/min(kx,ky) ⇒ max(|nx|,|ny|) * 2，clamp 到 0..1
  const edge = Math.min(Math.max(Math.max(Math.abs(nx), Math.abs(ny)) * 2, 0), 1);

  return { edge, angle };
}

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
