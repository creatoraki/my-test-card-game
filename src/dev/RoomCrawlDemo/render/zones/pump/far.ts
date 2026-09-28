// ② 泵站管廊背景层: 向深处延伸的竖井。成束立管、横向连管、检修走道栏杆、下方水光、细水流。

export const PUMP_FAR = /* glsl */ `
float pumpRisers(vec2 scr, float par, float pitch, float seed, out float hgt) {
  float x = scr.x + uCamX * par + seed * 500.0;
  float cell = floor(x / pitch);
  float u = x - (cell + 0.5) * pitch;
  float r = 10.0 + hash11(cell + seed) * 26.0;
  float off = (hash11(cell * 3.7 + seed) - 0.5) * pitch * 0.4;
  float dx = u - off;
  hgt = sqrt(max(r * r - dx * dx, 0.0)) / r;
  float m = step(abs(dx), r) * step(0.25, hash11(cell * 1.3 + seed));
  // 横向连管
  float hy = 560.0 + hash11(cell * 9.1 + seed) * 380.0;
  float cross = step(abs(scr.y - hy), r * 0.6) * step(0.55, hash11(cell * 4.4 + seed));
  hgt = max(hgt * m, cross * sqrt(max(1.0 - pow((scr.y - hy) / (r * 0.6), 2.0), 0.0)));
  return max(m, cross);
}

vec3 zoneFar(vec2 scr) {
  float t = uTime;
  float y = scr.y / 1080.0;
  // 竖井深处: 上暗下亮(水面反光)
  vec3 col = mix(vec3(0.02, 0.09, 0.085), vec3(0.004, 0.014, 0.016), smoothstep(0.45, 1.0, y));
  col += vec3(0.05, 0.3, 0.26) * exp(-max(scr.y - 600.0, 0.0) / 120.0) * 0.5;
  // 底部水面的焦散在岩壁上游动
  float caust = pow(1.0 - voronoi(vec2(scr.x + uCamX * 0.1, scr.y * 1.4) * 0.012 + vec2(t * 0.2, -t * 0.1)).x, 5.0);
  col += vec3(0.1, 0.5, 0.42) * caust * smoothstep(900.0, 620.0, scr.y) * 0.35;

  float h3;
  float r3 = pumpRisers(scr, 0.14, 150.0, 2.0, h3);
  col = mix(col, vec3(0.012, 0.04, 0.04) + vec3(0.03, 0.14, 0.12) * h3, r3 * 0.85);
  col = mix(col, vec3(0.03, 0.12, 0.11), 0.25 * smoothstep(1000.0, 600.0, scr.y));
  float h2;
  float r2 = pumpRisers(scr, 0.26, 230.0, 7.0, h2);
  col = mix(col, vec3(0.006, 0.02, 0.02) + vec3(0.02, 0.12, 0.1) * h2 * h2, r2);

  // 检修走道: 一条横向栏杆剪影
  float wx = scr.x + uCamX * 0.34;
  float deck = step(abs(scr.y - 820.0), 5.0);
  float rail = step(abs(scr.y - 862.0), 2.0) + step(abs(mod(wx, 60.0) - 30.0), 2.0) * step(820.0, scr.y) * step(scr.y, 862.0);
  col = mix(col, vec3(0.004, 0.012, 0.012), clamp(deck + rail, 0.0, 1.0));

  // 细水流: 从上方落下的亮线
  float sx = scr.x + uCamX * 0.2;
  float sc = floor(sx / 190.0);
  float su = abs(sx - (sc + 0.5) * 190.0 - (hash11(sc) - 0.5) * 120.0);
  float stream = (1.0 - smoothstep(0.5, 2.2, su)) * step(0.6, hash11(sc * 7.0));
  float flow = 0.6 + 0.4 * vnoise(vec2(sc, scr.y * 0.05 + t * 12.0));
  col += vec3(0.3, 0.8, 0.7) * stream * flow * 0.35;
  // 弥漫的水汽
  float mist = fbm(vec2(scr.x + uCamX * 0.3 + t * 12.0, scr.y) * 0.004);
  col += vec3(0.04, 0.16, 0.14) * smoothstep(0.4, 0.8, mist) * 0.4;
  return col;
}
`;
