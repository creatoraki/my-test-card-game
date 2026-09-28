// ⑤ 冷却核心后墙: 铆接厚钢板 + 大圆形风道观察口(护栅残破, 透出背后的风扇)+ 红黑警示带
// + 从地面向上蔓延的黑色腐化触须(脉动的红色内光)。灯具为旋转警报灯。

export const CORE_WALL = /* glsl */ `
/** 腐化程度 0~1: 按横向成簇, 从墙根向上爬。veins 输出脉络遮罩(脉动由 zoneWallLive 叠加)。 */
float corruption(vec2 p, out float veins) {
  float cluster = smoothstep(0.35, 0.75, fbm3(vec2(p.x * 0.0016 + uSeed, 1.0)));
  float reach = cluster * 330.0;
  vec2 w = p + vec2(fbm3(p * 0.01) * 60.0, fbm3(p * 0.01 + 7.0) * 40.0);
  float tendril = ridged(vec2(w.x * 0.012, w.y * 0.004));
  float body = smoothstep(0.0, 60.0, reach - p.y + tendril * 140.0 - 40.0);
  float fingers = smoothstep(0.62, 0.8, tendril) * smoothstep(-120.0, 0.0, reach - p.y + 60.0) * cluster;
  float m = clamp(max(body, fingers), 0.0, 1.0);
  veins = smoothstep(0.8, 0.95, ridged(w * 0.03)) * m;
  return m;
}

void corePort(vec2 q, float bay, inout Surf s) {
  vec2 c = q - vec2(0.0, 205.0);
  float r = length(c);
  float hole = r - 150.0;
  float ring = abs(r - 166.0) - 18.0;
  s.alpha *= 1.0 - fillAA(hole);
  float ang = atan(c.y, c.x);
  // 护栅: 横条 + 放射条, 部分折断
  float broken = step(0.5, fbm3(c * 0.02 + bay * 3.0));
  float bars = fillAA(abs(mod(c.y + 150.0, 36.0) - 18.0) - 2.5) * (1.0 - broken * step(c.x, 40.0) * step(-60.0, c.y));
  float spokes = fillAA(abs(fract(ang / 6.2832 * 8.0) - 0.5) * r * 0.785 - 2.5) * step(40.0, r);
  float grate = max(bars, spokes) * fillAA(hole);
  layerSurf(s, grate, vec3(0.05, 0.04, 0.04), 6.0, 0.4);
  s.alpha = max(s.alpha, grate);
  float boltRing = rivets(vec2(ang * 166.0, r - 166.0), vec2(34.0, 36.0), 3.5);
  vec3 rc = weather(vec3(0.16, 0.14, 0.13), vec2(ang * 166.0, r), 1.0, 0.6, 1.0, bay);
  layerSurf(s, fillAA(ring), rc, 14.0 + bevelH(ring, 6.0) * 6.0 + boltRing, 0.4);
  // 观察口边缘被背后核心照亮
  s.emit += vec3(1.0, 0.25, 0.06) * exp(-max(hole, 0.0) / 10.0) * fillAA(ring) * 0.25;
}

Surf zoneWall(vec2 p) {
  float x = p.x;
  float h = p.y;
  vec2 pp = p / vec2(160.0, 100.0);
  vec2 pq = abs(fract(pp) - 0.5) * vec2(160.0, 100.0);
  float seam = fillAA(min(80.0 - pq.x, 50.0 - pq.y) - 1.4);
  // 沿板缝内侧一圈铆钉
  vec2 rq = vec2(pq.x - 70.0, mod(p.y, 20.0) - 10.0);
  vec2 rq2 = vec2(mod(p.x, 20.0) - 10.0, pq.y - 41.0);
  float riv = max(sqrt(max(4.8 - dot(rq, rq), 0.0)), sqrt(max(4.8 - dot(rq2, rq2), 0.0)));
  vec3 plate = vec3(0.13, 0.11, 0.105) * (0.85 + 0.3 * hash12(floor(pp) + uSeed));
  Surf s = surfOf(weather(plate * (1.0 - seam * 0.5), p, 1.2, 0.55, 1.0, uSeed));
  s.gloss = 0.35;
  s.height = -seam * 2.0 + riv + fbm3(p * 0.05) * 1.5;

  float bayW = 1152.0;
  float bay = floor(x / bayW);
  vec2 q = vec2(x - (bay + 0.5) * bayW, h);
  if (abs(x - uUpDoorX) > 380.0) corePort(q, bay, s);

  // 红黑警示带
  float band = fillAA(abs(h - 58.0) - 14.0);
  vec2 hp = vec2(x, h);
  vec3 stripes = mix(vec3(0.02), vec3(0.45, 0.04, 0.03), step(0.5, fract((hp.x + hp.y) / 44.0)));
  stripes = mix(stripes, vec3(0.1, 0.08, 0.07), smoothstep(0.55, 0.7, fbm3(hp * 0.06)));
  layerSurf(s, band, stripes, 3.0, 0.3);
  // 顶部红色应急灯带
  float strip = fillAA(abs(h - 372.0) - 4.0);
  float seg = step(0.2, fract(x / 90.0));
  layerSurf(s, strip, vec3(0.3, 0.05, 0.04), 5.0, 0.6);
  s.anim.x = max(s.anim.x, strip * seg);
  s.emit += vec3(0.8, 0.06, 0.03) * exp(-abs(h - 372.0) * 0.08) * 0.15;

  // 腐化触须: 油亮的黑, 脉络透出红光
  float veins;
  float cor = corruption(p, veins);
  vec3 ooze = vec3(0.012, 0.006, 0.01) + vec3(0.06, 0.01, 0.03) * fbm3(p * 0.05);
  layerSurf(s, cor, ooze, 10.0 * cor + ridged(p * 0.05) * 3.0, 0.85);
  s.alpha = max(s.alpha, cor);
  s.anim.y = max(s.anim.y, veins);
  s.anim.z = max(s.anim.z, cor * (1.0 - cor) * 4.0);
  float kick = fillAA(h - 22.0) * (1.0 - cor);
  layerSurf(s, kick, vec3(0.06, 0.05, 0.05), 3.0, 0.3);
  return s;
}
`;

/** 每帧: 动画发光调制与灯具外形(实时材质只拼这一段, 不含烘焙部分)。 */
export const CORE_WALL_LIVE = /* glsl */ `
/** A = 顶部应急灯带, B = 腐化脉络(沿墙面传播的脉动), C = 腐化边缘暗红晕(整体心跳)。 */
vec3 zoneWallLive(vec2 p, vec4 anim) {
  if (anim.x + anim.y + anim.z < 0.004) return vec3(0.0);
  float stripPulse = 0.6 + 0.4 * sin(uTime * 3.0 + p.x * 0.002);
  float veinPulse = 0.5 + 0.5 * sin(uTime * 2.2 - p.y * 0.03 + p.x * 0.004);
  float rimPulse = 0.5 + 0.5 * sin(uTime * 2.2);
  return vec3(1.0, 0.08, 0.04) * anim.x * stripPulse * 1.6
    + vec3(1.0, 0.06, 0.1) * anim.y * veinPulse * 1.6
    + vec3(0.4, 0.02, 0.05) * anim.z * rimPulse;
}

void zoneFixture(vec2 d, float level, vec3 light, inout Surf s) {
  float base = sdRoundBox(d - vec2(0.0, -12.0), vec2(20.0, 7.0), 2.0);
  float dome = max(sdEllipse(d - vec2(0.0, -5.0), vec2(16.0, 24.0)), -(d.y + 5.0));
  layerSurf(s, fillAA(base), vec3(0.06, 0.05, 0.05), 5.0 + bevelH(base, 2.0) * 2.0, 0.5);
  s.alpha = max(s.alpha, fillAA(base));
  vec3 lc = light / max(max(light.r, max(light.g, light.b)), 1e-3);
  float dm = fillAA(dome);
  // 旋转反光罩: 穹罩上一条亮带左右扫过
  float sweep = sin(uTime * 3.6) * 12.0;
  float band = exp(-abs(d.x - sweep) * 0.25);
  s.albedo = mix(s.albedo, vec3(0.4, 0.05, 0.04), dm);
  s.alpha = max(s.alpha, dm);
  s.emit += lc * dm * (0.4 + level * 2.5 + band * level * 4.0);
  // 墙面上扫过的光束
  float beamDir = cos(uTime * 3.6);
  float beam = exp(-abs(d.y + 5.0) / (8.0 + abs(d.x) * 0.12)) * smoothstep(0.0, 0.3, beamDir * sign(d.x)) * exp(-abs(d.x) / 220.0);
  s.emit += lc * beam * level * 0.9;
}
`;
