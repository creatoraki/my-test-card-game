// ① 方舟观景台后墙: 通高玻璃幕墙(白色竖梃内嵌青色灯带、一道横档)、隔几跨一根深色徽标立柱、
// 墙根白色护墙 + 通长花槽(叶簇与小花)、上方白色檐梁(嵌灯槽)与格栅吊顶、部分跨度垂下藤蔓。

import { ARK_FLORA_GLSL, ARK_STRUCTURE_GLSL, ARK_WALL_LIVE } from "../kit";

export const DECK_WALL = ARK_STRUCTURE_GLSL + ARK_FLORA_GLSL + /* glsl */ `
const float DECK_BAY = 360.0;
const float GLASS_LO = 66.0;
const float GLASS_HI = 352.0;

/** 徽标立柱: 深石板色面板 + 发光徽标 + 两侧竖向灯带。 */
void deckBanner(vec2 q, inout Surf s) {
  float panel = sdBox(q - vec2(0.0, 209.0), vec2(118.0, 143.0));
  float pm = fillAA(panel);
  vec3 slate = arkClean(C_ARK_SLATE * 1.3, q * 1.3, uSeed + 4.0);
  slate *= 0.9 + 0.2 * smoothstep(0.0, 286.0, q.y - 66.0);
  layerSurf(s, pm, slate, 4.0 + bevelH(panel, 4.0) * 3.0, 0.55);
  s.alpha = max(s.alpha, pm);
  float em = arkEmblem(q - vec2(0.0, 258.0), 46.0);
  float emm = fillAA(em) * pm;
  layerSurf(s, emm, vec3(0.86, 0.95, 0.95), 6.0, 0.5);
  s.emit += vec3(0.5, 0.95, 1.0) * emm * 0.35;
  s.anim.y = max(s.anim.y, emm);
  // 徽标下方三道细横线(替代文字的装饰排版)
  float lines = fillAA(abs(mod(q.y - 150.0, 18.0) - 9.0) - 1.2) * step(abs(q.x), 60.0 - step(160.0, q.y) * 24.0) * step(112.0, q.y) * step(q.y, 184.0);
  s.albedo = mix(s.albedo, vec3(0.6, 0.72, 0.74), lines * pm);
  arkStrip(s, fillAA(abs(abs(q.x) - 108.0) - 1.6) * step(80.0, q.y) * step(q.y, 340.0));
}

Surf zoneWall(vec2 p) {
  float x = p.x;
  float h = p.y;
  float ph;
  float seam = arkPanels(p, vec2(120.0, 33.0), 1.0, ph);
  Surf s = surfOf(arkClean(C_ARK_WHITE, p, uSeed) * (1.0 - seam * 0.35));
  s.height = ph;
  s.gloss = 0.35;

  float bay = floor(x / DECK_BAY);
  vec2 q = vec2(x - (bay + 0.5) * DECK_BAY, h);
  float glassBand = step(GLASS_LO, h) * step(h, GLASS_HI);
  float isBanner = step(roomRand(bay, 1.0), 0.3) * step(1.0, bay) * step(bay, uWidth / DECK_BAY - 2.0);
  float bannerCover = isBanner * step(abs(q.x), 118.0);
  // 玻璃: 竖梃之间整片透明(徽标立柱处除外)
  arkGlass(s, p, glassBand * step(abs(q.x), DECK_BAY * 0.5 - 12.0) * (1.0 - bannerCover));
  if (isBanner > 0.5 && glassBand > 0.5) deckBanner(q, s);
  // 竖梃 + 灯带
  float mull = abs(abs(q.x) - DECK_BAY * 0.5) - 12.0;
  float mm = fillAA(mull) * glassBand;
  layerSurf(s, mm, arkClean(C_ARK_WHITE * 1.02, p * vec2(3.0, 1.0), uSeed + 1.0), 6.0 + bevelH(mull, 4.0) * 4.0, 0.5);
  s.alpha = max(s.alpha, mm);
  arkStrip(s, fillAA(abs(abs(q.x) - DECK_BAY * 0.5) - 1.3) * glassBand);
  // 横档
  float tr = abs(h - 226.0) - 4.0;
  float tm = fillAA(tr) * glassBand * (1.0 - bannerCover);
  layerSurf(s, tm, C_ARK_WHITE, 4.0 + bevelH(tr, 2.0) * 2.0, 0.5);
  s.alpha = max(s.alpha, tm);

  // 檐梁与嵌灯槽
  float beam = step(GLASS_HI, h) * step(h, 392.0);
  float bh = bevelH(abs(h - 372.0) - 20.0, 5.0) * 4.0;
  layerSurf(s, beam, arkClean(C_ARK_WHITE, p, uSeed + 2.0), bh, 0.4);
  arkStrip(s, fillAA(abs(h - 358.0) - 1.6) * beam);
  // 格栅吊顶
  float ceiling = step(392.0, h);
  float fin = abs(mod(x, 28.0) - 14.0) - 5.0;
  vec3 cc = mix(C_ARK_GREY * 0.55, C_ARK_WHITE * 0.85, fillAA(fin));
  layerSurf(s, ceiling, cc, fillAA(fin) * 5.0, 0.2);
  s.ao = mix(s.ao, 0.7, ceiling * (1.0 - fillAA(fin)));

  // 部分跨度从檐梁垂下藤蔓
  if (roomRand(bay, 3.0) > 0.45 && isBanner < 0.5) layerVines(s, p, GLASS_HI, 130.0, bay * 3.1 + uSeed, 10.0);

  // 墙根: 护墙 + 花槽 + 叶簇
  float trough = abs(h - 44.0) - 22.0;
  float trm = fillAA(trough);
  layerSurf(s, trm, arkClean(C_ARK_GREY * 0.8, p, uSeed + 6.0), 8.0 + bevelH(trough, 3.0) * 3.0, 0.3);
  float rim = fillAA(abs(h - 64.0) - 2.5);
  layerSurf(s, rim, C_ARK_WHITE * 1.05, 10.0, 0.5);
  float cell = floor(x / 110.0);
  for (int i = -1; i <= 1; i++) {
    float c = cell + float(i);
    vec2 cc2 = vec2((c + 0.5) * 110.0 + (hash11(c * 1.7 + uSeed) - 0.5) * 50.0, 70.0 + hash11(c * 2.3) * 14.0);
    vec2 r = vec2(62.0 + hash11(c * 3.1) * 30.0, 26.0 + hash11(c * 4.7) * 22.0);
    layerFoliage(s, p, cc2, r, c + uSeed, 14.0);
  }
  // 叶丛间点缀小花
  vec2 fc = floor(p / 9.0);
  float flower = step(0.965, hash12(fc + uSeed)) * step(78.0, h) * step(h, 118.0) * fillAA(length(mod(p, 9.0) - 4.5) - 2.6);
  flower *= step(0.5, s.alpha) * step(s.albedo.g, 0.5);
  s.albedo = mix(s.albedo, mix(vec3(0.95, 0.9, 0.85), vec3(0.95, 0.55, 0.62), hash12(fc * 1.3)), flower);
  // 踢脚灯带
  arkStrip(s, fillAA(abs(h - 12.0) - 1.4));
  return s;
}
`;

export const DECK_WALL_LIVE = ARK_WALL_LIVE;
