// ③ 霓虹旧商场背景层: 多层中庭。穹顶玻璃肋、层层楼板与玻璃栏杆、远处店铺的霓虹余光、停摆的扶梯。

export const ARCADE_FAR = /* glsl */ `
vec3 zoneFar(vec2 scr) {
  float t = uTime;
  float y = scr.y / 1080.0;
  vec3 col = mix(vec3(0.03, 0.012, 0.05), vec3(0.012, 0.01, 0.03), y);

  // 穹顶: 放射状玻璃肋透出月光(视差 0.12)
  float dx = scr.x + uCamX * 0.12;
  vec2 dc = vec2(mod(dx, 1600.0) - 800.0, scr.y - 700.0);
  float ang = atan(dc.x, dc.y);
  float ribs = 1.0 - smoothstep(0.0, 0.012, abs(fract(ang * 5.0) - 0.5) - 0.47);
  float dome = smoothstep(820.0, 860.0, length(dc * vec2(0.5, 1.0)));
  col += vec3(0.1, 0.1, 0.2) * (1.0 - dome) * smoothstep(900.0, 1080.0, scr.y) * 0.6;
  col = mix(col, vec3(0.01, 0.008, 0.02), ribs * smoothstep(880.0, 1000.0, scr.y) * 0.8);

  // 楼层(视差 0.3): 每层 = 楼板 + 店铺余光 + 玻璃栏杆霓虹下沿
  float lx = scr.x + uCamX * 0.3;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float slab = 700.0 + fi * 150.0;
    float par = 1.0 - fi * 0.25;
    float shopY = scr.y - slab - 12.0;
    if (shopY > 0.0 && shopY < 110.0) {
      float cell = floor((lx + fi * 333.0) / 260.0);
      float u = fract((lx + fi * 333.0) / 260.0);
      float lit = step(0.4, hash11(cell * 3.1 + fi));
      vec3 hue = mix(C_MAGENTA, C_CYAN, step(0.5, hash11(cell * 5.3 + fi)));
      float window = step(0.1, u) * step(u, 0.9) * smoothstep(0.0, 20.0, shopY) * smoothstep(110.0, 70.0, shopY);
      float flick = 0.7 + 0.3 * step(0.2, vnoise(vec2(cell, t * 6.0)));
      col += hue * window * lit * 0.13 * par * flick;
    }
    float slabM = step(abs(scr.y - slab), 7.0);
    col = mix(col, vec3(0.012, 0.01, 0.02), slabM);
    float strip = exp(-abs(scr.y - slab + 9.0) * 0.5);
    vec3 stripHue = mix(C_MAGENTA, C_CYAN, step(0.5, fract(fi * 0.5)));
    col += stripHue * strip * 0.35 * par;
    float rail = step(abs(scr.y - slab - 44.0), 1.5) + step(abs(mod(lx + fi * 71.0, 90.0) - 45.0), 1.0) * step(slab + 8.0, scr.y) * step(scr.y, slab + 44.0);
    col = mix(col, vec3(0.03, 0.025, 0.05), clamp(rail, 0.0, 1.0) * 0.8);
  }

  // 停摆的扶梯(视差 0.3): 斜向台阶带
  float ex = mod(lx, 2400.0) - 900.0;
  float along = ex * 0.4 - (scr.y - 700.0);
  float esc = step(abs(along), 24.0) * step(0.0, ex) * step(ex, 380.0);
  float steps = step(0.5, fract((ex + scr.y) / 14.0));
  col = mix(col, vec3(0.02, 0.018, 0.03) + vec3(0.02) * steps, esc);
  col += C_CYAN * exp(-abs(along + 24.0) * 0.4) * step(0.0, ex) * step(ex, 380.0) * 0.2;

  // 远处悬空的霓虹灯箱光晕
  float nx = scr.x + uCamX * 0.22;
  float nc = floor(nx / 700.0);
  vec2 np = vec2(nx - (nc + 0.5) * 700.0, scr.y - 900.0 - hash11(nc) * 80.0);
  float glow = exp(-length(np * vec2(1.0, 1.6)) / 40.0) * step(0.35, hash11(nc * 2.0));
  col += mix(C_MAGENTA, C_CYAN, hash11(nc * 7.0)) * glow * 0.35 * (0.8 + 0.2 * sin(t * 3.0 + nc));

  // 灰尘与雾
  col += vec3(0.05, 0.03, 0.07) * smoothstep(0.4, 0.8, fbm(vec2(scr.x + uCamX * 0.25, scr.y) * 0.003 + t * 0.01)) * 0.5;
  return col;
}
`;
