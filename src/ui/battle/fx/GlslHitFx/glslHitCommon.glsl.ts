/**
 * 命中特效着色器公共片段(拼在 GLSL_COMMON 之后)。
 * 约定：
 *   - 坐标 q 以画布中心为原点、y 轴朝上，单位为设计 px(见 hitCoord)；
 *   - uPhase 由宿主从注册时刻 0 起积分(已乘战斗倍速)，即「挂载后经过的秒数」；
 *   - hitTime() = uPhase - uImpact：负值为预兆段，0 为爆点，正值为爆发与衰减；
 *   - uSeed ∈ [0,1)，每次挂载随机，群攻时同屏多个目标形状互不相同。
 */
export const GLSL_HIT_COMMON = /* glsl */ `
uniform vec3 uColor;
uniform float uImpact;
uniform float uTotal;

vec2 hitCoord() {
  return vUv * uSize - uSize * 0.5;
}

float hitTime() {
  return uPhase - uImpact;
}

/** 末尾 0.12s 整体淡出，保证卸载前已完全透明。 */
float hitEndFade() {
  return 1.0 - smoothstep(uTotal - 0.12, uTotal, uPhase);
}

float hash11(float x) {
  return fract(sin(x * 127.1 + 311.7) * 43758.5453);
}

vec2 rot(vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

float easeOut3(float x) {
  x = clamp(x, 0.0, 1.0);
  return 1.0 - (1.0 - x) * (1.0 - x) * (1.0 - x);
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
  return length(pa - ba * h);
}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

/** 辅助系「受益在上方」的向上渐隐：y 越高越淡，fadeTop 为完全消失的高度。 */
float riseFade(float y, float fadeTop) {
  return 1.0 - smoothstep(fadeTop * 0.35, fadeTop, y);
}

/** 距离 → 柔光强度：r 为半衰距离。 */
float glowOf(float d, float r) {
  return r / (max(d, 0.0) + r);
}

/** 主色的高亮版(向白色靠拢)。 */
vec3 hotColor(float k) {
  return mix(uColor, vec3(1.0), k);
}

/**
 * 从原点炸开的放射光屑(至多 14 粒)，返回亮度。
 * t 为爆发后秒数；ang0/spread 为发射扇区；gravity>0 下坠、<0 上飘。
 */
float burst(vec2 q, float t, float seed, float count, float speed, float life, float gravity, float ang0, float spread) {
  if (t <= 0.0 || t >= life) return 0.0;
  float k = 1.0 - t / life;
  float acc = 0.0;
  for (int i = 0; i < 14; i++) {
    float fi = float(i);
    if (fi >= count) break;
    float h1 = hash11(fi * 13.17 + seed * 91.3);
    float h2 = hash11(fi * 7.73 + seed * 37.9);
    float a = ang0 + spread * h1;
    vec2 dir = vec2(cos(a), sin(a));
    float sp = speed * (0.55 + 0.9 * h2);
    vec2 pos = dir * sp * (1.0 - exp(-4.0 * t)) / 4.0 - vec2(0.0, gravity * t * t);
    vec2 tail = pos - dir * (4.0 + 0.05 * sp) * k;
    float d = sdSegment(q, tail, pos) - 0.8 * k;
    acc += (fillAA(d) + 0.35 * glowOf(d, 2.5)) * k * (0.6 + 0.4 * h2);
  }
  return acc;
}
`;
