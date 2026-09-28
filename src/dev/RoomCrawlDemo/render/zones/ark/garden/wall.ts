// ② 空中花园廊桥后墙: 半高白色栏墙 + 压顶 + 花槽绿篱(点缀小花), 每隔一跨一座白色拱形花架
// (拱内缘青色灯线, 叶簇攀附立柱、拱顶垂藤), 顶部白色廊架横梁与格栅垂下藤蔓; 其余部分敞开透出远景。

import { ARK_FLORA_GLSL, ARK_STRUCTURE_GLSL, ARK_WALL_LIVE } from "../kit";

export const GARDEN_WALL = ARK_STRUCTURE_GLSL + ARK_FLORA_GLSL + /* glsl */ `
const float ARCH_PITCH = 640.0;
const float ARCH_HALF = 170.0;
const float ARCH_SPRING = 290.0;

/** 拱形花架: 两根立柱 + 半圆拱, 立柱上攀着叶簇, 拱下垂藤。 */
void gardenArch(vec2 q, vec2 p, float bay, inout Surf s) {
  float post = abs(abs(q.x) - ARCH_HALF) - 8.0;
  float pm = fillAA(post) * step(q.y, ARCH_SPRING);
  vec2 aq = q - vec2(0.0, ARCH_SPRING);
  float arc = abs(length(aq) - ARCH_HALF) - 8.0;
  float am = fillAA(arc) * step(0.0, aq.y);
  float m = max(pm, am);
  vec3 white = arkClean(C_ARK_WHITE * 1.03, p * vec2(2.0, 1.0), uSeed + 3.0);
  float bev = max(bevelH(post, 3.0) * pm, bevelH(arc, 3.0) * am);
  layerSurf(s, m, white, 12.0 + bev * 4.0, 0.5);
  s.alpha = max(s.alpha, m);
  arkStrip(s, fillAA(abs(length(aq) - ARCH_HALF + 8.0) - 1.1) * step(0.0, aq.y));
  // 立柱上的叶簇
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float side = mod(fi, 2.0) * 2.0 - 1.0;
    vec2 c = vec2(side * ARCH_HALF + (roomRand(bay, fi + 4.0) - 0.5) * 20.0, 120.0 + fi * 70.0 + roomRand(bay, fi) * 30.0);
    layerFoliage(s, q, c, vec2(34.0, 28.0) + roomRand(bay, fi + 9.0) * 14.0, bay * 5.0 + fi, 18.0);
  }
  layerFoliage(s, q, vec2((roomRand(bay, 2.0) - 0.5) * 120.0, ARCH_SPRING + ARCH_HALF - 6.0), vec2(70.0, 26.0), bay * 3.0 + 1.0, 20.0);
  // 拱下垂藤
  float topY = ARCH_SPRING + sqrt(max(ARCH_HALF * ARCH_HALF - q.x * q.x, 0.0)) - 6.0;
  if (abs(q.x) < ARCH_HALF - 12.0) layerVines(s, p, topY, 110.0, bay + uSeed, 16.0);
}

Surf zoneWall(vec2 p) {
  float x = p.x;
  float h = p.y;
  Surf s = surfOf(vec3(0.0));
  s.alpha = 0.0;

  // 栏墙 + 压顶
  float ph;
  float seam = arkPanels(p, vec2(160.0, 28.0), 1.0, ph);
  float wallM = step(h, 56.0);
  layerSurf(s, wallM, arkClean(C_ARK_WHITE, p, uSeed) * (1.0 - seam * 0.35), ph, 0.35);
  s.alpha = max(s.alpha, wallM);
  float cope = abs(h - 56.0) - 4.0;
  float cm = fillAA(cope);
  layerSurf(s, cm, C_ARK_WHITE * 1.06, 6.0 + bevelH(cope, 2.0) * 2.0, 0.5);
  s.alpha = max(s.alpha, cm);
  arkStrip(s, fillAA(abs(h - 12.0) - 1.4));
  // 花槽 + 绿篱
  float trough = abs(h - 68.0) - 10.0;
  float tm = fillAA(trough);
  layerSurf(s, tm, arkClean(C_ARK_GREY * 0.7, p, uSeed + 5.0), 8.0 + bevelH(trough, 2.0) * 2.0, 0.3);
  s.alpha = max(s.alpha, tm);
  float cell = floor(x / 96.0);
  for (int i = -1; i <= 1; i++) {
    float c = cell + float(i);
    vec2 cc = vec2((c + 0.5) * 96.0 + (hash11(c * 1.3 + uSeed) - 0.5) * 40.0, 84.0 + hash11(c * 2.9) * 10.0);
    layerFoliage(s, p, cc, vec2(58.0 + hash11(c * 3.7) * 24.0, 20.0 + hash11(c * 5.1) * 14.0), c + uSeed, 12.0);
  }
  vec2 fc = floor(p / 8.0);
  float flower = step(0.955, hash12(fc + uSeed)) * step(80.0, h) * step(h, 112.0) * fillAA(length(mod(p, 8.0) - 4.0) - 2.4);
  flower *= step(0.5, s.alpha) * step(s.albedo.g, 0.5);
  vec3 fcol = mix(vec3(0.96, 0.92, 0.86), mix(vec3(0.95, 0.5, 0.6), vec3(0.98, 0.8, 0.3), step(0.6, hash12(fc * 2.1))), step(0.35, hash12(fc * 1.7)));
  s.albedo = mix(s.albedo, fcol, flower);

  // 拱形花架
  float bay = floor(x / ARCH_PITCH);
  vec2 q = vec2(x - (bay + 0.5) * ARCH_PITCH, h);
  if (abs(q.x) < ARCH_HALF + 90.0 && h > 40.0) gardenArch(q, p, bay, s);

  // 顶部廊架: 横梁 + 纵向格栅 + 垂藤
  float beam = abs(h - 410.0) - 11.0;
  float bm = fillAA(beam);
  float joist = fillAA(abs(mod(x, 90.0) - 45.0) - 6.0) * step(410.0, h);
  float top = max(bm, joist);
  layerSurf(s, top, arkClean(C_ARK_WHITE * mix(1.0, 0.8, joist), p, uSeed + 8.0), 8.0 + bevelH(beam, 3.0) * 3.0, 0.4);
  s.alpha = max(s.alpha, top);
  arkStrip(s, fillAA(abs(h - 400.0) - 1.2));
  layerVines(s, p, 399.0, 150.0, uSeed + 13.0, 10.0);
  return s;
}
`;

export const GARDEN_WALL_LIVE = ARK_WALL_LIVE;
