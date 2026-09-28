// ② 泵站管廊后墙: 下半截刷绿漆的混凝土墙、三条横贯巨型管道(法兰 + 托架)、
// 带阀门轮与压力表的立管、通往竖井的拱形隧道口、上方敞开的管道夹层。灯具为网罩防爆灯。

export const PUMP_WALL = /* glsl */ `
vec3 pipePaint(vec2 p, float seed) {
  vec3 base = mix(vec3(0.08, 0.22, 0.2), vec3(0.14, 0.26, 0.22), hash11(seed));
  return weather(base, p, 1.0, 0.6, 1.0, seed);
}

void pumpPipe(vec2 p, float cy, float r, float seed, inout Surf s) {
  float hgt;
  float m = pipeH(p, cy, r, hgt);
  float fl = flange(p.x + seed * 97.0, 320.0, 16.0) * fillAA(abs(p.y - cy) - r - 5.0);
  float bolts = rivets(vec2(p.x + seed * 97.0 + 160.0, p.y - cy), vec2(320.0, r * 0.7), 2.4) * fl;
  vec3 c = pipePaint(vec2(p.x, p.y * 3.0), seed) * (1.0 + fl * 0.1);
  layerSurf(s, max(m, fl), c, r + hgt * 0.6 + fl * 6.0 + bolts, 0.4);
  s.alpha = max(s.alpha, max(m, fl));
  // 管道在墙上的接触阴影
  s.ao *= 1.0 - fillSoft(abs(p.y - cy + r * 0.4) - r * 1.1, r * 0.5) * (1.0 - m) * 0.5;
  // 托架
  float bx = mod(p.x + seed * 51.0, 480.0) - 240.0;
  float bracket = sdBox(vec2(bx, p.y - (cy - r - 14.0)), vec2(8.0, 14.0));
  layerSurf(s, fillAA(bracket), C_STEEL_DARK * 1.4, 8.0 + bevelH(bracket, 2.0) * 2.0, 0.4);
}

void pumpValve(vec2 q, float bay, inout Surf s) {
  float rh;
  float riser = pipeV(q, 0.0, 22.0, rh) * step(q.y, 250.0);
  layerSurf(s, riser, pipePaint(q * vec2(3.0, 1.0), bay + 3.0), 20.0 + rh, 0.4);
  // 阀门轮: 圆环 + 四根辐条, 红漆
  vec2 v = q - vec2(0.0, 170.0);
  float spin = roomRand(bay, 6.0) * 3.0;
  v = rot2(spin) * v;
  float ring = abs(length(v) - 30.0) - 4.5;
  float spokes = min(sdBox(v, vec2(30.0, 2.5)), sdBox(v, vec2(2.5, 30.0)));
  float hub = length(v) - 7.0;
  float wheel = min(min(ring, spokes), hub);
  vec3 red = weather(vec3(0.5, 0.06, 0.04), q, 0.6, 0.5, 0.5, bay);
  layerSurf(s, fillAA(wheel), red, 34.0 + bevelH(wheel, 2.5) * 3.0, 0.5);
  // 压力表
  vec2 g = q - vec2(46.0, 110.0);
  float dial = length(g) - 17.0;
  float face = fillAA(dial + 3.0);
  float needleA = -0.8 + roomRand(bay, 2.0) * 1.2;
  vec2 nd = rot2(needleA) * g;
  float needle = sdSegment(nd, vec2(0.0), vec2(0.0, 12.0)) - 1.2;
  float ticks = step(0.9, fract(atan(g.y, g.x) / 6.2832 * 12.0)) * fillAA(abs(length(g) - 11.5) - 2.5);
  layerSurf(s, fillAA(dial), C_STEEL * 1.2, 28.0 + bevelH(dial, 3.0) * 3.0, 0.7);
  s.albedo = mix(s.albedo, vec3(0.62, 0.6, 0.52), face * (1.0 - ticks * 0.8));
  s.albedo = mix(s.albedo, vec3(0.5, 0.05, 0.03), fillAA(needle) * face);
  float stem = fillAA(sdBox(q - vec2(24.0, 110.0), vec2(10.0, 3.0)));
  layerSurf(s, stem, C_STEEL, 24.0, 0.5);
}

void pumpTunnel(vec2 q, inout Surf s) {
  vec2 a = q - vec2(0.0, 170.0);
  float arch = min(sdBox(a + vec2(0.0, 60.0), vec2(130.0, 110.0)), length(a - vec2(0.0, 50.0)) - 130.0);
  arch = max(arch, -q.y);
  float frame = arch - 18.0;
  float fm = fillAA(frame);
  float edge = clamp(-frame / 18.0, 0.0, 1.0);
  layerSurf(s, fm * (1.0 - fillAA(arch)), weather(C_CONCRETE * 0.9, q, 1.2, 0.1, 1.0 - edge, 5.0), 10.0 + bevelH(frame, 8.0) * 5.0, 0.12);
  s.alpha *= 1.0 - fillAA(arch);
}

Surf zoneWall(vec2 p) {
  float x = p.x;
  float h = p.y;
  vec3 green = weather(C_PAINT_GREEN * 0.9, p, 1.0, 0.25, 1.0, uSeed);
  vec3 grey = weather(C_CONCRETE * 0.8, p, 1.3, 0.05, 1.0, uSeed + 1.0);
  float band = step(h, 150.0);
  Surf s = surfOf(mix(grey, green, band));
  float stripe = fillAA(abs(h - 152.0) - 3.0);
  s.albedo = mix(s.albedo, C_HAZARD * 0.6, stripe);
  // 瓷砖分缝(下半截)
  vec2 tq = abs(fract(p / vec2(60.0, 30.0)) - 0.5) * vec2(60.0, 30.0);
  float tile = fillAA(min(30.0 - tq.x, 15.0 - tq.y) - 0.9) * band;
  s.albedo *= 1.0 - tile * 0.35;
  s.height = -tile * 1.2 + fbm3(p * 0.1) * 1.0;
  // 渗水的深色水渍
  s.albedo *= 1.0 - streaks(p * vec2(1.0, 0.6), uSeed + 2.0) * 0.45;

  float bayW = 832.0;
  float bay = floor(x / bayW);
  vec2 q = vec2(x - (bay + 0.5) * bayW, h);
  float kind = floor(roomRand(bay, 1.0) * 3.0);
  float nearDoor = step(abs(x - uUpDoorX), 520.0);
  if (kind < 0.5 && nearDoor < 0.5) pumpTunnel(q, s);
  else pumpValve(q - vec2(-220.0, 0.0), bay, s);

  pumpPipe(p, 118.0, 30.0, uSeed + 11.0, s);
  pumpPipe(p, 262.0, 46.0, uSeed + 23.0, s);
  pumpPipe(p, 346.0, 15.0, uSeed + 31.0, s);

  // 上方敞开的管道夹层
  float lip = fillAA(abs(h - 372.0) - 8.0);
  s.alpha *= step(h, 372.0) + lip;
  layerSurf(s, lip, C_CONCRETE_DARK, 6.0, 0.1);
  float kick = fillAA(h - 24.0);
  layerSurf(s, kick, C_STEEL_DARK * 1.5, 3.0 + rivets(p, vec2(40.0, 24.0), 2.0), 0.35);
  return s;
}
`;

/** 每帧: 动画发光调制与灯具外形(实时材质只拼这一段, 不含烘焙部分)。 */
export const PUMP_WALL_LIVE = /* glsl */ `

vec3 zoneWallLive(vec2 p, vec4 anim) {
  return vec3(0.0);
}

void zoneFixture(vec2 d, float level, vec3 light, inout Surf s) {
  float base = sdRoundBox(d - vec2(0.0, 0.0), vec2(24.0, 18.0), 8.0);
  float glassD = sdEllipse(d, vec2(17.0, 12.0));
  vec2 cq = d;
  float cage = max(min(abs(mod(cq.x + 6.0, 12.0) - 6.0) - 1.4, abs(cq.y) - 1.4), glassD - 1.0);
  float bm = fillAA(base);
  layerSurf(s, bm, C_STEEL_DARK * 1.5, 6.0 + bevelH(base, 3.0) * 4.0, 0.5);
  s.alpha = max(s.alpha, bm);
  vec3 lc = light / max(max(light.r, max(light.g, light.b)), 1e-3);
  float gm = fillAA(glassD);
  s.albedo = mix(s.albedo, vec3(0.8, 0.95, 0.9), gm);
  s.emit += lc * gm * (0.5 + level * 4.5) * (1.0 - fillAA(cage) * 0.8);
  s.emit += lc * exp(-length(d) / 30.0) * level * 0.7;
}
`;
