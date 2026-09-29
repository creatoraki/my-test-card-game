/**
 * 遇敌黑影：地面渗出黑泥 → 向上拉起成扭曲人形 → 睁开红色光眼。
 * 坐标：设计 px，原点在画布左下角；q 以地面线中点为原点，y 向上。
 * 时间：uPhase = 挂载后秒数(宿主从注册起积分，rate=1)。各段起点由 uniform 传入，时间表见 ShadowEncounter/encounterTiming.ts。
 */
export const GLSL_SHADOW_UNIFORMS = /* glsl */ `
uniform float uGround;  // 地面线距画布底边
uniform float uStart;   // 黑泥开始渗出(秒)
uniform vec2 uRise;     // 人形拉起的起止(秒)
uniform float uEyes;    // 光眼睁开(秒)
uniform float uLean;    // 朝向玩家的一侧：-1 左 / 1 右
`;

export const GLSL_SHADOW_FIGURE = /* glsl */ `
#define HEAD_Y 262.0

float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

/** 起身进度：带一点过冲，读成「猛地站起」。 */
float riseAmount(float t) {
  float k = clamp((t - uRise.x) / max(uRise.y - uRise.x, 0.001), 0.0, 1.0);
  float c = 1.9;
  float s = k - 1.0;
  return 1.0 + (c + 1.0) * s * s * s + c * s * s;
}

/** 人形轮廓 SDF：佝偻的躯干、耸起的肩、垂到膝下的长臂与爪。 */
float figureShape(vec2 q, float t) {
  float lean = uLean;
  float sway = sin(t * 2.3 + uSeed * 5.0);
  // 上身朝玩家前倾：越高偏得越多。
  vec2 b = vec2(q.x - lean * q.y * 0.08, q.y);
  float base = sdEllipse(b - vec2(0.0, 26.0), vec2(96.0, 46.0));
  float torso = sdEllipse(b - vec2(0.0, 132.0), vec2(56.0, 108.0));
  float shoulder = sdEllipse(b - vec2(0.0, 206.0), vec2(90.0, 30.0));
  float head = length(b - vec2(lean * 14.0, HEAD_Y)) - 33.0;
  float d = smin(base, torso, 34.0);
  d = smin(d, shoulder, 26.0);
  d = smin(d, head, 20.0);
  for (int i = 0; i < 2; i++) {
    float side = i == 0 ? -1.0 : 1.0;
    vec2 root = vec2(side * 78.0, 204.0);
    vec2 hand = vec2(side * (106.0 + sway * 5.0), 66.0 + sway * side * 6.0);
    d = smin(d, sdCapsule(b, root, hand, 13.0), 18.0);
    // 三根分开的爪
    for (int j = 0; j < 3; j++) {
      float fj = float(j) - 1.0;
      vec2 tip = hand + vec2(side * (10.0 + fj * 9.0), -26.0 + abs(fj) * 6.0);
      d = min(d, sdCapsule(b, hand, tip, 3.6 - abs(fj) * 0.8));
    }
  }
  return d;
}

/** 地面黑泥：边缘翻涌的椭圆滩。 */
void drawPool(inout vec4 c, vec2 q, float t, float grow) {
  if (grow <= 0.0) return;
  float n = fbm(vec2(atan(q.y * 4.0, q.x + 0.001) * 2.4, t * 1.6) + uSeed * 3.0);
  vec2 r = vec2(158.0, 30.0) * grow * (0.86 + n * 0.28);
  float d = sdEllipse(q - vec2(0.0, -4.0), r);
  // 外围一圈柔和的暗影，让黑泥像是「吞掉」了地面。
  paint(c, vec3(0.0), 0.55 * exp(-max(d, 0.0) / 22.0) * grow);
  paint(c, vec3(0.012, 0.008, 0.014), fillAA(d));
  // 翻涌的鼓包表面偶尔反出暗红
  float boil = smoothstep(0.62, 0.9, fbm(q * vec2(0.05, 0.16) + vec2(0.0, -t * 1.3)));
  emit(c, vec3(0.28, 0.03, 0.04), boil * fillAA(d + 4.0) * 0.5);
  emit(c, vec3(0.42, 0.06, 0.05), exp(-abs(d) / 2.5) * 0.35 * grow);
}

/** 从泥池里伸出的触须：随起身一起长高、左右摆动。 */
void drawTendrils(inout vec4 c, vec2 q, float t, float grow) {
  if (grow <= 0.0) return;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    float bx = -128.0 + fi * 64.0 + (hash21(vec2(fi, uSeed)) - 0.5) * 30.0;
    float h = (70.0 + hash21(vec2(uSeed, fi)) * 90.0) * grow;
    if (q.y < -6.0 || q.y > h) continue;
    float k = clamp(q.y / max(h, 1.0), 0.0, 1.0);
    float x = bx + sin(q.y * 0.045 + t * 3.2 + fi * 1.7) * 16.0 * k + (bx > 0.0 ? 1.0 : -1.0) * k * k * 22.0;
    float w = mix(11.0, 1.2, k);
    float d = abs(q.x - x) - w;
    paint(c, vec3(0.01, 0.006, 0.012), fillAA(d));
  }
}

/** 人形本体：暗影外晕 → 冒烟的轮廓 → 体内暗红脉络 → 边缘轮廓光。 */
void drawFigure(inout vec4 c, vec2 q, float t, float rise) {
  if (rise <= 0.001) return;
  // 起身：先是贴地的一团(横向摊开、纵向压扁)，再拉成全高。
  float sy = max(rise, 0.02);
  vec2 f = vec2(q.x / mix(1.55, 1.0, clamp(rise, 0.0, 1.0)), q.y / sy);
  // 域扭曲：轮廓像烟一样不停蠕动
  vec2 warp = vec2(fbm(f * 0.018 + vec2(uSeed, -t * 0.7)), fbm(f * 0.018 + vec2(4.1, -t * 0.9))) - 0.5;
  // 头部扭曲收敛，光眼才能稳稳落在脸上
  f += warp * mix(26.0, 8.0, smoothstep(200.0, 250.0, f.y));
  float d = figureShape(f, t) * min(1.0, sy);
  // 越往上越被烟蚀：顶端与肩线持续飘散
  float smoke = fbm(q * 0.034 + vec2(uSeed * 2.0, -t * 1.5));
  d += (smoke - 0.5) * mix(10.0, 20.0, clamp(q.y / 300.0, 0.0, 1.0));

  paint(c, vec3(0.0), 0.6 * exp(-max(d, 0.0) / 30.0) * clamp(rise * 1.4, 0.0, 1.0));
  float body = smoothstep(3.0, -3.0, d);
  float veins = smoothstep(0.58, 0.82, fbm(q * 0.045 + vec2(0.0, t * 0.35)));
  vec3 skin = mix(vec3(0.016, 0.01, 0.018), vec3(0.11, 0.018, 0.035), veins * 0.7);
  paint(c, skin, body);
  // 轮廓光：一圈很弱的暗红，保证在暗场景里读得出剪影
  emit(c, vec3(0.5, 0.07, 0.06), exp(-abs(d + 2.0) / 3.0) * 0.32 * clamp(rise, 0.0, 1.0));
}

/** 身旁上升的黑烟。 */
void drawWisps(inout vec4 c, vec2 q, float t, float rise) {
  if (rise <= 0.0) return;
  float n = fbm(vec2(q.x * 0.028, q.y * 0.02 - t * 1.1) + uSeed);
  float band = smoothstep(0.55, 0.8, n);
  float spread = exp(-abs(q.x) / 120.0) * smoothstep(-20.0, 80.0, q.y) * smoothstep(420.0, 220.0, q.y);
  paint(c, vec3(0.008, 0.005, 0.01), band * spread * 0.55 * clamp(rise, 0.0, 1.0));
}

/** 红色光眼：两道细缝睁开，带辉光与轻微闪烁。 */
void drawEyes(inout vec4 c, vec2 q, float t, float rise) {
  float open = smoothstep(uEyes, uEyes + 0.16, t) * step(0.98, rise);
  if (open <= 0.0) return;
  float flicker = 0.85 + 0.15 * sin(t * 23.0 + uSeed * 9.0);
  vec2 head = vec2(uLean * 14.0 + uLean * HEAD_Y * 0.08, HEAD_Y - 4.0);
  for (int i = 0; i < 2; i++) {
    float side = i == 0 ? -1.0 : 1.0;
    vec2 e = q - head - vec2(side * 12.0 + uLean * 4.0, side * uLean * -1.5);
    float d = sdEllipse(e, vec2(8.5, 2.0 * open + 0.2));
    float glow = exp(-length(e * vec2(0.5, 1.0)) / 7.0);
    emit(c, vec3(0.95, 0.12, 0.08), glow * 0.9 * open * flicker);
    emit(c, vec3(1.0, 0.82, 0.7), fillAA(d) * open);
  }
}
`;
