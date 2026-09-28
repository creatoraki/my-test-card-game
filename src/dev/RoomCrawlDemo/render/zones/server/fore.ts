// ④ 数据机房前景层(视差 1.3): 顶部吊装走线架与垂下的线缆环, 近景机柜侧板偶尔掠过。

export const SERVER_FORE = /* glsl */ `
vec4 zoneFore(vec2 scr) {
  float fx = scr.x + uCamX * 1.3;
  float top = 1080.0 - scr.y;
  vec3 col = vec3(0.0);
  float a = 0.0;

  // 吊装走线架: 梯形横档
  float tray = fillSoft(abs(top - 40.0) - 12.0, 2.0);
  float rungs = fillSoft(abs(mod(fx, 36.0) - 18.0) - 2.0, 1.0) * fillSoft(abs(top - 40.0) - 10.0, 1.0);
  float rails = fillSoft(abs(abs(top - 40.0) - 11.0) - 2.0, 1.0);
  float tm = max(rails, rungs) * tray + rails;
  col = mix(col, vec3(0.012, 0.016, 0.022), clamp(tm, 0.0, 1.0));
  a = max(a, clamp(tm, 0.0, 1.0));
  float hanger = fillSoft(abs(mod(fx, 420.0) - 210.0) - 3.0, 1.0) * step(top, 40.0);
  col = mix(col, vec3(0.01), hanger);
  a = max(a, hanger);

  // 垂下的线缆环
  for (int i = 0; i < 2; i++) {
    float fi = float(i);
    float span = 360.0 + fi * 170.0;
    float cell = floor((fx + fi * 111.0) / span);
    float u = fract((fx + fi * 111.0) / span);
    float sag = 40.0 + hash11(cell + fi * 9.0) * 110.0;
    float cy = 50.0 + sag * 4.0 * u * (1.0 - u);
    float cm = fillSoft(abs(top - cy) - 3.0 - fi, 1.2) * step(0.35, hash11(cell * 2.3 + fi));
    vec3 cc = fi < 0.5 ? vec3(0.004, 0.02, 0.05) : vec3(0.02, 0.018, 0.004);
    col = mix(col, cc, cm);
    a = max(a, cm);
  }

  // 近景机柜侧板
  float pc = floor(fx / 3000.0);
  float px = (pc + 0.5) * 3000.0 + (hash11(pc + 2.0) - 0.5) * 900.0;
  float dx = fx - px;
  float pm = fillSoft(abs(dx) - 80.0, 6.0) * step(460.0, top) * step(0.35, hash11(pc * 6.1));
  vec3 pcol = vec3(0.012, 0.016, 0.024);
  float led = step(0.85, hash12(floor(vec2(dx, scr.y) / vec2(10.0, 14.0)))) * fillSoft(abs(mod(dx, 10.0) - 5.0) - 1.5, 0.8) * fillSoft(abs(mod(scr.y, 14.0) - 7.0) - 1.5, 0.8);
  pcol += vec3(0.2, 0.5, 1.0) * led * ledBlink(floor(vec2(dx, scr.y) / vec2(10.0, 14.0)), uTime, 1.0) * 0.8;
  col = mix(col, pcol, pm);
  a = max(a, pm * 0.95);
  return vec4(col * a, a);
}
`;
