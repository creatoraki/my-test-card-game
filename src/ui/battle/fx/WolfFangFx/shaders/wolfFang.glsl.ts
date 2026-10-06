import { WOLF_TIMELINE as TL } from "../wolfFangTimeline";

// 带括号: 负值宏展开进 `t - T_JAW` 之类的表达式时不会粘成别的记号。
const sec = (ms: number) => `(${(ms / 1000).toFixed(3)})`;

/** 时间轴宏。构件(wolfFangParts)也要用, 故须拼在构件之前。 */
export const GLSL_WOLF_FANG_DEFS = /* glsl */ `
#define T_EYES_IN ${sec(TL.eyes.start)}
#define T_EYES_PEAK ${sec(TL.eyes.peak)}
#define T_EYES_OUT ${sec(TL.eyes.end)}
#define T_JAW ${sec(TL.jaw.start)}
#define FEATHER_LIFE ${sec(TL.featherLife)}
`;

/**
 * 狼雀 · 牙咬主程序。以爆点为零点(t = hitTime()):
 *   狼瞳  [-0.40, -0.12] 局部压暗, 一对琥珀竖瞳由暗渐亮 → 眨眼熄灭;
 *   獠牙  [-0.13, 0]     上下两道月牙刃张成眼形, 加速合拢, 尖齿交错咬合;
 *   爆点  0              闭成一线: 横向白核 + 镜头拖光 + 竖向咬合闪 + 扁椭圆冲击环 + 沿线火花;
 *   余烬  → 0.60         斩线由白热冷却成琥珀, 按噪声由两端向内烧蚀; 雀羽上下翻飞飘落;
 *   末尾 0.12s 整体淡出。
 */
export const GLSL_WOLF_FANG = /* glsl */ `
void drawScar(inout vec4 c, vec2 r, float t) {
  if (t <= 0.0) return;
  float len = JAW_LEN * 1.12;
  float u = r.x / len;
  float taper = clamp(1.0 - u * u, 0.0, 1.0);
  if (taper <= 0.0) return;
  float flare = exp(-t * 14.0);
  // 烧蚀: 每段斩线的熄灭时刻由噪声决定, 两端比中段更早烧断。
  float n = vnoise(vec2(r.x * 0.05, uSeed * 13.0));
  float burn = clamp(t / 0.6, 0.0, 1.0) + (1.0 - taper) * 0.35;
  float th = 0.25 + n * 0.7;
  float alive = 1.0 - smoothstep(th, th + 0.12, burn);
  float amp = (0.85 * exp(-t * 2.2) + flare) * alive * taper;
  if (amp <= 0.005) return;
  float ws = (0.9 + 3.2 * flare) * pow(taper, 0.6);
  float d = abs(r.y) - ws;
  vec3 core = mix(vec3(1.0), uColor, smoothstep(0.04, 0.3, t));
  emit(c, core, fillAA(d) * amp);
  emit(c, uColor, glowOf(max(d, 0.0), 5.0) * amp * 0.8);
  emit(c, wolfSteel(), glowOf(max(d, 0.0), 20.0) * amp * 0.2);
  // 烧蚀前沿: 即将熄灭的那一小段迸出琥珀亮点。
  float edgeGlow = smoothstep(th - 0.1, th, burn) * alive;
  emit(c, hotColor(0.3), glowOf(max(d, 0.0), 3.0) * edgeGlow * taper * 0.9);
}

void drawImpact(inout vec4 c, vec2 r, float t) {
  if (t <= 0.0) return;
  float kf = exp(-t * 16.0);
  // 白核: 沿斩线横向拉长。
  emit(c, vec3(1.0), glowOf(length(r * vec2(0.3, 1.0)), 16.0) * kf * 1.4);
  emit(c, uColor, glowOf(length(r * vec2(0.5, 1.0)), 60.0) * kf * 0.45);

  // 横向镜头拖光: 0.12s 内拉满, 随后变细消散。
  float reach = 60.0 + 260.0 * easeOut3(t / 0.12);
  float ks = exp(-t * 8.0);
  float span = 1.0 - smoothstep(reach * 0.4, reach, abs(r.x));
  emit(c, vec3(1.0), glowOf(abs(r.y), 1.6 + 2.0 * kf) * span * ks * 0.9);
  emit(c, uColor, glowOf(abs(r.y), 9.0) * span * ks * 0.35);

  // 竖向咬合闪: 上下颚相撞的一记短星芒。
  float ky = exp(-t * 20.0);
  emit(c, vec3(1.0), glowOf(abs(r.x), 1.4) * (1.0 - smoothstep(0.0, 70.0, abs(r.y))) * ky);

  // 冲击环: 沿斩线压扁的椭圆, 越扩越细。
  float k = clamp(t / 0.32, 0.0, 1.0);
  float dRing = abs(length(r * vec2(1.0, 1.7)) - (24.0 + 170.0 * easeOut3(k))) - mix(2.2, 0.4, k);
  emit(c, hotColor(0.55), (fillAA(dRing) + 0.5 * glowOf(max(dRing, 0.0), 6.0)) * (1.0 - k) * 0.85);

  // 火花: 顺斩线向两端甩出。
  float sp = burst(r, t, uSeed, 10.0, 560.0, 0.32, 220.0, -0.35, 0.7)
           + burst(r, t, uSeed + 0.41, 10.0, 560.0, 0.32, 220.0, PI - 0.35, 0.7);
  emit(c, hotColor(0.75), sp);
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  // 斩线微微右倾, 每次挂载随机抖一点角度。
  float ang = -0.16 + (uSeed - 0.5) * 0.16;
  vec2 r = rot(q, -ang);

  // 局部压暗(暖黑): 狼瞳亮起时沉下去, 爆点后迅速退去; 边缘提前归零不出方框。
  float dim = 0.32 * smoothstep(T_EYES_IN, T_EYES_PEAK, t) * (1.0 - smoothstep(0.02, 0.32, t));
  float dimMask = 1.0 - smoothstep(90.0, 240.0, length(q * vec2(0.8, 1.15)));
  paint(c, vec3(0.03, 0.015, 0.0), dim * dimMask);

  drawEyes(c, r, t);

  // 獠牙: 合拢进度 jk 平方加速, 爆点时 h 归零; 之后 25ms 内化入斩线。
  float jk = clamp((t - T_JAW) / -T_JAW, 0.0, 1.0);
  float h = JAW_OPEN * (1.0 - jk * jk);
  float ja = smoothstep(T_JAW, T_JAW + 0.03, t) * (t < 0.0 ? 1.0 : exp(-t * 40.0));
  drawJaw(c, r, h, 1.0, jk, ja);
  drawJaw(c, r, -h, -1.0, jk, ja);

  drawScar(c, r, t);
  drawImpact(c, r, t);
  drawFeathers(c, r, t);

  // 画布边缘 48px 内渐隐: 大半径光晕不会在矩形边界上切出硬边。
  float edge = smoothstep(0.0, 48.0, min(uSize.x * 0.5 - abs(q.x), uSize.y * 0.5 - abs(q.y)));
  gl_FragColor = finalize(c * hitEndFade() * edge);
}
`;
