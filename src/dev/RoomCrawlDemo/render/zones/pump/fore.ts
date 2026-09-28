// ② 泵站管廊前景层(视差 1.3): 顶部横穿的粗管与法兰, 偶尔经过的近景立管。

export const PUMP_FORE = /* glsl */ `
vec4 zoneFore(vec2 scr) {
  float fx = scr.x + uCamX * 1.3;
  float top = 1080.0 - scr.y;
  vec3 col = vec3(0.0);
  float a = 0.0;

  // 顶部粗管: 圆柱明暗 + 法兰
  float r = 44.0;
  float dy = top - 30.0;
  float pm = fillSoft(abs(dy) - r, 3.0);
  float cyl = sqrt(max(1.0 - (dy / r) * (dy / r), 0.0));
  float fl = flange(fx, 520.0, 22.0) * fillSoft(abs(dy) - r - 6.0, 2.0);
  vec3 pc = vec3(0.01, 0.03, 0.028) * (0.4 + cyl) + vec3(0.05, 0.2, 0.17) * pow(max(-dy / r, 0.0), 3.0) * 0.5;
  pc += fl * vec3(0.01, 0.02, 0.02);
  float m = max(pm, fl);
  col = mix(col, pc, m);
  a = max(a, m);

  // 近景立管
  float cell = floor(fx / 2200.0);
  float cx = (cell + 0.5) * 2200.0 + (hash11(cell + 3.0) - 0.5) * 600.0;
  float dx = fx - cx;
  float rr = 40.0 + hash11(cell) * 18.0;
  float vm = fillSoft(abs(dx) - rr, 5.0) * step(0.3, hash11(cell * 2.7));
  float vc = sqrt(max(1.0 - (dx / rr) * (dx / rr), 0.0));
  vec3 vcol = vec3(0.008, 0.024, 0.022) * (0.3 + vc) + vec3(0.06, 0.25, 0.2) * smoothstep(0.5, 1.0, dx / rr) * 0.35;
  float vfl = fillSoft(abs(mod(scr.y, 380.0) - 190.0) - 10.0, 2.0) * fillSoft(abs(dx) - rr - 6.0, 2.0) * step(0.3, hash11(cell * 2.7));
  vcol += vfl * 0.015;
  col = mix(col, vcol, max(vm, vfl));
  a = max(a, max(vm, vfl) * 0.97);
  return vec4(col * a, a);
}
`;
