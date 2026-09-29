/**
 * 敌人死亡「余烬焚解」片元主体(拼在 GLSL_COMMON + GLSL_HIT_COMMON 之后, 复用其 uTotal/rot/sdBox/glowOf/hash11)。
 * 坐标: q 为画布设计 px, 原点左下; uFig = 立绘展示框(贴图全幅), uBody = 主体包围盒, 均为 [x, y, w, h]。
 * 时间: uPhase = 挂载后秒数(已乘战斗倍速), n = uPhase / uTotal ∈ [0, 1]:
 *   0.00–0.30  爆白定格: 立绘去饱和提白 + 金色轮廓光, 胸口一团白热闪光
 *   0.06–0.46  脚下冲击环沿地面椭圆扩散
 *   0.10–0.80  燃烧溶解: 自下而上的高度场叠 fbm 噪声, 火线前方先碳化, 火线本身白芯→金→暗红,
 *              贴近火线的像素被热浪向上掀起
 *   火线扫过即生灰烬: 带立绘本色的碎屑旋转上飘, 由白热冷却成本色再熄灭
 *   末 0.12s   整体淡出, 卸载前完全透明
 */
export const GLSL_DEATH_EMBER = /* glsl */ `
uniform sampler2D uTex;
uniform float uTexOn;
uniform vec4 uFig;
uniform vec4 uBody;

const vec3 EMBER_CORE = vec3(1.0, 0.96, 0.86);
const vec3 EMBER_GOLD = vec3(1.0, 0.824, 0.478);
const vec3 EMBER_RED = vec3(0.722, 0.196, 0.118);
const vec3 CHAR_BLACK = vec3(0.09, 0.05, 0.04);

/** 贴图是预乘颜色; 展示框外一律透明。 */
vec4 spriteAt(vec2 q) {
  vec2 uv = (q - uFig.xy) / uFig.zw;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(uTex, uv) * uTexOn;
}

/** 溶解场: 值越小越先烧掉。高度占主导(自下而上), 两层噪声让火线参差、成片剥落。 */
float burnField(vec2 q) {
  float h = (q.y - uBody.y) / max(uBody.w, 1.0);
  float n = fbm(q * 0.03 + uSeed * 23.0) * 0.75 + vnoise(q * 0.11 + uSeed * 7.0) * 0.25;
  return h * 0.7 + n * 0.6;
}

float easeOutCubic(float x) {
  x = clamp(x, 0.0, 1.0);
  return 1.0 - (1.0 - x) * (1.0 - x) * (1.0 - x);
}

void main() {
  vec2 q = vUv * uSize;
  float T = uPhase;
  float n = clamp(T / uTotal, 0.0, 1.0);
  vec4 c = vec4(0.0);

  vec2 feet = vec2(uBody.x + uBody.z * 0.5, uBody.y);
  vec2 core = vec2(feet.x, uBody.y + uBody.w * 0.55);
  float groundW = max(uBody.z, 140.0);

  // ---- 地面余火(画在立绘之下) ----
  float heat = smoothstep(0.1, 0.25, n) * (1.0 - smoothstep(0.7, 1.0, n));
  float flicker = 0.8 + 0.2 * vnoise(vec2(T * 9.0, uSeed * 10.0));
  vec2 gq = (q - feet) / vec2(groundW * 0.55, 18.0);
  emit(c, EMBER_RED * 0.9, exp(-dot(gq, gq) * 2.0) * heat * flicker * 0.5);

  // ---- 脚下冲击环 ----
  float rt = clamp((n - 0.06) / 0.4, 0.0, 1.0);
  if (rt > 0.0 && rt < 1.0) {
    float R = mix(0.25, 1.25, easeOutCubic(rt)) * groundW * 0.6;
    float d = abs(sdEllipse(q - feet, vec2(R, R * 0.24)));
    float fade = (1.0 - rt) * (1.0 - rt);
    emit(c, mix(EMBER_RED, EMBER_GOLD, fade), (fillAA(d - 1.2) + 0.6 * glowOf(d, 3.0)) * fade);
  }

  // ---- 燃烧溶解 ----
  float flash = smoothstep(0.0, 0.03, n) * (1.0 - smoothstep(0.08, 0.3, n));
  float burning = smoothstep(0.1, 0.14, n);
  float th = mix(-0.08, 1.42, smoothstep(0.1, 0.8, n));
  float gap = burnField(q) - th; // >0 未烧, <0 已烧

  // 贴近火线的未烧像素从下方取样 = 画面被热浪向上掀起。
  float lift = gap > 0.0 ? 6.0 * (1.0 - smoothstep(0.0, 0.1, gap)) * burning : 0.0;
  vec4 spr = spriteAt(q - vec2(0.0, lift));
  float a = spr.a;
  vec3 rgb = a > 0.001 ? spr.rgb / a : vec3(0.0);
  float lum = dot(rgb, vec3(0.299, 0.587, 0.114));
  rgb = mix(rgb, mix(vec3(lum), EMBER_CORE, 0.6) * 1.5, flash * 0.85);
  // 火线前方先烤焦, 再被烧穿。
  float charK = (1.0 - smoothstep(0.03, 0.22, gap)) * burning;
  rgb = mix(rgb, CHAR_BLACK, charK * 0.85);
  paint(c, min(rgb, vec3(1.0)), a * smoothstep(0.0, 0.012, gap));

  // 火线: 未烧侧拖得长(灼烧带), 已烧侧收得快(刚烧穿的余辉)。
  float edge = gap > 0.0 ? exp(-gap / 0.03) : exp(gap / 0.012);
  vec3 fire = mix(EMBER_RED, EMBER_GOLD, 1.0 - smoothstep(0.02, 0.07, gap));
  fire = mix(fire, EMBER_CORE, 1.0 - smoothstep(0.0, 0.02, abs(gap)));
  emit(c, fire * 1.3, edge * a * burning);

  // ---- 爆白: 金色轮廓光 + 胸口白热闪光 ----
  if (flash > 0.01) {
    float o = 3.0;
    float na = max(
      max(spriteAt(q + vec2(o, 0.0)).a, spriteAt(q - vec2(o, 0.0)).a),
      max(spriteAt(q + vec2(0.0, o)).a, spriteAt(q - vec2(0.0, o)).a)
    );
    emit(c, EMBER_GOLD * 1.2, clamp(na - a, 0.0, 1.0) * flash);
  }
  float burst = smoothstep(0.0, 0.02, n) * (1.0 - smoothstep(0.04, 0.2, n));
  emit(c, EMBER_CORE, exp(-length(q - core) / 70.0) * 0.55 * burst);

  // ---- 灰烬碎屑: 火线扫过其高度时生成, 带生成点的立绘本色 ----
  for (int i = 0; i < 36; i++) {
    float fi = float(i);
    float h1 = hash11(fi * 1.37 + uSeed * 91.0);
    float h2 = hash11(fi * 2.91 + uSeed * 37.0);
    float h3 = hash11(fi * 5.17 + uSeed * 13.0);
    float hy = h2 * 0.95;
    vec2 spawn = vec2(uBody.x + uBody.z * (0.08 + 0.84 * h1), uBody.y + uBody.w * hy);
    // 火线到达该高度的时刻: 噪声取均值近似, 再加一点抖动。
    float pSpawn = clamp((hy * 0.7 + 0.38) / 1.5, 0.0, 1.0);
    float nSpawn = 0.1 + 0.7 * pSpawn + (h3 - 0.5) * 0.06;
    float age = (n - nSpawn) * uTotal;
    float life = min(0.5 + 0.4 * h3, max(0.15, (0.98 - nSpawn) * uTotal));
    if (age <= 0.0 || age >= life) continue;
    float k = age / life;
    vec2 pos = spawn + vec2(
      (h3 - 0.5) * 50.0 * age + sin(age * 7.0 + h1 * 6.283) * 7.0 * k,
      60.0 * age + 90.0 * age * age
    );
    float r = mix(3.4, 0.8, k) * (0.7 + 0.6 * h2);
    float d = sdBox(rot(q - pos, age * (4.0 + 6.0 * h1) + h2 * 6.283), vec2(r, r * 0.7));
    if (d > 10.0) continue;
    // 只有落在碎屑附近的像素才取样; 贴图无 mipmap, 分支内取样安全。
    vec4 src = spriteAt(spawn);
    if (src.a < 0.05) continue;
    vec3 hot = mix(EMBER_CORE, EMBER_GOLD, smoothstep(0.0, 0.25, k));
    vec3 col = mix(hot, mix(src.rgb / src.a, EMBER_RED, 0.35), smoothstep(0.15, 0.6, k));
    float fade = 1.0 - smoothstep(0.55, 1.0, k);
    paint(c, col, fillAA(d) * fade * src.a);
    emit(c, EMBER_GOLD * (1.0 - k), glowOf(max(d, 0.0), 2.5) * 0.35 * fade);
  }

  c *= 1.0 - smoothstep(uTotal - 0.12, uTotal, T);
  gl_FragColor = finalize(c);
}
`;
