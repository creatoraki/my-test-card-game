/**
 * 预言家 · 星幕(全屏群攻)。以爆点为零点(t = hitTime()), 全部目标同一爆点:
 *   垂幕  [-0.75, -0.30] 画面上缘垂下一道极光星幕, 幕中星点闪烁, 全场轻压暗;
 *   流星  [-0.55, 0.30]  装饰流星自星幕斜落穿场;
 *   锁定  [-0.40, 0]     每个目标脚下浮出星环;
 *   坠星  [-0.22, 0]     每个目标各挨一颗主陨星斜坠;
 *   爆点  0              各目标白闪 + 五芒星光爆 + 冲击环 + 星屑;
 *   收幕  → 1.70         星幕上卷消散, 末尾整体淡出。
 */
export const GLSL_STAR_CURTAIN = /* glsl */ `
const vec2 FALL_DIR = vec2(0.42, 0.91);

void drawCurtain(inout vec4 c, vec2 s, float t) {
  float k = window4(t, -0.75, -0.4, 0.4, 1.0);
  if (k <= 0.0) return;
  float top = uSize.y;
  // 幕的下摆随时间垂下, 收幕时上卷。
  float hang = mix(0.0, 260.0, easeOut3(prog(t, -0.75, -0.35))) * (1.0 - easeOut3(prog(t, 0.4, 1.0)));
  float depth = top - s.y;
  float wave = (fbm(vec2(s.x * 0.006, uPhase * 0.4)) - 0.5) * 90.0;
  float hem = hang + wave;
  float body = 1.0 - smoothstep(hem - 80.0, hem, depth);
  // 竖向光纹: 极光的褶皱。
  float folds = fbm(vec2(s.x * 0.02 + uPhase * 0.3, depth * 0.004 - uPhase * 0.2));
  float streak = pow(0.5 + 0.5 * sin(s.x * 0.05 + folds * 6.0 + uPhase * 1.5), 3.0);
  vec3 col = mix(uColor, vec3(0.55, 0.85, 1.0), smoothstep(0.3, 0.7, folds));
  emit(c, col, body * (0.12 + 0.35 * streak * folds) * k);
  // 下摆亮边。
  emit(c, hotColor(0.4), glowOf(abs(depth - hem), 10.0) * smoothstep(20.0, 60.0, hang) * k * 0.35);
  // 幕中星点。
  vec2 cell = s / 34.0;
  vec2 id = floor(cell);
  float h = hash21(id + 3.1);
  vec2 sp = (fract(cell) - 0.5 - (vec2(hash21(id + 7.7), hash21(id + 1.3)) - 0.5) * 0.6) * 34.0;
  float tw = 0.5 + 0.5 * sin(uPhase * (6.0 + 8.0 * h) + h * 40.0);
  emit(c, vec3(1.0), twinkle(sp, 6.0) * step(0.72, h) * body * tw * k);
}

/** 装饰流星: 12 颗, 自星幕斜落穿场, 不对准目标。 */
void drawShower(inout vec4 c, vec2 s, float t) {
  if (t < -0.55 || t > 0.4) return;
  vec2 dir = normalize(FALL_DIR);
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float h1 = hash11(fi * 3.3 + uSeed * 7.0);
    float h2 = hash11(fi * 8.1 + uSeed * 3.0);
    float born = -0.55 + h1 * 0.75;
    float lt = t - born;
    if (lt <= 0.0 || lt > 0.4) continue;
    vec2 start = vec2(h2 * (uSize.x + 300.0), uSize.y + 40.0);
    vec2 head = start - dir * lt * (1300.0 + 500.0 * h1);
    vec2 r = rot(s - head, -atan(dir.y, dir.x));
    float len = 90.0 + 70.0 * h2;
    if (r.x < -6.0 || r.x > len) continue;
    float along = clamp(r.x / len, 0.0, 1.0);
    float d = abs(r.y) - 1.6 * (1.0 - along);
    float f = (1.0 - along) * (1.0 - lt / 0.4);
    emit(c, hotColor(0.5), (fillAA(d) + glowOf(max(d, 0.0), 4.0) * 0.4) * f * 0.8);
  }
}

void drawTarget(inout vec4 c, vec2 s, float t, vec2 tp) {
  vec2 q = s - tp;
  float r0 = length(q);
  // 锁定星环(压扁在脚下, 读作地面上的星图)。
  float kl = window4(t, -0.4, -0.3, -0.02, 0.06);
  if (kl > 0.0) {
    vec2 g = (q - vec2(0.0, -120.0)) * vec2(1.0, 3.2);
    float R = mix(120.0, 80.0, easeOut3(prog(t, -0.4, 0.0)));
    float d = abs(length(g) - R) - 1.4;
    float dStar = abs(sdStar5(rot(g, t * 3.0), R * 0.8, 0.42)) - 1.0;
    emit(c, uColor, (fillAA(min(d, dStar)) + 0.4 * glowOf(max(min(d, dStar), 0.0), 5.0)) * kl * 0.8);
  }
  // 主陨星。
  if (t > -0.22 && t < 0.12) {
    vec2 dir = normalize(FALL_DIR);
    float u = prog(t, -0.22, 0.0);
    vec2 head = dir * 520.0 * (1.0 - u * (0.4 + 0.6 * u));
    float after = t > 0.0 ? exp(-t * 20.0) : 1.0;
    vec2 r = rot(q - head, -atan(dir.y, dir.x));
    float len = 60.0 + 200.0 * u;
    if (r.x > 0.0 && r.x < len) {
      float along = r.x / len;
      float d = abs(r.y) - 6.0 * (1.0 - along) - 0.5;
      float f = (1.0 - along) * (1.0 - along) * after;
      emit(c, hotColor(0.55), fillAA(d) * f);
      emit(c, uColor, glowOf(max(d, 0.0), 10.0) * f * 0.6);
    }
    if (t <= 0.0) {
      float dh = length(q - head);
      emit(c, vec3(1.0), glowOf(dh, 6.0) * 1.2);
      emit(c, uColor, glowOf(dh, 26.0) * 0.5);
    }
  }
  if (t <= 0.0) return;
  emit(c, vec3(1.0), glowOf(r0, 22.0) * exp(-t * 12.0) * 1.3);
  emit(c, uColor, glowOf(r0, 80.0) * exp(-t * 7.0) * 0.5);
  float ks = easeOut3(t / 0.26);
  float dStar = sdStar5(rot(q, uSeed + t), 26.0 + 110.0 * ks, 0.38);
  emit(c, hotColor(0.7), fillAA(dStar) * exp(-t * 16.0));
  emit(c, hotColor(0.35), glowOf(abs(dStar), 4.0) * exp(-t * 6.0) * 0.8);
  float k = prog(t, 0.0, 0.4);
  float dRing = abs(r0 - (16.0 + 140.0 * easeOut3(k))) - mix(2.5, 0.4, k);
  emit(c, hotColor(0.5), (fillAA(dRing) + 0.5 * glowOf(max(dRing, 0.0), 6.0)) * (1.0 - k));
  emit(c, hotColor(0.75), burst(q, t, uSeed + tp.x * 0.001, 12.0, 460.0, 0.45, 240.0, 0.0, 2.0 * PI));
}

void main() {
  vec2 s = stageCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);

  paint(c, vec3(0.02, 0.01, 0.06), 0.3 * smoothstep(-0.75, -0.3, t) * (1.0 - smoothstep(0.2, 0.9, t)));

  drawCurtain(c, s, t);
  drawShower(c, s, t);
  for (int i = 0; i < 3; i++) {
    if (float(i) >= uCount) break;
    drawTarget(c, s, t, stageTarget(i));
  }

  gl_FragColor = finalize(c * hitEndFade() * stageEdge(s));
}
`;
