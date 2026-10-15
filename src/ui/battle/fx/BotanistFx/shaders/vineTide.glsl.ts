/**
 * 植物学家 · 藤蔓缠绕(全屏群攻)。以爆点为零点(t = hitTime()), 全部目标同一爆点:
 *   催生  [-0.68, -0.45] 全场压暗, 施法者脚下亮起地面法阵(双环 + 放射刻纹);
 *   疾走  [-0.62, -0.20] 每个目标一条棘藤自法阵贴地蜿蜒疾走, 藤梢发光, 沿途抽出嫩叶;
 *   破土  [-0.22, 0]     藤梢钻入目标脚下, 四条粗藤破土螺旋缠绕而上, 前后分层;
 *   爆点  0              藤蔓骤然勒紧(螺旋收窄) + 倒刺齐刷刷弹出 + 绿闪 + 地面冲击椭圆环 + 飞叶;
 *   绞杀  [0, 0.45]      藤蔓保持勒紧并微微颤动;
 *   枯萎  [0.45, 1.02]   藤蔓自下而上枯黄、碎成光屑, 地面藤一并枯去, 末尾整体淡出。
 */
export const GLSL_VINE_TIDE = /* glsl */ `
#define CASTER_X 220.0
#define CASTER_Y 260.0
#define FOOT 125.0
#define COIL_H 310.0
#define COIL_K 0.037

vec2 casterFoot() {
  return vec2(CASTER_X, CASTER_Y - 110.0);
}

/** 枯萎进度阈值: 自下而上推进, 叠一层噪声让边缘参差。返回 (枯黄程度, 存活程度, 余烬)。 */
vec3 witherAt(vec2 p, float rise, float t) {
  float wf = prog(t, 0.45, 0.95) * 1.35;
  float th = rise * 0.7 + vnoise(p * 0.06 + uSeed * 5.0) * 0.3;
  float brown = smoothstep(th - 0.2, th, wf);
  float alive = 1.0 - smoothstep(th + 0.15, th + 0.22, wf);
  float ember = smoothstep(th + 0.08, th + 0.15, wf) * alive;
  return vec3(brown, alive, ember);
}

void drawSigil(inout vec4 c, vec2 s, float t) {
  float k = window4(t, -0.68, -0.5, -0.1, 0.3);
  if (k <= 0.0) return;
  vec2 g = s - casterFoot();
  g.y *= 3.2;
  float r = length(g);
  if (r > 200.0) return;
  float grow = easeOut3(prog(t, -0.68, -0.45));
  float R1 = 120.0 * grow;
  float R2 = 86.0 * grow;
  float rings = glowOf(abs(r - R1), 1.6) + 0.7 * glowOf(abs(r - R2), 1.2);
  float a = atan(g.y, g.x) + uPhase * 1.5;
  float ticks = smoothstep(0.75, 0.95, cos(a * 12.0)) * step(R2, r) * step(r, R1);
  emit(c, uColor, (rings + ticks * 0.8) * k);
  emit(c, uColor, glowOf(r, 50.0) * k * 0.3);
}

/** 地面疾走藤: 自法阵贴地蜿蜒到第 i 个目标脚下。 */
void drawRunner(inout vec4 c, vec2 s, float t, vec2 foot, float fi) {
  if (t < -0.62 || t > 1.0) return;
  vec2 a = casterFoot() + vec2(40.0, 0.0);
  vec2 ab = foot - a;
  float L = length(ab);
  vec2 dir = ab / max(L, 1.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  vec2 rel = s - a;
  float x = dot(rel, dir);
  float y = dot(rel, nrm);
  if (x < -20.0 || x > L + 20.0 || abs(y) > 70.0) return;
  float hu = L * easeOut3(prog(t, -0.62 + fi * 0.04, -0.2));
  float xc = clamp(x, 0.0, L);
  float ph = xc / 55.0 + fi * 1.3 + uSeed * 6.0;
  float env = sin(clamp(xc / L, 0.0, 1.0) * PI);
  float off = sin(ph) * 22.0 * env;
  float slope = cos(ph) * 22.0 * env / 55.0;
  float d = abs(y - off) / sqrt(1.0 + slope * slope);
  vec3 w3 = witherAt(s * 0.5, 0.0, t);
  float k = (x <= hu ? 1.0 : 0.0) * w3.y;
  float w = mix(5.0, 1.6, smoothstep(hu - 120.0, hu, x));
  paintVine(c, d, w, k, w3.x);
  // 藤梢光点(疾走段)。
  if (t < 0.0) {
    float hoff = sin(hu / 55.0 + fi * 1.3 + uSeed * 6.0) * 22.0 * sin(clamp(hu / L, 0.0, 1.0) * PI);
    vec2 headP = a + dir * hu + nrm * hoff;
    emit(c, hotColor(0.6), glowOf(length(s - headP), 6.0) * (1.0 - step(L - 2.0, hu)) * 1.2);
  }
  // 嫩叶: 每 70px 一片、两侧交替, 藤梢经过后抽出。
  float li = floor(x / 70.0);
  float lx = (li + 0.5) * 70.0;
  if (lx < hu - 10.0 && lx < L - 30.0) {
    float side = mod(li, 2.0) < 1.0 ? 1.0 : -1.0;
    float lph = lx / 55.0 + fi * 1.3 + uSeed * 6.0;
    vec2 base = a + dir * lx + nrm * (sin(lph) * 22.0 * sin(clamp(lx / L, 0.0, 1.0) * PI));
    float pop = easeOut3(clamp((hu - lx) / 80.0, 0.0, 1.0));
    if (pop < 0.05) return;
    float leafAng = atan(dir.y, dir.x) + side * 0.9;
    vec2 lp = rot(s - base, -leafAng);
    paintLeaf(c, lp, 26.0 * pop, 7.0 * pop, mix(LEAF_TINT, WITHER, w3.x), w3.y);
  }
}

/** 第 i 个目标身上的四条螺旋藤; front=1 画前半圈(压在目标前), 0 画后半圈(暗、在后)。 */
void drawCoil(inout vec4 c, vec2 p, float t, float fi, float front) {
  float H = COIL_H * easeOut3(prog(t, -0.22, -0.02));
  if (H < 1.0) return;
  float rise = p.y + FOOT;
  if (rise < -12.0 || rise > H + 12.0) return;
  float tighten = smoothstep(-0.04, 0.03, t);
  float tremble = t > 0.0 ? sin(t * 70.0) * 3.0 * exp(-t * 5.0) : 0.0;
  float rr = clamp(rise, 0.0, H);
  float taper = 1.0 - 0.3 * rr / COIL_H;
  float A = mix(132.0, 84.0, tighten) * taper + tremble;
  vec3 w3 = witherAt(p, rr / COIL_H, t);
  if (w3.y <= 0.0) return;
  float thornLen = 17.0 * easeOut3(prog(t, 0.0, 0.07)) * (1.0 - w3.x);

  for (int j = 0; j < 4; j++) {
    float ph = float(j) * (PI * 0.5) + fi * 0.9 + uSeed * 6.0;
    float th = rr * COIL_K + ph;
    float z = cos(th);
    float isFront = step(0.0, z);
    if (abs(isFront - front) > 0.5) continue;
    float x = A * sin(th);
    float slope = A * COIL_K * z;
    float d = abs(p.x - x) / sqrt(1.0 + slope * slope);
    if (d > 30.0) continue;
    float w = mix(9.0, 2.5, smoothstep(H - 90.0, H, rr)) * (0.8 + 0.2 * abs(z));
    float k = w3.y * (front > 0.5 ? 1.0 : 0.45);
    paintVine(c, d, w, k, w3.x);
    if (front > 0.5) emit(c, hotColor(0.6), w3.z * fillAA(d - w) * 1.4);

    // 倒刺: 每 26px 一根, 只在前半圈, 刺尖朝外。
    if (front > 0.5 && thornLen > 0.5) {
      float yn = (floor(rise / 26.0) + 0.5) * 26.0;
      float thn = yn * COIL_K + ph;
      if (yn < H && cos(thn) > 0.15) {
        float xn = A * sin(thn);
        float sx = xn >= 0.0 ? 1.0 : -1.0;
        vec2 lp = vec2(rise - yn, (p.x - xn) * sx - w * 0.8);
        paintThorn(c, rot(lp, -0.35), 3.4, thornLen, k);
      }
    }
  }
}

void drawImpact(inout vec4 c, vec2 p, float t, float fi) {
  if (t <= 0.0) return;
  float seed = uSeed + fi * 0.37;
  emit(c, hotColor(0.75), glowOf(length(p), 30.0) * exp(-t * 13.0) * 1.2);
  // 地面冲击椭圆环。
  vec2 g = vec2(p.x, (p.y + FOOT) * 3.2);
  float k = prog(t, 0.0, 0.42);
  float R = 40.0 + 230.0 * easeOut3(k);
  emit(c, uColor, glowOf(abs(length(g) - R), 2.5 + 8.0 * (1.0 - k)) * (1.0 - k) * 0.9);
  emit(c, hotColor(0.5), burst(p, t, seed, 12.0, 520.0, 0.36, 160.0, 0.0, 2.0 * PI));
  leafBurst(c, p - vec2(0.0, 40.0), t, seed, 9.0, 480.0, 0.85, 240.0, 0.25, 2.6);
}

void main() {
  vec2 s = stageCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  float dim = 0.32 * window4(t, -0.68, -0.4, 0.35, 0.95);
  paint(c, vec3(0.0, 0.025, 0.01), dim);

  drawSigil(c, s, t);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    if (fi >= uCount) break;
    vec2 T = stageTarget(i);
    drawRunner(c, s, t, T - vec2(0.0, FOOT), fi);
  }
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    if (fi >= uCount) break;
    vec2 p = s - stageTarget(i);
    if (abs(p.x) > 330.0 || p.y < -FOOT - 120.0 || p.y > COIL_H) continue;
    drawCoil(c, p, t, fi, 0.0);
    drawCoil(c, p, t, fi, 1.0);
    drawImpact(c, p, t, fi);
  }

  gl_FragColor = finalize(c * hitEndFade() * stageEdge(s));
}
`;
