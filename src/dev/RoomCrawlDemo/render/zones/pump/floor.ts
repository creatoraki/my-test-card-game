// ② 泵站管廊地面: 贴墙与中段是花纹钢板走道, 其余为格栅, 栅孔下是流动的水面与焦散光。

export const PUMP_FLOOR = /* glsl */ `
Surf zoneFloor(vec2 p) {
  float x = p.x;
  float z = p.y;
  vec2 fp = vec2(x, z * 2.0);
  float walk = step(z, 44.0) + step(abs(z - 168.0), 40.0);
  Surf s;
  if (walk > 0.5) {
    // 花纹钢板: 交错的短斜条凸起
    vec2 d = fp / vec2(22.0, 22.0);
    vec2 dc = floor(d);
    vec2 df = fract(d) - 0.5;
    float ang = mod(dc.x + dc.y, 2.0) < 1.0 ? 0.785 : -0.785;
    vec2 r = rot2(ang) * df;
    float bump = fillAA(sdBox(r, vec2(0.32, 0.07)) * 22.0);
    vec3 steel = weather(C_STEEL * 0.8, fp, 1.0, 0.45, 1.0, uSeed + 5.0);
    s = surfOf(steel * (1.0 + bump * 0.18));
    s.height = bump * 1.8;
    s.gloss = 0.45;
    // 板缝与螺栓
    float seam = fillAA(158.5 - abs(mod(x, 320.0) - 160.0)) +fillAA(abs(z - 44.0) - 1.0) + fillAA(abs(abs(z - 168.0) - 40.0) - 1.0);
    s.albedo *= 1.0 - clamp(seam, 0.0, 1.0) * 0.6;
    s.height += rivets(vec2(mod(x, 320.0), z * 2.0), vec2(320.0, 34.0), 2.5);
  } else {
    // 格栅: 栅条 + 下方水面
    vec2 g = vec2(x, z * 2.0);
    float bars = grille(g, vec2(18.0, 36.0), 4.0);
    float mainBar = fillAA(77.0 - abs(mod(x, 160.0) - 80.0));
    // 水面底色烘焙; 流动的焦散光由 zoneFloorLive 每帧叠加
    vec3 water = vec3(0.004, 0.028, 0.03);
    vec3 steel = weather(C_STEEL_DARK * 1.7, fp, 1.0, 0.55, 0.4, uSeed + 9.0);
    float m = max(bars, mainBar);
    s = surfOf(mix(water, steel, m));
    s.height = m * 3.0 + mainBar * 1.5;
    s.gloss = mix(0.9, 0.35, m);
    s.emit = water * 0.3 * (1.0 - m);
    s.anim.x = 1.0 - m;
    s.wet = (1.0 - m) * 0.5;
    s.ao = mix(0.5, 1.0, m);
  }
  // 积水: 钢板上的零散水渍
  float pud = smoothstep(0.6, 0.64, fbm(vec2(x * 0.004, z * 0.012) + uSeed)) * walk;
  s.albedo = mix(s.albedo, s.albedo * 0.35, pud);
  s.gloss = mix(s.gloss, 0.95, pud);
  s.wet = max(s.wet, pud);
  return s;
}
`;

/** 每帧: 动画发光调制(实时材质只拼这一段, 不含烘焙部分)。 */
export const PUMP_FLOOR_LIVE = /* glsl */ `
/** A = 栅孔下的水面: 两层流动 Voronoi 焦散。 */
vec3 zoneFloorLive(vec2 p, vec4 anim) {
  if (anim.x < 0.01) return vec3(0.0);
  float t = uTime;
  vec2 wp = vec2(p.x * 0.01 + t * 0.12, p.y * 0.03 - t * 0.05);
  float c1 = voronoiF1(wp * 2.2);
  float c2 = voronoiF1(wp * 3.1 + 4.0);
  float caust = pow(1.0 - min(c1, c2), 6.0);
  return (vec3(0.05, 0.36, 0.3) * 0.165 + vec3(0.02, 0.18, 0.15) * 0.4) * caust * anim.x;
}
`;
