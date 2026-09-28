// ① 货运入口前景层(视差 1.3): 顶部横梁与起重链钩, 偶尔经过的近景立柱。整体是虚化的暗剪影。

export const DOCK_FORE = /* glsl */ `
vec4 zoneFore(vec2 scr) {
  float fx = scr.x + uCamX * 1.3;
  float top = 1080.0 - scr.y;
  vec3 col = vec3(0.0);
  float a = 0.0;

  // 顶梁
  float beam = fillSoft(top - 26.0, 3.0);
  float beamLip = fillSoft(abs(top - 30.0) - 3.0, 1.5);
  col = mix(col, vec3(0.018, 0.016, 0.014) + beamLip * vec3(0.12, 0.07, 0.03), max(beam, beamLip));
  a = max(a, max(beam, beamLip));

  // 起重链与吊钩(轻微摆动)
  float cell = floor(fx / 900.0);
  float cx = (cell + 0.5) * 900.0 + (hash11(cell) - 0.5) * 300.0;
  float len = 170.0 + hash11(cell * 2.0) * 180.0;
  float sway = sin(uTime * 0.7 + cell * 2.3) * 0.035;
  vec2 q = vec2(fx - cx - top * sway, top);
  if (q.y < len && hash11(cell * 5.1) > 0.3) {
    float ch = chainSdf(q, 20.0);
    float m = fillSoft(ch, 1.2);
    col = mix(col, vec3(0.03, 0.028, 0.025) + vec3(0.2, 0.12, 0.05) * smoothstep(-2.0, 2.0, q.x) * 0.3, m);
    a = max(a, m);
  }
  vec2 hq = vec2(fx - cx - len * sway, top - len - 18.0);
  float hook = max(abs(length(hq - vec2(-8.0, 0.0)) - 16.0) - 5.0, hq.y - 6.0);
  hook = min(hook, sdBox(hq - vec2(0.0, -18.0), vec2(5.0, 10.0)));
  float hm = fillSoft(hook, 1.5) * step(0.3, hash11(cell * 5.1));
  col = mix(col, vec3(0.04, 0.035, 0.03), hm);
  a = max(a, hm);

  // 近景立柱: 圆柱明暗 + 底部黄黑包角, 边缘虚化
  float pc = floor(fx / 2600.0);
  float px = (pc + 0.5) * 2600.0 + (hash11(pc + 5.0) - 0.5) * 700.0;
  float dx = fx - px;
  float pm = fillSoft(abs(dx) - 64.0, 6.0) * step(0.35, hash11(pc * 3.0));
  float shadeX = 0.5 + 0.5 * (dx / 64.0);
  vec3 pcol = vec3(0.022, 0.022, 0.024) * (0.6 + shadeX * 0.8);
  float stripe = step(0.5, fract((dx + scr.y) / 40.0)) * step(scr.y, 180.0);
  pcol = mix(pcol, vec3(0.09, 0.06, 0.012), stripe * 0.8);
  pcol += vec3(0.35, 0.18, 0.06) * smoothstep(40.0, 64.0, dx) * 0.25;
  col = mix(col, pcol, pm);
  a = max(a, pm * 0.96);
  return vec4(col * a, a);
}
`;
