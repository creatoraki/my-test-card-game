// ① 货运入口后墙: 清水混凝土墙板 + 立柱 + 三种开间(半开卷帘门 / 碎玻璃装卸窗 / 地面标识漆)
// + 工字钢梁 + 破损天窗带 + 黄黑踢脚。灯具为带支架的钠灯。

export const DOCK_WALL = /* glsl */ `
void dockShutter(vec2 q, float bay, inout Surf s) {
  float open = 46.0 + roomRand(bay, 3.0) * 70.0;
  float door = sdBox(q - vec2(0.0, 143.0), vec2(230.0, 143.0));
  float rail = sdBox(vec2(abs(q.x) - 238.0, q.y - 150.0), vec2(8.0, 150.0));
  float housing = sdRoundBox(q - vec2(0.0, 300.0), vec2(252.0, 15.0), 3.0);
  // 门洞里面: 暗处透出暖光
  if (door < 0.0 && q.y < open) {
    float depth = q.y / open;
    vec3 inner = mix(vec3(0.02, 0.018, 0.016), vec3(0.08, 0.05, 0.03), depth);
    layerSurf(s, 1.0, inner, -10.0, 0.05);
    // 暖光强度随时间呼吸: 遮罩烘焙, 发光由 zoneWallLive 叠加
    s.anim.x = max(s.anim.x, 1.0 - depth);
    s.ao = 0.4;
  } else if (door < 0.0) {
    float k = (q.y - open) / 16.0;
    float rib = sin(fract(k) * 3.14159);
    vec3 paint = mix(vec3(0.2, 0.24, 0.25), vec3(0.28, 0.27, 0.22), roomRand(bay, 5.0));
    vec3 c = weather(paint * (0.75 + rib * 0.3), q + bay * 91.0, 1.2, 0.35, abs(q.x) / 230.0 < 0.95 ? 1.0 : 0.0, bay);
    // 凹痕: 低频扭曲
    float dent = fbm3(q * 0.02 + bay) - 0.5;
    layerSurf(s, fillAA(door), c, rib * 2.5 + dent * 3.0, 0.3);
    // 底梁
    float bar = fillAA(abs(q.y - open - 5.0) - 5.0);
    layerSurf(s, bar * fillAA(door), C_STEEL_DARK * 1.5, 5.0, 0.5);
  }
  layerSurf(s, fillAA(rail), C_STEEL_DARK * 1.2, 6.0 + bevelH(rail, 3.0) * 2.0, 0.45);
  float hm = fillAA(housing);
  layerSurf(s, hm, weather(vec3(0.2, 0.21, 0.2), q, 1.0, 0.4, 1.0, bay + 2.0), 8.0 + bevelH(housing, 4.0) * 4.0, 0.3);
}

void dockWindow(vec2 q, float bay, inout Surf s) {
  float frame = sdBox(q - vec2(0.0, 205.0), vec2(205.0, 98.0));
  if (frame > 0.0) return;
  vec2 cell;
  vec2 wq = q - vec2(-205.0, 107.0);
  float bars = windowGrid(wq, vec2(102.5, 98.0), 6.0, cell);
  float outer = 1.0 - fillAA(-frame - 10.0);
  float pane = hash12(cell + bay * 3.3 + uSeed);
  // 破掉的格子: 从中心向外撕开的不规则洞
  vec2 local = mod(wq, vec2(102.5, 98.0)) - vec2(51.25, 49.0);
  float tear = fbm3(local * 0.06 + pane * 20.0) * 40.0;
  float hole = step(0.4, pane) * (1.0 - smoothstep(-2.0, 2.0, length(local * vec2(1.0, 1.1)) - 26.0 - tear - pane * 30.0));
  vec3 glass = vec3(0.05, 0.07, 0.09) + vec3(0.06) * fbm3(q * 0.05);
  s.albedo = glass;
  s.gloss = 0.9;
  s.height = 0.0;
  s.alpha = mix(0.5, 0.0, hole);
  float fm = max(bars, outer);
  layerSurf(s, fm, weather(C_STEEL * 0.8, q, 1.0, 0.5, 0.5, bay), 5.0, 0.35);
  s.alpha = max(s.alpha, fm);
}

void dockPainted(vec2 q, float bay, inout Surf s) {
  // 装卸区地标: 圆环 + 向下的双箭头(褪色黄漆)
  vec2 c = q - vec2(-60.0, 200.0);
  float ring = abs(length(c) - 78.0) - 9.0;
  vec2 a = vec2(abs(c.x), c.y);
  float arrow = min(sdSegment(a, vec2(0.0, 40.0), vec2(34.0, 6.0)), sdSegment(a, vec2(0.0, 0.0), vec2(34.0, -34.0))) - 8.0;
  float mark = min(ring, arrow);
  float fade = smoothstep(0.3, 0.62, fbm(q * 0.03 + bay));
  s.albedo = mix(s.albedo, C_HAZARD * 0.75, fillAA(mark) * (1.0 - fade) * 0.9);
  // 配电箱 + 导线管
  vec2 b = q - vec2(170.0, 150.0);
  float box = sdRoundBox(b, vec2(42.0, 54.0), 4.0);
  float bm = fillAA(box);
  vec3 bc = weather(vec3(0.22, 0.25, 0.22), b, 1.2, 0.4, clamp(-box / 20.0, 0.0, 1.0), bay + 9.0);
  layerSurf(s, bm, bc, 9.0 + bevelH(box, 3.0) * 3.0 - fillAA(abs(b.y) - 1.0) * 2.0, 0.35);
  float led = fillAA(length(b - vec2(26.0, 38.0)) - 3.5);
  s.anim.y = max(s.anim.y, led);
  float conduitH;
  float conduit = pipeV(q, 170.0, 5.0, conduitH) * step(204.0, q.y) * step(q.y, 318.0);
  layerSurf(s, conduit, C_STEEL * 0.9, conduitH + 6.0, 0.5);
}

Surf zoneWall(vec2 p) {
  float x = p.x;
  float h = p.y;
  vec2 pp = p / vec2(240.0, 110.0);
  vec2 pf = abs(fract(pp) - 0.5) * vec2(240.0, 110.0);
  float seam = fillAA(min(120.0 - pf.x, 55.0 - pf.y) - 1.2);
  vec2 tq = mod(p + vec2(40.0, 27.0), vec2(80.0, 55.0)) - vec2(40.0, 27.5);
  float tie = fillAA(length(tq) - 2.4);
  Surf s = surfOf(mix(C_CONCRETE, C_CONCRETE_DARK, 0.3));
  s.albedo *= (0.9 + 0.2 * hash12(floor(pp) + uSeed)) * (1.0 - seam * 0.35 - tie * 0.5);
  s.albedo = weather(s.albedo, p, 1.1, 0.05, 1.0, uSeed);
  s.height = -seam * 2.0 - tie * 1.5 + fbm3(p * 0.08) * 1.2;

  float bayW = 720.0;
  float bay = floor(x / bayW);
  vec2 q = vec2(x - bay * bayW - bayW * 0.5, h);
  float kind = floor(roomRand(bay, 1.0) * 3.0);
  if (kind < 0.5) dockShutter(q, bay, s);
  else if (kind < 1.5) dockWindow(q, bay, s);
  else dockPainted(q, bay, s);

  // 立柱(中心在开间边界) + 黄黑包角
  float edgeDist = bayW * 0.5 - abs(q.x);
  float pil = edgeDist - 38.0;
  float pm = fillAA(pil);
  float pedge = clamp(edgeDist / 38.0, 0.0, 1.0);
  vec3 pc = h < 92.0 ? hazard(p, 34.0, uSeed) : weather(C_CONCRETE * 1.05, p + 400.0, 1.0, 0.05, 1.0 - pedge, uSeed + 4.0);
  layerSurf(s, pm, pc, 10.0 + bevelH(pil, 6.0) * 6.0, 0.15);
  s.ao *= 1.0 - fillSoft(pil - 10.0, 10.0) * (1.0 - pm) * 0.35;

  // 横贯的导线管与卡箍
  float cH;
  float cond = pipeV(vec2(h, x), 262.0, 5.0, cH);
  float clip = fillAA(abs(mod(x, 180.0) - 90.0) - 4.0) * fillAA(abs(h - 262.0) - 8.0);
  layerSurf(s, max(cond, clip), C_STEEL * 0.85, 5.0 + cH + clip * 2.0, 0.55);

  // 工字钢梁
  float beam = fillAA(abs(h - 332.0) - 16.0);
  float flangeLine = fillAA(abs(abs(h - 332.0) - 13.0) - 1.5);
  vec3 bc = weather(vec3(0.16, 0.14, 0.12), p, 1.0, 0.55, 1.0, uSeed + 8.0);
  float riv = rivets(vec2(x, h - 332.0 + 13.0), vec2(38.0, 26.0), 2.4);
  layerSurf(s, beam, bc * (1.0 - flangeLine * 0.4), 9.0 + riv - flangeLine * 2.0, 0.35);

  // 天窗带: 碎掉的格子透出夜空
  if (h > 350.0) {
    vec2 cell;
    float bars = windowGrid(p - vec2(0.0, 350.0), vec2(150.0, 84.0), 7.0, cell);
    float broken = step(0.42, hash12(cell + uSeed * 1.3));
    s.albedo = vec3(0.04, 0.05, 0.065);
    s.gloss = 0.85;
    s.height = 0.0;
    s.alpha = mix(0.42, 0.0, broken);
    layerSurf(s, bars, C_STEEL_DARK * 1.3, 6.0, 0.4);
    s.alpha = max(s.alpha, bars);
  }

  // 踢脚: 磨损的黄黑斑马线
  float kick = fillAA(h - 30.0);
  layerSurf(s, kick * (1.0 - pm), hazard(p, 40.0, uSeed + 2.0) * 0.8, 3.0, 0.2);
  return s;
}
`;

/** 每帧: 动画发光调制与灯具外形(实时材质只拼这一段, 不含烘焙部分)。 */
export const DOCK_WALL_LIVE = /* glsl */ `
/** A = 卷帘门内暖光(呼吸), B = 配电箱指示灯(闪烁)。 */
vec3 zoneWallLive(vec2 p, vec4 anim) {
  float bay = floor(p.x / 720.0);
  float glow = 0.8 + 0.2 * sin(uTime * 1.3 + bay);
  float blink = step(0.5, fract(uTime * 0.8 + bay)) * 3.0 + 0.3;
  return vec3(1.0, 0.55, 0.2) * anim.x * 0.35 * glow + vec3(1.0, 0.12, 0.05) * anim.y * blink;
}

void zoneFixture(vec2 d, float level, vec3 light, inout Surf s) {
  float plate = sdRoundBox(d - vec2(0.0, 38.0), vec2(12.0, 16.0), 3.0);
  float arm = sdSegment(d, vec2(0.0, 12.0), vec2(0.0, 30.0)) - 3.0;
  float housing = sdTrapezoid(d - vec2(0.0, 9.0), 30.0, 15.0, 9.0);
  float body = min(min(plate, arm), housing);
  layerSurf(s, fillAA(body), C_STEEL_DARK * 1.6, 5.0 + bevelH(body, 3.0) * 3.0, 0.45);
  s.alpha = max(s.alpha, fillAA(body));
  float bulb = sdEllipse(d - vec2(0.0, -2.0), vec2(22.0, 6.0));
  float bm = fillAA(bulb);
  vec3 lc = light / max(max(light.r, max(light.g, light.b)), 1e-3);
  s.albedo = mix(s.albedo, vec3(0.9), bm);
  s.alpha = max(s.alpha, bm);
  s.emit += lc * bm * (0.6 + level * 6.0);
  s.emit += lc * exp(-length(d * vec2(0.55, 1.0)) / 24.0) * level * 0.9;
}
`;
