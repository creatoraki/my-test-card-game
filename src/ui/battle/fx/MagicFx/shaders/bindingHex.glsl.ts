/**
 * 咒术师 · 缠丝怨咒。以爆点为零点(t = hitTime()):
 *   聚丝  [-0.62, -0.12] 三道倾斜的怨丝环自画布外收拢到目标周围, 沿环流动着生长, 背面半透;
 *   勒紧  [-0.12, 0]     丝环急勒到 60px 上下, 越勒越亮, 秽气自脚下翻涌;
 *   爆点  0              青白闪 + 咒眼在目标身上睁开 + 暗色冲击;
 *   崩丝  [0, 0.45]      丝环断成碎段向外弹散, 青色火星四溅;
 *   余咒  → 1.45         咒眼闭合, 秽气上升消散, 末尾整体淡出。
 */
export const GLSL_BINDING_HEX = /* glsl */ `
const vec3 HEX_DARK = vec3(0.07, 0.015, 0.1);

/** 第 i 道丝环的倾角。 */
float loopTilt(int i) {
  if (i == 0) return 0.38;
  if (i == 1) return -0.52;
  return 1.45;
}

/** 丝环半径: 自外收拢 → 勒紧 → 崩散外弹。 */
float loopRadius(float t, float fi) {
  float gather = easeOut3(prog(t, -0.62 + fi * 0.05, -0.14));
  float r = mix(340.0, 96.0 + fi * 8.0, gather);
  r = mix(r, 58.0 + fi * 5.0, pow(prog(t, -0.12, 0.0), 2.0));
  if (t > 0.0) r = 58.0 + fi * 5.0 + 190.0 * easeOut3(t / 0.45);
  return r;
}

void drawLoops(inout vec4 c, vec2 q, float t) {
  if (t < -0.62 || t > 0.5) return;
  float cinch = prog(t, -0.12, 0.0);
  float snapK = t > 0.0 ? 1.0 - prog(t, 0.0, 0.45) : 1.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float tilt = loopTilt(i) + (uSeed - 0.5) * 0.3;
    float R = loopRadius(t, fi);
    vec2 rr = vec2(R, R * 0.3);
    vec2 p = rot(q, -tilt);
    float phi = atan(p.y / rr.y, p.x / rr.x);
    // 沿环流动着生长: 只显示自流动起点起已长出的弧段。
    float flow = uPhase * 1.6 + fi * 0.33;
    float grow = prog(t, -0.6 + fi * 0.05, -0.2);
    float seg = fract(phi / (2.0 * PI) - flow);
    float shown = max(1.0 - smoothstep(grow - 0.04, grow, seg), step(1.0, grow));
    // 崩丝: 爆点后按角度噪声断成碎段。
    if (t > 0.0) shown *= step(0.45 + 0.4 * prog(t, 0.0, 0.4), vnoise(vec2(phi * 3.0 + fi * 7.0, uSeed * 9.0)));
    if (shown <= 0.0) continue;
    float wob = sin(phi * 5.0 + uPhase * 9.0 + fi * 2.0) * 3.0 * (1.0 - cinch);
    float d = abs(sdEllipse(p, rr + wob)) - 2.0 - 1.2 * cinch;
    // 环的上半弧(倾斜后)视作绕到目标背后: 压暗压淡。
    float front = sin(phi) < 0.0 ? 1.0 : 0.4;
    float k = shown * front * snapK;
    paint(c, HEX_DARK, fillAA(d) * k * 0.9);
    emit(c, uColor, glowOf(max(d, 0.0), 3.0 + 3.0 * cinch) * k * (0.7 + 1.1 * cinch));
    emit(c, hotColor(0.6), fillAA(abs(d + 1.2) - 0.4) * k * (0.25 + 0.75 * cinch));
  }
}

void drawMiasma(inout vec4 c, vec2 q, float t) {
  float k = window4(t, -0.4, -0.05, 0.35, 0.9);
  if (k <= 0.0) return;
  // 自脚下翻涌、爆点后上升的秽气。
  float rise = max(t, 0.0) * 160.0;
  vec2 p = q - vec2(0.0, -110.0 + rise);
  float shape = 1.0 - smoothstep(30.0, 150.0, length(p * vec2(0.75, 1.15)));
  float n = fbm(vec2(q.x * 0.018, q.y * 0.014 - uPhase * 1.4) + uSeed * 5.0);
  float body = smoothstep(0.38, 0.66, n + shape * 0.5 - 0.25) * shape;
  paint(c, HEX_DARK, body * k * 0.6);
  float rim = smoothstep(0.34, 0.4, n + shape * 0.5 - 0.25) * (1.0 - smoothstep(0.4, 0.48, n + shape * 0.5 - 0.25)) * shape;
  emit(c, uColor, rim * k * 0.5);
}

/** 咒眼: 爆点瞬间在目标身上睁开, 竖瞳收缩, 随后闭合。 */
void drawEye(inout vec4 c, vec2 q, float t) {
  float k = window4(t, -0.05, 0.02, 0.5, 0.66);
  if (k <= 0.0) return;
  float open = easeOut3(prog(t, -0.05, 0.1)) * (1.0 - smoothstep(0.4, 0.6, t));
  vec2 p = q - vec2(0.0, 10.0);
  float dEye = sdAlmond(p, 56.0, 24.0 * open + 0.5);
  float inside = fillAA(dEye);
  paint(c, HEX_DARK, inside * k * 0.85);
  float dLid = abs(dEye) - 1.6;
  emit(c, hotColor(0.3), (fillAA(dLid) + 0.6 * glowOf(max(dLid, 0.0), 6.0)) * k);
  // 虹膜: 带放射纹的青色环; 瞳孔: 竖缝, 睁开后收紧。
  float r = length(p);
  float rays = 0.6 + 0.4 * sin(atan(p.y, p.x) * 18.0 + uPhase * 4.0);
  float iris = (1.0 - smoothstep(16.0, 19.0, r)) * smoothstep(5.0, 8.0, r) * rays;
  emit(c, uColor, iris * inside * k * 1.2);
  float dPupil = sdAlmond(p.yx, 15.0, mix(5.0, 2.2, prog(t, 0.05, 0.25)));
  paint(c, vec3(0.0), fillAA(dPupil) * inside * k);
  emit(c, hotColor(0.9), glowOf(length(p - vec2(-6.0, 7.0)), 1.5) * inside * k * 0.8);
}

void drawImpact(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0) return;
  float r0 = length(q);
  emit(c, hotColor(0.75), glowOf(r0, 30.0) * exp(-t * 13.0) * 1.3);
  emit(c, uColor, glowOf(r0, 100.0) * exp(-t * 7.0) * 0.5);
  float k = prog(t, 0.0, 0.4);
  float R = 30.0 + 200.0 * easeOut3(k);
  float dRing = abs(r0 - R) - mix(10.0, 1.5, k);
  paint(c, HEX_DARK, fillAA(dRing) * (1.0 - k) * 0.6);
  emit(c, uColor, glowOf(abs(r0 - R - mix(10.0, 1.5, k)), 3.0) * (1.0 - k) * 0.9);
  float sp = burst(q, t, uSeed, 14.0, 480.0, 0.45, 120.0, 0.0, 2.0 * PI)
           + burst(q, t, uSeed + 0.43, 10.0, 300.0, 0.4, -120.0, PI * 0.2, PI * 0.6) * 0.7;
  emit(c, hotColor(0.6), sp);
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  float dim = 0.32 * smoothstep(-0.6, -0.2, t) * (1.0 - smoothstep(0.1, 0.6, t));
  paint(c, vec3(0.01, 0.0, 0.03), dim * (1.0 - smoothstep(110.0, 280.0, length(q))));

  drawMiasma(c, q, t);
  drawLoops(c, q, t);
  drawImpact(c, q, t);
  drawEye(c, q, t);

  gl_FragColor = finalize(c * hitEndFade() * edgeFade(q));
}
`;
