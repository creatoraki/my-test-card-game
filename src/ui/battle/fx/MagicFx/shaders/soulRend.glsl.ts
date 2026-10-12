/**
 * 咒术师 · 魂魄抽离。采样目标立绘(uTex)得到魂影轮廓; 无贴图时退回椭圆人形。
 * uFig = 立绘展示框 [左, 下, 宽, 高], 相对受击锚点(画布中心)、设计 px、y 朝上。
 * 以爆点为零点(t = hitTime()):
 *   开渊  [-0.50, -0.38] 目标左上方撕开一个黑色漩涡(螺旋臂 + 黑核 + 青边);
 *   抽离  [-0.32, 0]     立绘轮廓的发光魂影被扯离肉身、拉成拖影, 三根魂丝连着身体越绷越紧, 肉身随之发暗;
 *   爆点  0              魂丝崩断: 巨型白核闪 + 身魂之间的撕裂光痕 + 厚冲击环 + 魂屑朝漩涡喷射;
 *   吞噬  [0, 0.45]      魂影碎成方块残片, 加速卷进漩涡;
 *   闭渊  0.45 → 1.45    漩涡内爆一闪后收拢, 末尾整体淡出。
 */
export const GLSL_SOUL_REND = /* glsl */ `
uniform sampler2D uTex;
uniform float uTexOn;
uniform vec4 uFig;

const vec2 VORTEX = vec2(-210.0, 150.0);
const vec3 REND_DARK = vec3(0.01, 0.03, 0.045);
#define PULL_LEN 80.0
#define PIECE 28.0
#define SWALLOW 0.45

/** 立绘在 q 处的不透明度。 */
float portraitA(vec2 q) {
  if (uTexOn < 0.5 || uFig.z <= 0.0) return fillAA(sdEllipse(q - vec2(0.0, -10.0), vec2(62.0, 108.0)));
  vec2 uv = (q - uFig.xy) / uFig.zw;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) return 0.0;
  return texture2D(uTex, uv).a;
}

vec2 pullDir() {
  return normalize(VORTEX);
}

void drawVortex(inout vec4 c, vec2 q, float t) {
  float k = window4(t, -0.5, -0.38, SWALLOW, SWALLOW + 0.12);
  if (k <= 0.0) return;
  float sc = mix(0.3, 1.0, easeOut3(prog(t, -0.5, -0.36))) * (1.0 - 0.7 * prog(t, SWALLOW - 0.1, SWALLOW + 0.12));
  vec2 p = (q - VORTEX) / sc;
  float r = length(p);
  float a = atan(p.y, p.x);
  float arms = sin(a * 3.0 + log(max(r, 1.0)) * 7.0 - uPhase * 16.0);
  float area = 1.0 - smoothstep(40.0, 110.0, r);
  paint(c, REND_DARK, area * smoothstep(-0.2, 0.6, arms) * k * 0.85);
  emit(c, uColor, area * smoothstep(0.55, 0.95, arms) * k * 0.7);
  paint(c, vec3(0.0), fillAA((r - 24.0) * sc) * k);
  emit(c, hotColor(0.5), (fillAA(abs(r - 25.0) - 1.4) + glowOf(abs(r - 25.0), 6.0) * 0.6) * k);
}

/** 抽离段的魂影: 6 层采样拉出拖影, 主层描亮边。 */
void drawSoul(inout vec4 c, vec2 q, float t) {
  if (t < -0.32 || t > 0.0) return;
  float e = pow(prog(t, -0.32, 0.0), 1.6);
  vec2 dir = pullDir();
  vec2 o = dir * PULL_LEN * e;
  vec2 wq = q + vec2(sin(q.y * 0.05 + uPhase * 14.0), cos(q.x * 0.04 + uPhase * 11.0)) * 4.0 * e;
  float acc = 0.0;
  for (int j = 0; j < 6; j++) {
    float f = 1.0 - float(j) / 6.0;
    acc = max(acc, portraitA(wq - o * f) * (0.25 + 0.75 * f * f));
  }
  float a0 = portraitA(wq - o);
  float nb = min(min(portraitA(wq - o + vec2(4.0, 0.0)), portraitA(wq - o - vec2(4.0, 0.0))),
                 min(portraitA(wq - o + vec2(0.0, 4.0)), portraitA(wq - o - vec2(0.0, 4.0))));
  float rim = clamp(a0 - nb, 0.0, 1.0);
  float flick = 0.8 + 0.2 * vnoise(q * 0.05 + uPhase * 6.0);
  float k = smoothstep(-0.32, -0.24, t);
  emit(c, uColor, acc * k * (0.35 + 0.35 * e) * flick);
  emit(c, hotColor(0.75), rim * k * (0.8 + 0.8 * e));

  // 三根魂丝: 身体 → 魂影, 波动随绷紧收小。
  if (e > 0.05) {
    vec2 A = vec2(0.0, 10.0);
    vec2 B = A + o;
    vec2 ab = B - A;
    float L = max(length(ab), 1.0);
    vec2 tang = ab / L;
    vec2 nrm = vec2(-tang.y, tang.x);
    float hu = dot(q - A, tang) / L;
    float h = clamp(hu, 0.0, 1.0);
    float perp = dot(q - A, nrm);
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float wave = sin(h * PI * 2.0 + uPhase * 20.0 + fi * 2.1) * 10.0 * (1.0 - e * 0.7) * sin(h * PI) + (fi - 1.0) * 14.0 * sin(h * PI);
      float d = max(abs(perp - wave) - 1.2, (abs(hu - 0.5) - 0.5) * L);
      emit(c, hotColor(0.6), (fillAA(d) + glowOf(max(d, 0.0), 4.0) * 0.5) * k);
    }
  }
}

/** 肉身发暗: 抽离时立绘被压暗, 爆点后慢慢回色。 */
void drawDrain(inout vec4 c, vec2 q, float t) {
  float k = smoothstep(-0.3, -0.02, t) * (1.0 - smoothstep(0.25, 0.75, t));
  if (k <= 0.0) return;
  paint(c, REND_DARK, portraitA(q) * k * 0.5);
}

/** 吞噬段: 魂影按方块残片碎裂, 各片以不同速度卷向漩涡(逆向迭代找回源位置)。 */
void drawPieces(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0 || t > SWALLOW + 0.05) return;
  vec2 dir = pullDir();
  vec2 nrm = vec2(-dir.y, dir.x);
  vec2 o = dir * PULL_LEN;
  float dist = length(VORTEX - o);
  vec2 src = q;
  vec2 id = vec2(0.0);
  for (int i = 0; i < 3; i++) {
    id = floor(rot(src - o, 0.6) / PIECE);
    float h = hash21(id + uSeed * 13.0);
    float travel = dist * pow(prog(t, 0.0, SWALLOW * (0.6 + 0.4 * h)), 1.7);
    src = q - dir * travel - nrm * (h - 0.5) * 80.0 * sin(prog(t, 0.0, SWALLOW) * PI);
  }
  vec2 check = floor(rot(src - o, 0.6) / PIECE);
  if (length(check - id) > 0.5) return;
  vec2 local = fract(rot(src - o, 0.6) / PIECE);
  float gap = smoothstep(0.0, 0.1, min(min(local.x, local.y), min(1.0 - local.x, 1.0 - local.y)));
  float h = hash21(id + uSeed * 13.0);
  float shrink = 1.0 - prog(t, SWALLOW * (0.5 + 0.4 * h), SWALLOW * (0.6 + 0.4 * h));
  float a = portraitA(src - o) * gap * shrink;
  emit(c, mix(uColor, vec3(1.0), 0.35 + 0.4 * h), a * (0.7 + 0.5 * exp(-t * 8.0)));
}

void drawRend(inout vec4 c, vec2 q, float t) {
  if (t <= 0.0) return;
  vec2 dir = pullDir();
  float r0 = length(q);
  emit(c, vec3(1.0), glowOf(r0, 40.0) * exp(-t * 10.0) * 2.0);
  emit(c, uColor, glowOf(r0, 160.0) * exp(-t * 6.0) * 0.75);
  emit(c, uColor, exp(-t * 18.0) * 0.22);
  // 撕裂光痕: 身体与魂影之间一道锯齿白痕。
  vec2 A = vec2(0.0, 10.0) - dir * 40.0;
  vec2 B = vec2(0.0, 10.0) + dir * (PULL_LEN + 30.0);
  vec2 ab = B - A;
  float L = length(ab);
  vec2 tang = ab / L;
  float h = dot(q - A, tang);
  float perp = dot(q - A, vec2(-tang.y, tang.x));
  float jag = (vnoise(vec2(h * 0.08, uSeed * 7.0)) - 0.5) * 22.0;
  float d = max(abs(perp - jag) - 3.0 * exp(-t * 6.0), abs(h - L * 0.5) - L * 0.5);
  float kt = 1.0 - smoothstep(0.1, 0.45, t);
  emit(c, vec3(1.0), fillAA(d) * kt * 1.3);
  emit(c, uColor, glowOf(max(d, 0.0), 9.0) * kt);
  // 厚冲击环。
  float k = prog(t, 0.0, 0.4);
  float R = 30.0 + 210.0 * easeOut3(k);
  float w = mix(16.0, 2.0, k);
  paint(c, REND_DARK, fillAA(abs(r0 - R) - w) * (1.0 - k) * 0.55);
  emit(c, hotColor(0.6), fillAA(abs(r0 - R - w) - 1.6) * (1.0 - k));
  emit(c, uColor, glowOf(abs(r0 - R - w), 8.0) * (1.0 - k) * 0.6);
  float aim = atan(dir.y, dir.x);
  emit(c, hotColor(0.65), burst(q, t, uSeed, 14.0, 720.0, 0.45, 40.0, aim - 0.5, 1.0)
                        + burst(q, t, uSeed + 0.43, 10.0, 380.0, 0.4, 160.0, 0.0, 2.0 * PI) * 0.7);
  // 闭渊: 漩涡吞完后内爆一闪。
  float kv = t > SWALLOW ? exp(-(t - SWALLOW) * 12.0) : 0.0;
  emit(c, vec3(1.0), glowOf(length(q - VORTEX), 22.0) * kv * 1.6);
  emit(c, uColor, glowOf(length(q - VORTEX), 70.0) * kv * 0.6);
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  float dim = 0.3 * smoothstep(-0.5, -0.25, t) * (1.0 - smoothstep(0.05, 0.6, t));
  paint(c, vec3(0.0, 0.01, 0.025), dim * (1.0 - smoothstep(160.0, 340.0, length(q - VORTEX * 0.4))));

  drawDrain(c, q, t);
  drawVortex(c, q, t);
  drawSoul(c, q, t);
  drawPieces(c, q, t);
  drawRend(c, q, t);

  gl_FragColor = finalize(c * hitEndFade() * edgeFade(q));
}
`;
