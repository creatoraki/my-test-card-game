// ③ 霓虹旧商场后墙: 大理石贴面壁柱 + 店铺门脸(碎橱窗 / 半落卷闸)+ 霓虹图形招牌(不用文字)
// + 可眺望中庭的观景缺口 + 楼板霓虹灯带 + 垂挂的破横幅。灯具为竖向霓虹灯管。

export const ARCADE_WALL = /* glsl */ `
float sdStar5(vec2 p, float r, float rf) {
  const vec2 k1 = vec2(0.809016994375, -0.587785252292);
  const vec2 k2 = vec2(-k1.x, k1.y);
  p.x = abs(p.x);
  p -= 2.0 * max(dot(k1, p), 0.0) * k1;
  p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y -= r;
  vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0.0, 1.0);
  float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}

float sdHeart(vec2 p) {
  p.x = abs(p.x);
  if (p.y + p.x > 1.0) return sqrt(dot(p - vec2(0.25, 0.75), p - vec2(0.25, 0.75))) - sqrt(2.0) / 4.0;
  return sqrt(min(dot(p - vec2(0.0, 1.0), p - vec2(0.0, 1.0)), dot(p - 0.5 * max(p.x + p.y, 0.0), p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y);
}

/** 霓虹图形: 杯子 / 星 / 心 / 菱形 / 禁行圈 / 闪电。返回形体距离。 */
float neonIcon(vec2 p, float kind) {
  if (kind < 1.0) {
    float cup = sdTrapezoid(p + vec2(6.0, 0.0), 14.0, 20.0, 18.0);
    float handle = abs(length(p - vec2(20.0, 2.0)) - 9.0);
    return min(abs(cup), handle);
  }
  if (kind < 2.0) return abs(sdStar5(p, 26.0, 0.45));
  if (kind < 3.0) return abs(sdHeart(p / 44.0 + vec2(0.0, 0.5)) * 44.0);
  if (kind < 4.0) return min(abs(sdBox(rot2(0.785) * p, vec2(18.0))), abs(sdBox(rot2(0.785) * p, vec2(8.0))));
  if (kind < 5.0) return min(abs(length(p) - 24.0), sdSegment(p, vec2(-17.0, -17.0), vec2(17.0, 17.0)));
  return min(min(sdSegment(p, vec2(6.0, 28.0), vec2(-8.0, 2.0)), sdSegment(p, vec2(-8.0, 2.0), vec2(8.0, 2.0))), sdSegment(p, vec2(8.0, 2.0), vec2(-6.0, -28.0)));
}

/** neonTube 的色晕剖面(归一到 0~1, 峰值 2.95)与白芯剖面。 */
float neonGlow(float d) {
  return (exp(-abs(d) * 0.9) * 2.6 + exp(-abs(d) * 0.12) * 0.35) / 2.95;
}

float neonCore(float d) {
  return pow(exp(-abs(d) * 0.9), 3.0);
}

void arcadeShop(vec2 q, float bay, inout Surf s) {
  float open = sdBox(q - vec2(0.0, 132.0), vec2(290.0, 132.0));
  float shutter = roomRand(bay, 4.0);
  vec3 hue = mix(C_MAGENTA, C_CYAN, step(0.5, roomRand(bay, 8.0)));
  if (open < 0.0) {
    // 店内: 暗处的货架剪影与残存灯光
    vec3 inner = vec3(0.012, 0.01, 0.018) + hue * 0.03 * smoothstep(0.0, 260.0, q.y);
    float shelf = step(0.5, fract(q.y / 52.0)) * step(abs(q.x), 240.0) * step(30.0, q.y) * step(q.y, 230.0) * step(0.55, fbm3(q * 0.03 + bay));
    layerSurf(s, 1.0, inner * (1.0 - shelf * 0.5), -12.0, 0.1);
    s.ao = 0.35;
    // 橱窗玻璃: 竖向窗棂 + 裂纹 + 高光
    float mull = clamp(fillAA(69.0 - abs(mod(q.x + 290.0, 145.0) - 72.5)) + fillAA(abs(q.y - 30.0) - 4.0), 0.0, 1.0);
    vec3 v = voronoi(q * 0.025 + bay * 3.0);
    float crack = (1.0 - smoothstep(0.0, 0.03, v.y)) * smoothstep(0.55, 0.3, v.x) * step(0.3, roomRand(bay, 9.0));
    s.gloss = 0.95;
    s.emit += vec3(0.6, 0.7, 0.8) * crack * 0.08;
    s.albedo += vec3(0.02, 0.02, 0.03) * (1.0 - smoothstep(0.0, 1.0, abs(fract((q.x + q.y * 0.6) / 170.0) - 0.5) * 6.0));
    layerSurf(s, mull, C_STEEL_DARK * 1.2, 4.0, 0.6);
    // 半落卷闸
    float drop = 120.0 + shutter * 160.0;
    if (shutter > 0.45 && q.y > 264.0 - drop) {
      float slat = sin(fract(q.y / 12.0) * 3.14159);
      float holes = fillAA(sdBox(mod(q, vec2(24.0, 12.0)) - vec2(12.0, 6.0), vec2(7.0, 2.0)));
      vec3 grilleC = weather(vec3(0.22, 0.22, 0.24) * (0.7 + slat * 0.4), q, 1.2, 0.3, 1.0, bay + 1.0);
      layerSurf(s, 1.0 - holes * 0.8, grilleC, slat * 2.0, 0.4);
    }
  }
  float frame = abs(open) - 10.0;
  layerSurf(s, fillAA(frame), vec3(0.08, 0.075, 0.09), 6.0 + bevelH(frame, 4.0) * 3.0, 0.5);

  // 招牌: 暗色灯箱 + 霓虹图形
  vec2 sp = q - vec2(0.0, 318.0);
  float board = sdRoundBox(sp, vec2(170.0, 30.0), 6.0);
  layerSurf(s, fillAA(board), vec3(0.03, 0.028, 0.04), 7.0 + bevelH(board, 3.0) * 2.0, 0.6);
  float kind = floor(roomRand(bay, 11.0) * 6.0);
  float ic = neonIcon((sp - vec2(-110.0, 0.0)) * 1.15, kind) / 1.15;
  float bars = abs(sdBox(sp - vec2(40.0, 0.0), vec2(90.0, 12.0)));
  // 霓虹管对亮度是线性的: 烘焙色晕与白芯两份剖面, 闪断 / 扫光由 zoneWallLive 调制
  float bm = fillAA(board);
  s.anim.x = max(s.anim.x, neonGlow(ic - 1.2) * bm);
  s.anim.y = max(s.anim.y, neonCore(ic - 1.2) * bm);
  s.anim.z = max(s.anim.z, neonGlow(bars - 1.0) * bm);
  s.anim.w = max(s.anim.w, neonCore(bars - 1.0) * bm);
}

void arcadeOverlook(vec2 q, float bay, inout Surf s) {
  float gap = sdBox(q - vec2(0.0, 240.0), vec2(300.0, 200.0));
  s.alpha *= 1.0 - fillAA(gap);
  // 玻璃栏杆(下缘霓虹)
  float rail = sdBox(q - vec2(0.0, 58.0), vec2(300.0, 36.0));
  float rm = fillAA(rail);
  s.alpha = max(s.alpha, rm * 0.55);
  layerSurf(s, rm, vec3(0.05, 0.06, 0.08), 0.0, 0.95);
  float top = fillAA(abs(q.y - 96.0) - 3.0) * step(abs(q.x), 300.0);
  float post = fillAA(abs(mod(q.x + 300.0, 100.0) - 50.0) - 2.0) * rm;
  layerSurf(s, max(top, post), C_STEEL, 4.0, 0.7);
  s.alpha = max(s.alpha, max(top, post));
  vec3 hue = mix(C_MAGENTA, C_CYAN, step(0.5, roomRand(bay, 8.0)));
  s.emit += hue * exp(-abs(q.y - 20.0) * 0.35) * step(abs(q.x), 300.0) * 0.8;
  float ledge = fillAA(abs(q.y - 14.0) - 14.0) * step(abs(q.x), 300.0);
  layerSurf(s, ledge, vec3(0.1, 0.09, 0.11), 3.0, 0.4);
  s.alpha = max(s.alpha, ledge);
}

Surf zoneWall(vec2 p) {
  float x = p.x;
  float h = p.y;
  // 大理石贴面: 大块板 + 细脉纹
  vec2 tp = p / vec2(96.0, 64.0);
  vec2 tq = abs(fract(tp) - 0.5) * vec2(96.0, 64.0);
  float grout = fillAA(min(48.0 - tq.x, 32.0 - tq.y) - 1.0);
  float vein = 1.0 - smoothstep(0.0, 0.04, abs(fbm(p * 0.012 + floor(tp)) - 0.5));
  vec3 marble = mix(vec3(0.2, 0.17, 0.22), vec3(0.28, 0.25, 0.3), hash12(floor(tp) + uSeed));
  Surf s = surfOf(weather(marble * (1.0 - vein * 0.25) * (1.0 - grout * 0.5), p, 0.8, 0.0, 1.0, uSeed));
  s.gloss = 0.55;
  s.height = -grout * 1.2;

  float bayW = 768.0;
  float bay = floor(x / bayW);
  vec2 q = vec2(x - (bay + 0.5) * bayW, h);
  float kind = roomRand(bay, 1.0);
  if (kind < 0.3) arcadeOverlook(q, bay, s);
  else arcadeShop(q, bay, s);

  // 楼板边 + 霓虹灯带 + 上方开敞(透出中庭)
  float slab = fillAA(abs(h - 366.0) - 14.0);
  vec3 hue = mix(C_MAGENTA, C_CYAN, step(0.5, fract(x / 3000.0)));
  s.alpha *= step(h, 352.0) + slab;
  layerSurf(s, slab, vec3(0.07, 0.065, 0.08), 8.0 + bevelH(-abs(h - 366.0) + 14.0, 4.0) * 3.0, 0.4);
  s.alpha = max(s.alpha, slab);
  s.emit += hue * exp(-abs(h - 350.0) * 0.5) * 1.2 * 0.95;
  float rail = (fillAA(abs(h - 420.0) - 2.5) + fillAA(abs(mod(x, 64.0) - 32.0) - 1.5) * step(380.0, h) * step(h, 420.0));
  layerSurf(s, clamp(rail, 0.0, 1.0), vec3(0.05, 0.05, 0.06), 3.0, 0.6);
  s.alpha = max(s.alpha, clamp(rail, 0.0, 1.0));

  // 垂挂横幅: 从楼板垂下, 下缘撕裂, 略微歪斜
  float bx = q.x - 330.0 + sin(bay) * (352.0 - h) * 0.01;
  float bLen = 150.0 + roomRand(bay, 21.0) * 60.0;
  float torn = (fbm3(vec2(bx * 0.08, bay)) - 0.5) * 30.0;
  float banner = max(abs(bx) - 34.0, max(h - 352.0, 352.0 - bLen + torn - h));
  float bm = fillAA(banner) * step(0.4, roomRand(bay, 23.0));
  vec3 cloth = mix(vec3(0.35, 0.08, 0.2), vec3(0.08, 0.22, 0.3), step(0.5, roomRand(bay, 25.0)));
  float emblem = fillAA(abs(length(vec2(bx, h - 352.0 + bLen * 0.45)) - 16.0) - 3.0);
  cloth = mix(cloth, vec3(0.6, 0.55, 0.45), emblem * 0.7);
  cloth = weather(cloth, vec2(bx, h) * 2.0, 1.0, 0.0, 1.0, bay);
  layerSurf(s, bm, cloth * (0.8 + 0.2 * sin(bx * 0.2)), 5.0 + sin(bx * 0.2) * 1.5, 0.1);
  s.alpha = max(s.alpha, bm);
  return s;
}
`;

/** 每帧: 动画发光调制与灯具外形(实时材质只拼这一段, 不含烘焙部分)。 */
export const ARCADE_WALL_LIVE = /* glsl */ `
/** 店铺招牌霓虹: A/B = 图标色晕/白芯, C/D = 横条色晕/白芯; 闪断或嗡鸣, 横条带扫光。 */
vec3 zoneWallLive(vec2 p, vec4 anim) {
  if (dot(anim, vec4(1.0)) < 0.001) return vec3(0.0);
  float bay = floor(p.x / 768.0);
  float spx = p.x - (bay + 0.5) * 768.0;
  vec3 hue = mix(C_MAGENTA, C_CYAN, step(0.5, roomRand(bay, 8.0)));
  float mode = roomRand(bay, 13.0);
  float level = mode < 0.3 ? step(0.25, vnoise(vec2(uTime * 9.0, bay))) : 0.88 + 0.12 * sin(uTime * 40.0 + bay);
  float sweep = step(fract(uTime * 0.25 + bay * 0.3) * 200.0 - 60.0, spx - 40.0 + 90.0);
  vec3 barHue = mix(hue, vec3(1.0, 0.85, 0.4), 0.5);
  vec3 icon = hue * anim.x * 2.95 + vec3(0.8) * anim.y;
  vec3 bar = barHue * anim.z * 2.95 + vec3(0.8) * anim.w;
  return icon * level + bar * level * mix(0.3, 1.0, sweep);
}

void zoneFixture(vec2 d, float level, vec3 light, inout Surf s) {
  float bracket = sdRoundBox(d - vec2(0.0, 0.0), vec2(6.0, 44.0), 3.0);
  float tube = sdSegment(d, vec2(0.0, -36.0), vec2(0.0, 36.0)) - 3.0;
  layerSurf(s, fillAA(bracket), vec3(0.04), 4.0, 0.5);
  s.alpha = max(s.alpha, fillAA(bracket));
  vec3 lc = light / max(max(light.r, max(light.g, light.b)), 1e-3);
  s.emit += neonTube(tube, lc, 0.3 + level * 0.9);
}
`;
