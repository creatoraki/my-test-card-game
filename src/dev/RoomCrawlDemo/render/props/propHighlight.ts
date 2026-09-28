// 道具通用着色主体: 调用各道具的 propShade / propSdf, 统一打光、接触暗部、已搜索去饱和、
// SDF 深色描边, 以及靠近时的脉冲高亮描边与外发光。

export const PROP_COMMON = /* glsl */ `
uniform float uAnim;
uniform float uSearched;
uniform float uFocus;
uniform float uFlip;
uniform float uPSeed;
uniform vec3 uProp;
uniform vec3 uAccent;
varying vec2 vLocal;
varying vec2 vWorld;

/** 伪 3D 盒子: 正面 y ∈ [0, h], 顶面 y ∈ [h, h + d](纵深压成等高)。返回 1 正面 / 2 顶面 / 0 外部。 */
float boxFace(vec2 p, float w, float h, float d, out vec2 fuv) {
  fuv = vec2(p.x, p.y);
  if (abs(p.x) > w * 0.5) return 0.0;
  if (p.y >= 0.0 && p.y <= h) return 1.0;
  if (p.y > h && p.y <= h + d) {
    fuv = vec2(p.x, p.y - h);
    return 2.0;
  }
  return 0.0;
}
`;

export const PROP_MAIN = /* glsl */ `
void main() {
  vec2 p = vec2(vLocal.x * uFlip, vLocal.y);
  vec3 n = vec3(0.0, 0.0, 1.0);
  vec3 emit = vec3(0.0);
  float gloss = 0.2;
  vec4 alb = propShade(p, n, emit, gloss);
  n.x *= uFlip;
  vec3 pos = vec3(vWorld.x, max(vLocal.y, 0.0), uProp.z + 10.0);
  vec3 col = shade(alb.rgb, pos, normalize(n), gloss, 1.0);
  col *= mix(0.5, 1.0, smoothstep(0.0, 30.0, vLocal.y));
  col = mix(col, vec3(luma(col)) * 0.72, uSearched * 0.75);
  col = lowFog(col, vLocal.y, uProp.z);
  float a = alb.a;
  float d = propSdf(p);
  float ol = sdfOutline(d, 1.8) * (1.0 - a);
  // emit 视为预乘的加色光: 形体内外都可以发光(溢光、光晕)
  vec3 pm = col * a + C_OUTLINE * ol + emit;
  float oa = a + ol;
  // 靠近高亮: 外描边脉冲 + 柔和外发光
  float pulse = 0.65 + 0.35 * sin(uTime * 5.5);
  float ring = sdfOutline(d - 2.0, 2.6) * uFocus;
  float glow = exp(-max(d, 0.0) / 12.0) * step(0.0, d) * uFocus * 0.45;
  pm += uAccent * (ring * 1.8 + glow) * pulse;
  oa = max(oa, max(ring, glow * 0.6) * pulse);
  gl_FragColor = vec4(pm, oa);
}
`;
