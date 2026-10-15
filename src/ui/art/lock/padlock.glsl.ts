/**
 * 未开放建筑的锁头：全息刻度环 + 悬浮的金属挂锁(钢锁梁、黄铜包边锁身、警示斜纹、发光锁孔)。
 * 坐标：设计 px，p 以画布中心为原点，y 向上。
 * uActive = 「拒绝进入」反馈：锁头横向抖动、警示色切到更亮的告警色并整体闪一下。
 * uUnlock = 1 时播开锁：锁孔亮起转青 → 锁梁弹起 → 锁头碎成方块散去，刻度环外扩消失。
 */
export const GLSL_PADLOCK_UNIFORMS = /* glsl */ `
uniform vec3 uGlow;    // 常态警示色
uniform vec3 uAlert;   // 拒绝进入时的告警色
uniform vec3 uOpen;    // 开锁时转成的据点青色
uniform float uUnlock; // 1 = 开锁演出(uPhase 从挂载起算, 时间轴见 padlockUnlock.glsl.ts)
`;

export const GLSL_PADLOCK = /* glsl */ `
#define BODY_Y -16.0
#define BODY_HALF vec2(40.0, 32.0)
#define SHACKLE_Y 16.0
#define SHACKLE_R 25.0
#define SHACKLE_W 6.5

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

/** 倒 U 形锁梁：上半圆环 + 向下插进锁身的两条腿。 */
float sdShackle(vec2 p) {
  vec2 q = vec2(p.x, max(p.y, 0.0));
  float d = abs(length(q) - SHACKLE_R) - SHACKLE_W;
  return max(d, -(p.y + 30.0));
}

/** 锁孔：圆头 + 向下的窄槽。k 以锁孔圆心为原点。 */
float sdKeyhole(vec2 k) {
  float head = length(k) - 6.0;
  float slot = sdRoundBox(k - vec2(0.0, -9.0), vec2(2.6 + max(-k.y - 2.0, 0.0) * 0.12, 8.0), 1.2);
  return min(head, slot);
}

/** 背后的全息刻度环：一圈细线 + 两圈反向转动的刻度段。 */
void drawRings(inout vec4 c, vec2 p, vec3 glow, float t, float lit) {
  vec2 o = p - vec2(0.0, -4.0);
  float r = length(o);
  float ang = atan(o.y, o.x) / (2.0 * PI);
  emit(c, glow, 0.16 * exp(-r * r / 2400.0) * lit);
  emit(c, glow, 0.5 * fillAA(abs(r - 66.0) - 0.9) * lit);
  float seg = step(0.42, fract(ang * 10.0 + t * 0.05));
  emit(c, glow, 0.42 * seg * fillAA(abs(r - 73.0) - 2.0) * lit);
  float tick = step(0.78, fract(ang * 56.0 - t * 0.12));
  emit(c, glow, 0.3 * tick * fillAA(abs(r - 59.0) - 3.0) * lit);
}

/** 钢锁梁：按圆柱截面打光，中线偏内一道高光。 */
void drawShackle(inout vec4 c, vec2 p) {
  vec2 sp = p - vec2(0.0, SHACKLE_Y);
  float d = sdShackle(sp);
  float n = clamp((length(vec2(sp.x, max(sp.y, 0.0))) - SHACKLE_R) / SHACKLE_W, -1.0, 1.0);
  float cyl = 1.0 - n * n;
  vec3 steel = mix(vec3(0.12, 0.14, 0.16), vec3(0.55, 0.6, 0.64), cyl * cyl);
  float hl = (n + 0.35) / 0.2;
  steel += vec3(0.32) * exp(-hl * hl);
  paint(c, steel, fillAA(d));
}

/** 锁身：枪灰金属 + 黄铜包边 + 内嵌面板 + 铆钉 + 底部警示斜纹 + 发光锁孔。 */
void drawBody(inout vec4 c, vec2 p, vec3 glow, float t) {
  vec2 bp = p - vec2(0.0, BODY_Y);
  float d = sdRoundBox(bp, BODY_HALF, 8.0);
  float vy = clamp((bp.y + BODY_HALF.y) / (BODY_HALF.y * 2.0), 0.0, 1.0);
  vec3 col = mix(vec3(0.06, 0.07, 0.09), vec3(0.2, 0.22, 0.25), vy);

  // 内嵌面板：压暗 + 上沿一道倒角亮线
  vec2 pp = bp - vec2(0.0, 4.0);
  float dPanel = sdRoundBox(pp, vec2(30.0, 18.0), 5.0);
  col = mix(col, col * 0.6, fillAA(dPanel));
  col += vec3(0.16) * fillAA(abs(dPanel + 0.6) - 0.6) * step(0.0, pp.y);

  // 警示斜纹
  float stripe = step(0.5, fract((bp.x + bp.y) / 10.0));
  float band = fillAA(abs(bp.y + 23.0) - 3.2) * fillAA(abs(bp.x) - 27.0);
  col = mix(col, mix(vec3(0.05), glow * 0.85, stripe), band);

  // 四角铆钉
  vec2 rv = vec2(abs(bp.x) - 33.0, abs(bp.y) - 25.0);
  float rivet = fillAA(length(rv) - 2.6);
  col = mix(col, mix(vec3(0.5, 0.36, 0.16), vec3(1.0, 0.86, 0.55), 1.0 - smoothstep(-1.5, 1.5, rv.x + rv.y)), rivet);

  // 黄铜包边
  vec3 brass = mix(vec3(0.42, 0.28, 0.11), vec3(0.96, 0.77, 0.4), vy);
  col = mix(col, brass, smoothstep(-4.6, -3.4, d));

  paint(c, col, fillAA(d));

  // 锁孔：深色孔洞, 后面透出呼吸的警示光
  float dHole = sdKeyhole(pp - vec2(0.0, 5.0));
  float breathe = 0.55 + 0.45 * sin(t * 2.4);
  paint(c, vec3(0.01), fillAA(dHole));
  emit(c, glow, (0.35 + 0.5 * breathe) * fillAA(dHole + 1.5));
  emit(c, glow, 0.35 * breathe * exp(-max(dHole, 0.0) / 4.0) * fillAA(dPanel) * step(0.0, dHole));
}

/** 全息感：轮廓外晕、自下而上的扫描线与一道扫光。 */
void drawHolo(inout vec4 c, vec2 p, float dAll, vec3 glow, float t, float lit) {
  float inside = fillAA(dAll);
  emit(c, glow, 0.45 * exp(-max(dAll, 0.0) / 5.0) * step(0.0, dAll) * lit);
  float line = smoothstep(0.82, 1.0, 0.5 + 0.5 * sin((p.y - t * 28.0) * 0.5));
  emit(c, glow, 0.05 * line * inside);
  float sy = (p.y - (mod(t * 36.0, 220.0) - 110.0)) / 5.0;
  float sweep = exp(-sy * sy);
  emit(c, glow, 0.14 * sweep * inside);
}
`;
