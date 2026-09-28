// 墙面 / 地面烘焙用的 G-buffer 编解码。依赖 ROOM_HEADER 里的 Surf。
// 四张 RGBA8 贴图:
//   G0 = √albedo, alpha
//   G1 = 高度梯度(压缩到 -1~1 再映射 0~1), gloss, ao
//   G2 = 自发光(e / (1 + e) 压缩), wet
//   G3 = 四个动画发光遮罩(0~1), 由区域的 zoneWallLive / zoneFloorLive 每帧调制

/** 烘焙端(GLSL3, 多目标输出)。 */
export const GBUF_WRITE_GLSL = /* glsl */ `
layout(location = 0) out highp vec4 gOut0;
layout(location = 1) out highp vec4 gOut1;
layout(location = 2) out highp vec4 gOut2;
layout(location = 3) out highp vec4 gOut3;

vec2 packGrad(vec2 g) {
  return g / (1.0 + abs(g)) * 0.5 + 0.5;
}

vec3 packEmit(vec3 e) {
  e = max(e, 0.0);
  return e / (1.0 + e);
}

/** 写出一个表面; 梯度按烘焙贴图的纹素求导(1 纹素 = 1 设计 px, 与原屏幕导数一致)。 */
void writeSurf(Surf s) {
  vec2 g = vec2(dFdx(s.height), dFdy(s.height));
  gOut0 = vec4(sqrt(clamp(s.albedo, 0.0, 1.0)), clamp(s.alpha, 0.0, 1.0));
  gOut1 = vec4(packGrad(g), clamp(s.gloss, 0.0, 1.0), clamp(s.ao, 0.0, 1.0));
  gOut2 = vec4(packEmit(s.emit), clamp(s.wet, 0.0, 1.0));
  gOut3 = clamp(s.anim, 0.0, 1.0);
}
`;

/** 实时端: 按世界坐标采样烘焙结果, 还原成 Surf(高度清零, 梯度单独输出)。 */
export const GBUF_READ_GLSL = /* glsl */ `
uniform sampler2D tG0;
uniform sampler2D tG1;
uniform sampler2D tG2;
uniform sampler2D tG3;
/** 烘焙区域的世界矩形 (x, y, w, h)。 */
uniform vec4 uBakeRect;

vec2 bakeUv(vec2 world) {
  return (world - uBakeRect.xy) / uBakeRect.zw;
}

Surf readBaked(vec2 uv, out vec2 grad) {
  vec4 g0 = texture2D(tG0, uv);
  vec4 g1 = texture2D(tG1, uv);
  vec4 g2 = texture2D(tG2, uv);
  Surf s = surfOf(g0.rgb * g0.rgb);
  s.alpha = g0.a;
  vec2 e = g1.xy * 2.0 - 1.0;
  grad = e / max(1.0 - abs(e), 1e-3);
  s.gloss = g1.z;
  s.ao = g1.w;
  s.emit = g2.rgb / max(1.0 - g2.rgb, 1e-3);
  s.wet = g2.a;
  s.anim = texture2D(tG3, uv);
  return s;
}
`;

/** 地面把 anim.w 让给高度(倒影扰动要用), 按 ±16 px 映射到 0~1。 */
export const FLOOR_HEIGHT_RANGE = 16;
