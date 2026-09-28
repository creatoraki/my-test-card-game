// ③ 古树穹顶后墙: 房间中段的巨树树干(扭转树皮、苔藓、板根向两侧铺开), 两侧是弧形玻璃穹壁
// (白色曲肋 + 一道环梁灯带), 墙根苔石挡墙与蕨丛, 顶部是压下来的树冠底面与垂藤。

import { ARK_FLORA_GLSL, ARK_STRUCTURE_GLSL, ARK_WALL_LIVE } from "../kit";

export const GROVE_WALL = ARK_STRUCTURE_GLSL + ARK_FLORA_GLSL + /* glsl */ `
/** 巨树: dx 为到树干中轴的距离。返回覆盖度, 并直接叠到表面上。 */
void groveTrunk(vec2 p, float dx, inout Surf s) {
  float h = p.y;
  // 树干半宽: 中段 260, 向下张开成板根
  float halfW = 260.0 + 300.0 * exp(-h / 70.0) + sin(h * 0.012) * 12.0;
  // 板根: 沿横向逐渐变矮的几道隆起
  float ad = abs(dx);
  float rootH = 150.0 * exp(-max(ad - 260.0, 0.0) / 220.0) * (0.55 + 0.45 * abs(sin(ad * 0.011 + 0.6)));
  float trunkD = ad - halfW;
  float rootD = h - rootH;
  float d = min(trunkD, rootD);
  float m = fillAA(d);
  if (m < 0.001) return;
  float bh;
  vec3 c = bark(vec2(dx * 1.0, h), uSeed, bh);
  // 圆柱明暗: 右侧迎光
  float cyl = clamp(dx / halfW, -1.0, 1.0);
  c *= 0.75 + 0.35 * (cyl * 0.5 + 0.5);
  float moss = mossMask(p, 0.55 - h * 0.0008, uSeed + 2.0) * smoothstep(40.0, -30.0, trunkD + h * 0.2);
  moss = max(moss, mossMask(p * 1.3, 0.7, uSeed + 5.0) * step(trunkD, 0.0) * step(0.0, -rootD + 40.0) * 0.8);
  c = mix(c, C_MOSS * (0.8 + 0.4 * vnoise(p * 0.2)), moss);
  layerSurf(s, m, c, 20.0 + bh + bevelH(d, 20.0) * 12.0 + moss * 3.0, 0.2);
  s.alpha = max(s.alpha, m);
  s.ao = mix(s.ao, 0.75 + 0.25 * bevelH(d, 30.0), m);
  // 树干上的垂藤
  if (trunkD < 0.0) layerVines(s, p, 430.0, 180.0, uSeed + 21.0, 30.0);
}

Surf zoneWall(vec2 p) {
  float x = p.x;
  float h = p.y;
  float trunkX = uWidth * 0.55;
  // 玻璃穹壁: 曲肋越往上越向巨树收拢
  Surf s = surfOf(C_ARK_WHITE);
  arkGlass(s, p, 1.0);
  float bend = h * h * 0.00045;
  float rx = x + sign(x - trunkX) * bend;
  float rib = abs(mod(rx, 300.0) - 150.0) - 8.0;
  float rm = fillAA(rib) * step(40.0, h);
  layerSurf(s, rm, arkClean(C_ARK_WHITE, p * vec2(3.0, 1.0), uSeed + 1.0), 8.0 + bevelH(rib, 3.0) * 4.0, 0.5);
  s.alpha = max(s.alpha, rm);
  float ring = abs(h - 300.0) - 9.0;
  float gm = fillAA(ring);
  layerSurf(s, gm, C_ARK_WHITE, 10.0 + bevelH(ring, 3.0) * 3.0, 0.5);
  s.alpha = max(s.alpha, gm);
  arkStrip(s, fillAA(abs(h - 290.0) - 1.3));
  // 横档细肋
  float bar = fillAA(abs(mod(h - 40.0, 130.0) - 65.0) - 1.8) * step(40.0, h);
  layerSurf(s, bar, C_ARK_WHITE * 0.95, 4.0, 0.5);
  s.alpha = max(s.alpha, bar);

  // 墙根苔石挡墙 + 蕨丛
  float wallD = h - 44.0 - (vnoise(vec2(x * 0.02, 0.0)) - 0.5) * 8.0;
  float wm = fillAA(wallD);
  vec3 v = voronoi(vec2(x * 0.018, h * 0.03) + uSeed);
  vec3 stone = mix(vec3(0.42, 0.44, 0.4), vec3(0.6, 0.6, 0.55), v.z) * (0.75 + 0.25 * smoothstep(0.0, 0.2, v.y));
  float moss = mossMask(p, 0.6, uSeed + 3.0);
  stone = mix(stone, C_MOSS * 1.1, moss * 0.85);
  layerSurf(s, wm, stone, 6.0 + smoothstep(0.0, 0.2, v.y) * 5.0, 0.2);
  s.alpha = max(s.alpha, wm);
  float cell = floor(x / 150.0);
  for (int i = -1; i <= 1; i++) {
    float c = cell + float(i);
    if (hash11(c * 2.1 + uSeed) < 0.4) continue;
    vec2 cc = vec2((c + 0.5) * 150.0 + (hash11(c * 3.3) - 0.5) * 60.0, 56.0);
    layerFoliage(s, p, cc, vec2(54.0, 30.0) + hash11(c * 5.9) * 18.0, c + uSeed, 12.0);
  }

  // 巨树
  if (abs(x - trunkX) < 1100.0) groveTrunk(p, x - trunkX, s);

  // 树冠底面: 顶部压下来的叶幕 + 垂藤
  float ccell = floor(x / 130.0);
  for (int i = -1; i <= 1; i++) {
    float c = ccell + float(i);
    vec2 cc = vec2((c + 0.5) * 130.0 + (hash11(c * 1.9 + uSeed) - 0.5) * 60.0, 460.0 + hash11(c * 4.3) * 30.0);
    layerFoliage(s, p, cc, vec2(90.0, 44.0 + hash11(c * 6.1) * 30.0), c * 1.7 + uSeed, 24.0);
  }
  layerVines(s, p, 432.0, 130.0, uSeed + 7.0, 20.0);
  return s;
}
`;

export const GROVE_WALL_LIVE = ARK_WALL_LIVE;
