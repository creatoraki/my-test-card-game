// ④ 数据机房后墙: 金属墙板 + 成排机柜(穿孔门板、闪烁指示灯)+ 透出数据瀑布的玻璃墙
// + 下垂线缆的走线槽 + 顶部风管 + 带出风格栅的踢脚。灯具为条形 LED 面板。

export const SERVER_WALL = /* glsl */ `
void serverRack(vec2 q, inout Surf s) {
  float body = sdBox(q - vec2(0.0, 150.0), vec2(46.0, 150.0));
  if (body > 2.0) return;
  float edge = clamp(-body / 8.0, 0.0, 1.0);
  vec3 frame = vec3(0.035, 0.04, 0.05);
  // 穿孔门板
  vec2 hp = q * vec2(1.0, 1.0);
  vec2 hc = mod(hp, vec2(6.0, 6.0)) - 3.0;
  float perf = fillAA(length(hc) - 1.3);
  vec3 door = mix(vec3(0.07, 0.08, 0.095), vec3(0.01, 0.015, 0.02), perf * 0.8);
  float inner = sdBox(q - vec2(0.0, 150.0), vec2(38.0, 138.0));
  vec3 c = mix(frame, door, fillAA(inner));
  // 设备层与指示灯
  float uy = mod(q.y - 12.0, 14.0);
  float slot = fillAA(abs(uy - 7.0) - 5.0) * fillAA(inner);
  c = mix(c, vec3(0.02, 0.022, 0.028), slot * 0.4);
  vec2 lq = vec2(mod(q.x + 38.0, 9.0) - 4.5, uy - 7.0);
  float led = fillAA(length(lq) - 1.4) * step(q.x, -8.0) * fillAA(inner);
  // 指示灯颜色与闪烁节奏按格子在 zoneWallLive 里还原
  s.anim.x = max(s.anim.x, led);
  // 机柜把手
  float handle = fillAA(sdRoundBox(q - vec2(30.0, 150.0), vec2(2.5, 26.0), 2.0));
  c = mix(c, C_STEEL * 1.3, handle);
  layerSurf(s, fillAA(body), c, 12.0 + bevelH(body, 4.0) * 4.0 + handle * 3.0, mix(0.3, 0.6, handle));
  s.ao *= mix(1.0, 0.8, 1.0 - edge);
}

void serverGlass(vec2 q, inout Surf s) {
  float pane = sdBox(q - vec2(0.0, 180.0), vec2(170.0, 150.0));
  if (pane > 12.0) return;
  float inside = fillAA(pane);
  s.albedo = mix(s.albedo, vec3(0.03, 0.05, 0.08), inside);
  s.gloss = mix(s.gloss, 0.95, inside);
  s.height = mix(s.height, 0.0, inside);
  s.alpha *= mix(1.0, 0.22, inside);
  // 斜向反光与凝结水雾
  float streak = 1.0 - smoothstep(0.0, 1.0, abs(fract((q.x + q.y * 0.7) / 260.0) - 0.5) * 8.0);
  float fog = smoothstep(0.5, 0.8, fbm(q * 0.02)) * smoothstep(120.0, 40.0, q.y);
  s.emit += vec3(0.08, 0.12, 0.18) * streak * inside * 0.35;
  s.albedo += vec3(0.15, 0.2, 0.25) * fog * inside;
  s.alpha = max(s.alpha, fog * inside * 0.6);
  float frame = abs(pane) - 6.0;
  float mull = fillAA(abs(q.x) - 4.0) * inside;
  float fm = max(fillAA(frame), mull);
  layerSurf(s, fm, vec3(0.1, 0.11, 0.13), 6.0, 0.7);
  s.alpha = max(s.alpha, fm);
}

Surf zoneWall(vec2 p) {
  float x = p.x;
  float h = p.y;
  vec2 pp = p / vec2(120.0, 80.0);
  vec2 pq = abs(fract(pp) - 0.5) * vec2(120.0, 80.0);
  float seam = fillAA(min(60.0 - pq.x, 40.0 - pq.y) - 1.0);
  vec3 panel = vec3(0.1, 0.115, 0.13) * (0.9 + 0.2 * hash12(floor(pp) + uSeed));
  Surf s = surfOf(weather(panel * (1.0 - seam * 0.5), p, 0.6, 0.1, 1.0, uSeed));
  s.gloss = 0.35;
  s.height = -seam * 1.5 + rivets(p + vec2(0.0, 40.0), vec2(120.0, 80.0) * 0.5, 1.8) * 0.6;

  float bayW = 960.0;
  float bay = floor(x / bayW);
  vec2 q = vec2(x - (bay + 0.5) * bayW, h);
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    serverRack(q - vec2(-420.0 + fi * 100.0, 0.0), s);
  }
  serverGlass(q - vec2(170.0, 0.0), s);

  // 走线槽 + 下垂线缆
  float tray = fillAA(abs(h - 346.0) - 9.0);
  float trayRail = fillAA(abs(abs(h - 346.0) - 8.0) - 1.5);
  layerSurf(s, tray, vec3(0.08, 0.085, 0.09) * (1.0 - trayRail * 0.4), 8.0 + trayRail * 2.0, 0.5);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float span = 240.0 + fi * 60.0;
    float u = mod(x + fi * 97.0 + uSeed * 40.0, span);
    float sagA = (18.0 + fi * 10.0) * 4.0 * (u / span) * (1.0 - u / span);
    float cy = 336.0 - sagA;
    float cable = fillAA(abs(h - cy) - 2.2 - fi * 0.4);
    vec3 cc = fi < 0.5 ? vec3(0.02, 0.1, 0.25) : fi < 1.5 ? vec3(0.25, 0.2, 0.03) : vec3(0.03, 0.03, 0.035);
    layerSurf(s, cable, cc, 14.0 + (2.2 - abs(h - cy)), 0.4);
  }
  // 顶部风管
  float duct = fillAA(abs(h - 400.0) - 22.0);
  float ductSeam = fillAA(88.0 - abs(mod(x, 180.0) - 90.0));
  layerSurf(s, duct, vec3(0.14, 0.15, 0.16) * (1.0 - ductSeam * 0.4), 10.0 + ductSeam * 2.0 + bevelH(abs(h - 400.0) - 22.0, 4.0) * 3.0, 0.45);
  // 踢脚出风格栅
  float kick = fillAA(h - 26.0);
  float vent = grille(vec2(x, h), vec2(8.0, 26.0), 3.0) * step(0.5, fract(x / 480.0));
  layerSurf(s, kick, mix(vec3(0.06, 0.065, 0.07), vec3(0.01), vent * 0.7), 3.0 - vent * 2.0, 0.4);
  s.emit += vec3(0.1, 0.25, 0.5) * vent * kick * 0.15;
  return s;
}
`;

/** 每帧: 动画发光调制与灯具外形(实时材质只拼这一段, 不含烘焙部分)。 */
export const SERVER_WALL_LIVE = /* glsl */ `
/** A = 机柜指示灯: 由 x 反推机柜序号与指示灯格子, 还原颜色(绿 / 蓝 / 少量橙色告警)与闪烁。 */
vec3 zoneWallLive(vec2 p, vec4 anim) {
  if (anim.x < 0.004) return vec3(0.0);
  float bay = floor(p.x / 960.0);
  vec2 q = vec2(p.x - (bay + 0.5) * 960.0, p.y);
  float i = clamp(floor((q.x + 470.0) / 100.0), 0.0, 3.0);
  vec2 rq = q - vec2(-420.0 + i * 100.0, 0.0);
  vec2 ledCell = vec2((bay * 4.0 + i) * 13.0 + floor((rq.x + 38.0) / 9.0), floor((rq.y - 12.0) / 14.0));
  float blink = ledBlink(ledCell, uTime, 1.2);
  float warn = step(0.93, hash12(ledCell + 5.0));
  vec3 ledC = mix(mix(vec3(0.2, 1.0, 0.5), vec3(0.3, 0.6, 1.0), step(0.5, hash12(ledCell))), vec3(1.0, 0.5, 0.1), warn);
  return ledC * anim.x * blink * 2.2;
}

void zoneFixture(vec2 d, float level, vec3 light, inout Surf s) {
  float housing = sdRoundBox(d, vec2(72.0, 9.0), 3.0);
  float diffuser = sdRoundBox(d - vec2(0.0, -2.0), vec2(66.0, 4.0), 2.0);
  layerSurf(s, fillAA(housing), vec3(0.12, 0.13, 0.14), 6.0 + bevelH(housing, 2.0) * 2.0, 0.5);
  s.alpha = max(s.alpha, fillAA(housing));
  vec3 lc = light / max(max(light.r, max(light.g, light.b)), 1e-3);
  float dm = fillAA(diffuser);
  s.albedo = mix(s.albedo, vec3(0.9), dm);
  s.emit += mix(lc, vec3(1.0), 0.5) * dm * (0.5 + level * 4.0);
  s.emit += lc * exp(-length(d * vec2(0.25, 1.0)) / 18.0) * level * 0.6;
}
`;
