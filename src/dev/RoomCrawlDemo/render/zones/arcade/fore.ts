// ③ 霓虹旧商场前景层(视差 1.3): 顶部垂下的断电缆与残破吊旗, 偶尔经过的带霓虹边的近景立柱。

export const ARCADE_FORE = /* glsl */ `
vec4 zoneFore(vec2 scr) {
  float fx = scr.x + uCamX * 1.3;
  float top = 1080.0 - scr.y;
  vec3 col = vec3(0.0);
  float a = 0.0;

  // 断电缆: 下垂的悬链线, 末端偶尔打火
  float cell = floor(fx / 640.0);
  float u = fx - cell * 640.0;
  float sag = 60.0 + hash11(cell) * 90.0;
  float cy = 12.0 + sag * 4.0 * (u / 640.0) * (1.0 - u / 640.0);
  float cable = fillSoft(abs(top - cy) - 2.2, 1.2) * step(0.4, hash11(cell * 3.0));
  col = mix(col, vec3(0.01), cable);
  a = max(a, cable);

  // 吊旗: 三角串旗
  float fc = floor(fx / 38.0);
  float fu = fract(fx / 38.0) - 0.5;
  float line = 26.0 + sin(fx * 0.004) * 10.0;
  float flag = max(abs(fu) * 38.0 - (1.0 - (top - line) / 34.0) * 16.0, max(line - top, top - line - 34.0));
  float fm = fillSoft(flag, 1.2) * step(0.2, hash11(fc * 1.7)) * step(0.5, hash11(floor(fx / 900.0)));
  vec3 fcol = mix(vec3(0.12, 0.02, 0.08), vec3(0.02, 0.08, 0.1), step(0.5, hash11(fc)));
  col = mix(col, fcol, fm);
  a = max(a, fm);

  // 近景立柱 + 竖向霓虹边
  float pc = floor(fx / 2800.0);
  float px = (pc + 0.5) * 2800.0 + (hash11(pc + 1.0) - 0.5) * 800.0;
  float dx = fx - px;
  float pm = fillSoft(abs(dx) - 58.0, 5.0) * step(0.3, hash11(pc * 4.1));
  vec3 hue = mix(C_MAGENTA, C_CYAN, step(0.5, hash11(pc * 9.0)));
  vec3 pcol = vec3(0.015, 0.012, 0.02) + hue * exp(-abs(abs(dx) - 50.0) * 0.4) * 0.9;
  col = mix(col, pcol, pm);
  a = max(a, pm * 0.95);
  return vec4(col * a, a);
}
`;
