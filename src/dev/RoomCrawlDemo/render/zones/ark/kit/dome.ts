// 生态方舟共用远景母题(实时, 只用于背景层): 瀑布与「巨树穹顶」——竖直玻璃圆筒里的绿台、巨树与瀑布。
// 依赖 ARK_SKY_GLSL(px、C_HAZE)。

export const ARK_DOME_GLSL = /* glsl */ `
/** 竖向瀑布: 中心 x、半宽 w, 从 top 落到 bottom; 流动条纹 + 落点水雾。 */
vec3 arkFall(vec3 col, vec2 scr, float x, float w, float top, float bottom) {
  float dx = abs(scr.x - x);
  if (dx > w * 3.0 || scr.y > top + 4.0 || scr.y < bottom - 50.0) return col;
  float body = smoothstep(w, w * 0.55, dx) * step(bottom, scr.y) * px(scr.y - top);
  float flow = vnoise(vec2((scr.x - x) * 0.22, scr.y * 0.028 + uTime * 2.4));
  vec3 wc = mix(vec3(0.5, 0.72, 0.78), vec3(0.95, 0.98, 1.0), flow);
  col = mix(col, wc, body * (0.65 + 0.35 * flow));
  float mist = exp(-abs(scr.y - bottom) / 26.0) * exp(-dx / (w * 1.5));
  return mix(col, vec3(0.88, 0.94, 0.96), clamp(mist * 0.85, 0.0, 0.85));
}

/** 圆筒上的一圈环(从下往上看: 近侧弧线中间低、两侧高)。返回到环带中心线的距离(px)。 */
float domeRing(float y, float u, float ry, float bow) {
  return y - (ry + (1.0 - sqrt(max(1.0 - u * u, 0.0))) * bow);
}

/** 穹顶内部: 发光的绿雾、三层绿台、中央巨树与瀑布。y 自底起算, R 为圆筒半宽。 */
vec3 domeInterior(float dx, float y, float u, float R) {
  vec3 c = mix(vec3(0.32, 0.5, 0.44), vec3(0.62, 0.78, 0.74), clamp(y / (R * 2.2), 0.0, 1.0));
  // 三层绿台: 平台面 + 顶部树丛
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float ty = R * (0.12 + fi * 0.3);
    float d = domeRing(y, u, ty, R * 0.1);
    float lump = (fbm3(vec2(dx * 0.02 + fi * 7.0, 0.0)) - 0.3) * 46.0;
    float deck = step(-16.0, d) * step(d, 0.0);
    float bush = step(0.0, d) * step(d, lump);
    c = mix(c, vec3(0.5, 0.56, 0.58), deck);
    c = mix(c, mix(vec3(0.08, 0.24, 0.1), vec3(0.3, 0.5, 0.16), clamp(d / max(lump, 1.0), 0.0, 1.0)), bush);
  }
  // 巨树: 树干下粗上细 + 团状树冠
  float trunkW = R * 0.1 * (1.0 + exp(-y / (R * 0.18)) * 1.2);
  float trunk = px(abs(dx) - trunkW) * step(y, R * 1.1);
  c = mix(c, mix(vec3(0.16, 0.12, 0.08), vec3(0.36, 0.28, 0.18), clamp(dx / trunkW * 0.5 + 0.5, 0.0, 1.0)), trunk);
  vec2 cq = vec2(dx / (R * 0.95), (y - R * 1.35) / (R * 0.55));
  float lumpy = fbm3(vec2(dx, y) * 0.012) - 0.5;
  float canopy = length(cq) - 1.0 + lumpy * 0.7;
  float cm = px(canopy * R * 0.4);
  float leaf = vnoise(vec2(dx, y) * 0.06);
  float up = clamp(cq.y * 0.5 + 0.6 + lumpy, 0.0, 1.0);
  vec3 cc = mix(vec3(0.05, 0.18, 0.08), vec3(0.4, 0.62, 0.2), up * (0.6 + 0.4 * leaf));
  c = mix(c, cc, cm);
  // 瀑布: 从上层绿台边缘落下
  vec2 dummy = vec2(dx, y);
  c = arkFall(c, dummy, R * 0.52, 9.0, R * 0.7, R * 0.12);
  c = arkFall(c, dummy, -R * 0.66, 7.0, R * 0.42, R * 0.12);
  c = arkFall(c, dummy, R * 0.8, 6.0, R * 0.42, R * 0.12);
  return c;
}

/**
 * 巨树穹顶远景: 中心 cx(屏幕 px, 已含视差)、底 baseY、半宽 R, 向上伸出画外。
 * 玻璃筒(菲涅尔反光 + 竖肋)包住内部; 外面是白色环梁(底缘青色灯)与两侧立柱。fogK 为大气透视。
 */
vec3 arkDome(vec3 col, vec2 scr, float cx, float baseY, float R, float fogK) {
  float dx = scr.x - cx;
  float y = scr.y - baseY;
  if (abs(dx) > R * 1.12 || y < -20.0) return col;
  float u = clamp(dx / R, -1.0, 1.0);
  vec3 c = col;
  float body = px(abs(dx) - R) * step(0.0, y);
  if (body > 0.0) {
    vec3 inner = domeInterior(dx, y, u, R);
    float fres = pow(abs(u), 5.0);
    inner = mix(inner, vec3(0.72, 0.86, 0.9), 0.14 + fres * 0.5);
    float ang = asin(u);
    float t = ang * 8.0 / 3.14159;
    float ribD = (0.5 - abs(fract(t) - 0.5)) * (3.14159 / 8.0) * R * sqrt(max(1.0 - u * u, 0.0));
    float rib = px(ribD - 2.0);
    inner = mix(inner, mix(vec3(0.5, 0.56, 0.6), vec3(0.85, 0.88, 0.9), u * 0.5 + 0.5), rib * 0.85);
    c = mix(c, inner, body);
  }
  // 环梁: 比圆筒略宽, 顶面亮、底面暗, 底缘一道青灯
  float ru = clamp(dx / (R * 1.08), -1.0, 1.0);
  float rw = px(abs(dx) - R * 1.08);
  float cover = body;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float ry = R * (0.36 + fi * 0.62);
    float th = 13.0 + fi * 4.0;
    float d = domeRing(y, ru, ry, R * 0.12);
    float band = px(abs(d) - th) * rw;
    vec3 rc = mix(vec3(0.34, 0.4, 0.46), vec3(0.86, 0.89, 0.9), smoothstep(-th, th, d));
    rc += vec3(0.25, 0.95, 1.0) * exp(-abs(d + th - 2.0) * 0.6) * 1.2;
    c = mix(c, rc, band);
    cover = max(cover, band);
  }
  // 两侧立柱
  float post = px(abs(abs(dx) - R) - R * 0.03) * step(0.0, y);
  c = mix(c, mix(vec3(0.36, 0.42, 0.48), vec3(0.8, 0.84, 0.86), step(0.0, dx)), post);
  cover = max(cover, post);
  return mix(c, mix(c, C_HAZE, fogK), cover);
}
`;
