// ③ 霓虹旧商场地面: 抛光大瓷砖(双色棋盘)、裂缝、满地碎玻璃的闪点, 高光泽反射霓虹。

export const ARCADE_FLOOR = /* glsl */ `
Surf zoneFloor(vec2 p) {
  float x = p.x;
  float z = p.y;
  vec2 fp = vec2(x, z * 2.0);
  vec2 tp = fp / vec2(128.0, 128.0);
  vec2 tc = floor(tp);
  vec2 tq = abs(fract(tp) - 0.5) * 128.0;
  float grout = fillAA(min(64.0 - tq.x, 64.0 - tq.y) - 1.4);
  float checker = mod(tc.x + tc.y, 2.0);
  vec3 light = vec3(0.34, 0.31, 0.33);
  vec3 dark = vec3(0.07, 0.08, 0.1);
  vec3 tile = mix(light, dark, checker) * (0.9 + 0.2 * hash12(tc + uSeed));
  // 边缘细线装饰
  float inlay = fillAA(abs(max(tq.x, tq.y) - 52.0) - 1.2) * (1.0 - checker);
  tile = mix(tile, vec3(0.45, 0.36, 0.2), inlay * 0.7);
  Surf s = surfOf(weather(tile * (1.0 - grout * 0.6), fp, 0.7, 0.0, 1.0, uSeed + 3.0));
  s.gloss = 0.75;
  s.wet = 0.55;
  s.height = -grout * 1.4;

  // 裂缝: 翘起的碎砖
  float cr = cracks(fp, 0.008, 0.035);
  s.albedo *= 1.0 - cr * 0.7;
  s.height -= cr * 2.0;
  s.wet *= 1.0 - cr;

  // 碎玻璃: 细小的亮片, 高光随时间轻微闪烁
  vec2 gc = floor(fp / 9.0);
  vec2 gq = fract(fp / 9.0) - 0.5;
  float shard = hash12(gc + 3.3);
  float field = smoothstep(0.52, 0.66, fbm(fp * 0.004 + uSeed));
  float glass = step(0.8, shard) * field * fillAA(sdBox(rot2(shard * 6.28) * gq * 9.0, vec2(2.5, 1.0)));
  s.albedo = mix(s.albedo, vec3(0.5, 0.55, 0.6), glass);
  s.gloss = mix(s.gloss, 1.0, glass);
  s.height += glass * 2.0;
  s.anim.x = glass;

  // 脏污: 大块暗斑让反射有变化
  float dirt = smoothstep(0.45, 0.8, fbm(fp * 0.003 + 5.0));
  s.albedo *= 1.0 - dirt * 0.4;
  s.wet *= 1.0 - dirt * 0.6;
  s.gloss *= 1.0 - dirt * 0.5;
  return s;
}
`;

/** 每帧: 动画发光调制(实时材质只拼这一段, 不含烘焙部分)。 */
export const ARCADE_FLOOR_LIVE = /* glsl */ `
/** A = 碎玻璃: 每片按自身种子错开的闪点。 */
vec3 zoneFloorLive(vec2 p, vec4 anim) {
  if (anim.x < 0.004) return vec3(0.0);
  float shard = hash12(floor(vec2(p.x, p.y * 2.0) / 9.0) + 3.3);
  return vec3(0.8, 0.85, 1.0) * anim.x * pow(0.5 + 0.5 * sin(uTime * 3.0 + shard * 40.0), 12.0) * 0.8;
}
`;
