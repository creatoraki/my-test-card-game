/**
 * 射击 · 贯穿弹道：准星环收缩锁定 → 一道弹光自下而上射入 → 星芒爆闪 + 小环 + 顺势迸出的光屑。
 * 画面按「我方打敌人」自下而上绘制；目标为我方时由 CSS 垂直翻转成自上而下。
 */
export const GLSL_HIT_SHOT = /* glsl */ `
#define BULLET_LEAD 0.08
#define TRAIL_LEN 110.0

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);
  float tilt = (uSeed - 0.5) * 0.35;

  // 准星：四段环 + 四个刻度，收缩锁定后在爆点向外弹散。
  float lockK = smoothstep(-0.20, -0.03, t);
  float lockOut = t > 0.0 ? 1.0 - smoothstep(0.0, 0.10, t) : 1.0;
  if (lockK * lockOut > 0.0) {
    float radius = mix(66.0, 24.0, easeOut3(lockK)) + max(t, 0.0) * 260.0;
    float theta = atan(q.y, q.x) + uPhase * 3.0;
    float seg = fract(theta * 2.0 / PI);
    float gaps = smoothstep(0.06, 0.12, seg) * smoothstep(0.06, 0.12, 1.0 - seg);
    float dRing = abs(length(q) - radius) - 1.2;
    float a = mod(theta + PI * 0.25, PI * 0.5) - PI * 0.25;
    float rr = length(q);
    float dTick = max(abs(rr * sin(a)) - 1.2, abs(rr - radius - 9.0) - 5.0);
    float k = lockK * lockOut;
    emit(c, uColor, (fillAA(dRing) * gaps + fillAA(dTick) + 0.4 * glowOf(min(dRing, dTick), 3.0)) * k);
  }

  // 弹光：头部自下而上冲到中心，爆点后尾巴追上头部收束。
  vec2 b = rot(q, tilt);
  float headY = t < 0.0 ? mix(-170.0, 0.0, clamp((t + BULLET_LEAD) / BULLET_LEAD, 0.0, 1.0)) : 0.0;
  float tailY = t < 0.0 ? headY - TRAIL_LEN : mix(-TRAIL_LEN, 0.0, easeOut3(t / 0.12));
  if (t > -BULLET_LEAD && tailY < headY - 0.5) {
    float along = clamp((b.y - tailY) / (headY - tailY), 0.0, 1.0);
    float d = sdSegment(b, vec2(0.0, tailY), vec2(0.0, headY)) - 2.8 * along;
    emit(c, uColor, glowOf(d, 7.0) * 0.7 * along);
    paint(c, hotColor(0.85), fillAA(d) * along);
  }

  // 爆点：十字星芒 + 斜向小星芒 + 核心光 + 扩散小环。
  if (t > 0.0) {
    float s = exp(-t * 11.0);
    vec2 a = abs(q);
    float star = exp(-a.y / 1.6) * exp(-a.x / (80.0 * s + 1.0)) + exp(-a.x / 1.6) * exp(-a.y / (80.0 * s + 1.0));
    vec2 d45 = abs(rot(q, PI * 0.25));
    star += 0.5 * (exp(-d45.y / 1.2) * exp(-d45.x / (36.0 * s + 1.0)) + exp(-d45.x / 1.2) * exp(-d45.y / (36.0 * s + 1.0)));
    emit(c, hotColor(0.7), star * s * 1.4);
    emit(c, hotColor(0.6), glowOf(length(q) - 3.0, 14.0) * s);
    float k = clamp(t / 0.26, 0.0, 1.0);
    float dRing = abs(length(q) - (8.0 + 70.0 * easeOut3(k))) - mix(3.0, 0.6, k);
    emit(c, uColor, (fillAA(dRing) + 0.5 * glowOf(dRing, 4.0)) * (1.0 - k));
  }

  // 光屑顺着弹道方向向上迸出。
  emit(c, hotColor(0.4), burst(q, t, uSeed, 10.0, 400.0, 0.32, 220.0, PI * 0.5 - tilt - 0.8, 1.6));

  gl_FragColor = finalize(c * hitEndFade());
}
`;
