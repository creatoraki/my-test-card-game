// ④ 数据机房地面: 架空防静电地板。方砖细缝、成排的穿孔出风砖(下方透出冷光)、走线开孔、凝霜。

export const SERVER_FLOOR = /* glsl */ `
Surf zoneFloor(vec2 p) {
  float x = p.x;
  float z = p.y;
  vec2 fp = vec2(x, z * 2.0);
  vec2 tp = fp / 64.0;
  vec2 tc = floor(tp);
  vec2 tq = (fract(tp) - 0.5) * 64.0;
  float seam = fillAA(min(32.0 - abs(tq.x), 32.0 - abs(tq.y)) - 0.9);
  vec3 tile = vec3(0.2, 0.21, 0.23) * (0.92 + 0.16 * hash12(tc + uSeed));
  Surf s = surfOf(weather(tile * (1.0 - seam * 0.6), fp, 0.5, 0.0, 1.0, uSeed + 2.0));
  s.gloss = 0.4;
  s.height = -seam * 1.2;
  // 出风砖: 靠墙一排 + 随机散布
  float ventTile = max(step(tc.y, 1.0), step(0.86, hash12(tc + 3.1)));
  vec2 hq = mod(fp, vec2(8.0)) - 4.0;
  float hole = fillAA(length(hq) - 1.8) * fillAA(max(abs(tq.x), abs(tq.y)) - 26.0) * ventTile;
  s.albedo = mix(s.albedo, vec3(0.01, 0.02, 0.03), hole);
  s.anim.x = hole;
  s.height -= hole * 1.0;
  // 走线开孔: 深色矩形, 黑色毛刷
  float cut = fillAA(sdRoundBox(tq - vec2(0.0, 10.0), vec2(18.0, 7.0), 3.0)) * step(0.93, hash12(tc + 8.8)) * (1.0 - ventTile);
  s.albedo = mix(s.albedo, vec3(0.005), cut);
  s.height -= cut * 3.0;
  // 凝霜: 出风砖周围的白色霜花
  float frost = smoothstep(0.55, 0.85, fbm(fp * 0.01 + uSeed)) * smoothstep(0.4, 0.0, z / FLOOR_DEPTH);
  s.albedo = mix(s.albedo, vec3(0.55, 0.62, 0.7), frost * 0.5);
  s.gloss = mix(s.gloss, 0.7, frost);
  s.wet = 0.18 + frost * 0.3;
  return s;
}
`;

/** 每帧: 动画发光调制(实时材质只拼这一段, 不含烘焙部分)。 */
export const SERVER_FLOOR_LIVE = /* glsl */ `
/** A = 出风砖孔: 每块砖按自身种子呼吸的冷光。 */
vec3 zoneFloorLive(vec2 p, vec4 anim) {
  if (anim.x < 0.004) return vec3(0.0);
  vec2 tc = floor(vec2(p.x, p.y * 2.0) / 64.0);
  float cold = 0.6 + 0.4 * sin(uTime * 1.5 + hash12(tc) * 6.0);
  return vec3(0.1, 0.35, 0.8) * anim.x * cold * 0.35;
}
`;
