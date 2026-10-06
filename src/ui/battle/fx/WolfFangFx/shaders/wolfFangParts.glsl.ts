/**
 * 狼雀 · 牙咬构件(拼在 GLSL_COMMON + GLSL_HIT_COMMON 之后, 主程序之前)。
 * 坐标 r: 已按斩线倾角旋正, x 沿斩线、y 为法向(朝上为正), 原点 = 命中点。
 *   drawEyes     —— 暗处亮起一对上挑的琥珀狼瞳, 合拢前眨眼熄灭;
 *   drawJaw      —— 一排獠牙: 两端钉死的月牙刃, 前缘带两颗尖齿, 身后拖出扫掠残影;
 *   drawFeathers —— 爆点后从斩线迸出、上下翻飞再飘落的雀羽。
 * 依赖 GLSL_WOLF_FANG_DEFS 的 T_EYES_IN / T_EYES_PEAK / T_EYES_OUT / FEATHER_LIFE 宏(须拼在本片段之前)。
 */
export const GLSL_WOLF_FANG_PARTS = /* glsl */ `
#define JAW_LEN 150.0
#define JAW_OPEN 110.0

/** 刃光冷银: 与琥珀主色对撞, 刃是钢、眼与羽是火。 */
vec3 wolfSteel() {
  return vec3(0.84, 0.91, 1.0);
}

/** 月牙刃中线: 两端钉在 (±JAW_LEN, 0), 中点高 h(带符号)。 */
float jawCurve(float x, float h) {
  float u = x / JAW_LEN;
  return h * (1.0 - u * u);
}

void drawEyes(inout vec4 c, vec2 r, float t) {
  float k = smoothstep(T_EYES_IN, T_EYES_PEAK, t) * (1.0 - smoothstep(T_EYES_OUT - 0.03, T_EYES_OUT, t));
  if (k <= 0.0) return;
  // 眨眼: 熄灭前 60ms 眼裂压成一条线。
  float blink = 1.0 - smoothstep(T_EYES_OUT - 0.07, T_EYES_OUT - 0.01, t);
  k *= 0.86 + 0.14 * sin(uPhase * 47.0);
  for (int i = 0; i < 2; i++) {
    float side = float(i) * 2.0 - 1.0;
    // 外眼角上挑: 右眼逆时针、左眼顺时针各转 0.3rad。
    vec2 p = rot(r - vec2(side * 28.0, 22.0), -side * 0.3);
    float d = sdEllipse(p, vec2(10.0, max(3.6 * blink, 0.4)));
    emit(c, hotColor(0.45), fillAA(d) * k);
    emit(c, uColor, glowOf(max(d, 0.0), 7.0) * k * 0.9);
    // 竖瞳: 横向收窄的白热核。
    emit(c, vec3(1.0), glowOf(length(p * vec2(1.8, 0.5)), 1.8) * k * blink * 0.9);
    // 横向镜头拖光。
    float streak = glowOf(abs(p.y), 1.2) * (1.0 - smoothstep(0.0, 90.0, abs(p.x)));
    emit(c, uColor, streak * k * 0.35);
  }
}

/**
 * 一排獠牙。side = 1 上颚 / -1 下颚; h = 当前中点高度(带符号);
 * vel ∈ [0,1] 合拢进度(越接近 1 越快, 拖影越长); a = 整体强度。
 * dist 以刃的前缘为 0、背离命中点为正。
 */
void drawJaw(inout vec4 c, vec2 r, float h, float side, float vel, float a) {
  if (a <= 0.0) return;
  float u = r.x / JAW_LEN;
  float taper = clamp(1.0 - u * u, 0.0, 1.0);
  if (taper <= 0.0) return;
  float slope = -2.0 * h * r.x / (JAW_LEN * JAW_LEN);
  float dist = (r.y - jawCurve(r.x, h)) * side / sqrt(1.0 + slope * slope);
  float w = 5.5 * pow(taper, 0.8);

  // 刃身: 中段厚、两端收尖的月牙。
  float dBody = abs(dist - w * 0.5) - w * 0.5;
  emit(c, vec3(1.0), fillAA(dBody) * a);
  emit(c, wolfSteel(), glowOf(max(dBody, 0.0), 6.0) * a * 0.7);
  emit(c, uColor, glowOf(max(dBody, 0.0), 24.0) * a * 0.22);

  // 残影: 刃身外侧刚扫过的区域。
  float smear = 12.0 + 80.0 * vel;
  if (dist > w && dist < w + smear) {
    float s = 1.0 - (dist - w) / smear;
    emit(c, mix(wolfSteel(), uColor, 0.35), s * s * taper * a * 0.4);
  }

  // 尖齿: 前缘两颗朝内的三角齿, 上下颚错开站位, 合拢时交错咬合。
  float fangX = side > 0.0 ? 0.36 : 0.24;
  for (int i = 0; i < 2; i++) {
    float x0 = (float(i) * 2.0 - 1.0) * fangX * JAW_LEN;
    float k = 1.0 - abs(r.x - x0) / 8.0;
    if (k <= 0.0) continue;
    float depth = 18.0 * k * taper;
    // 斜边斜率 18/8, 除以 √(1+2.25²) 近似归一成像素距离, 保住抗锯齿宽度。
    float dFang = max((-dist - depth) / 2.46, dist - 0.5);
    emit(c, vec3(1.0), fillAA(dFang) * a);
    emit(c, wolfSteel(), glowOf(max(dFang, 0.0), 4.0) * a * 0.5);
  }
}

void drawFeathers(inout vec4 c, vec2 r, float t) {
  if (t <= 0.0 || t >= FEATHER_LIFE) return;
  float fade = smoothstep(0.0, 0.03, t) * (1.0 - smoothstep(FEATHER_LIFE * 0.5, FEATHER_LIFE, t));
  for (int i = 0; i < 10; i++) {
    float fi = float(i);
    float h1 = hash11(fi * 4.13 + uSeed * 71.0);
    float h2 = hash11(fi * 9.71 + uSeed * 23.0);
    float h3 = hash11(fi * 2.57 + uSeed * 47.0);
    // 奇偶交替上下迸出, 落点沿斩线散开。
    float side = mod(fi, 2.0) < 1.0 ? 1.0 : -1.0;
    vec2 origin = vec2((h1 - 0.5) * JAW_LEN * 1.5, 0.0);
    float ang = side * (PI * 0.5 + (h2 - 0.5) * 1.3);
    vec2 dir = vec2(cos(ang), sin(ang));
    float sp = 160.0 + 260.0 * h3;
    // 初速快速衰减(空气阻力) + 左右摆荡 + 缓慢下坠。
    vec2 pos = origin + dir * sp * (1.0 - exp(-6.0 * t)) / 6.0
             + vec2(sin(t * 9.0 + fi * 1.7) * 10.0 * t, -55.0 * t * t);
    float spin = ang + side * 1.2 + sin(t * 13.0 + fi * 2.3) * 0.7;
    vec2 p = rot(r - pos, -spin);
    float len = 9.0 + 6.0 * h2;
    // 羽根宽、羽梢尖。
    float wid = (2.6 + 1.6 * h1) * (1.0 - 0.45 * clamp(p.x / len, -1.0, 1.0));
    float d = sdEllipse(p, vec2(len, wid));
    float k = fade * (0.6 + 0.4 * h3);
    emit(c, hotColor(0.25), fillAA(d) * k * 0.7);
    emit(c, uColor, glowOf(max(d, 0.0), 4.0) * k * 0.55);
    float dShaft = max(abs(p.y) - 0.35, abs(p.x) - len);
    emit(c, vec3(1.0), fillAA(dShaft) * k * 0.6);
  }
}
`;
