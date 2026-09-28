// ⑤ 冷却核心前景层(视差 1.3): 从顶部垂下、缓慢蠕动的黑色触须, 以及近景的断裂承重梁。

export const CORE_FORE = /* glsl */ `
vec4 zoneFore(vec2 scr) {
  float fx = scr.x + uCamX * 1.3;
  float top = 1080.0 - scr.y;
  vec3 col = vec3(0.0);
  float a = 0.0;

  // 顶部腐化团块
  float mass = fbm(vec2(fx * 0.004, uTime * 0.05)) * 90.0;
  float mm = fillSoft(top - mass + 10.0, 4.0);
  col = mix(col, vec3(0.008, 0.003, 0.005), mm);
  a = max(a, mm);

  // 垂下的触须: 每根沿长度方向逐渐变细, 末端蜷曲
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float span = 300.0 + fi * 130.0;
    float cell = floor((fx + fi * 157.0) / span);
    float cx = (cell + 0.5) * span - fi * 157.0 + (hash11(cell + fi) - 0.5) * span * 0.5;
    float len = 120.0 + hash11(cell * 3.0 + fi) * 220.0;
    float k = clamp(top / len, 0.0, 1.0);
    float wave = sin(top * 0.03 + uTime * (0.8 + fi * 0.3) + cell) * 18.0 * k + sin(top * 0.011 + uTime * 0.5) * 10.0 * k;
    float width = mix(14.0, 1.5, pow(k, 0.7)) + fi * 2.0;
    float tm = fillSoft(abs(fx - cx - wave) - width, 1.5) * step(top, len) * step(0.3, hash11(cell * 7.0 + fi));
    col = mix(col, vec3(0.01, 0.004, 0.006) + vec3(0.3, 0.02, 0.04) * (1.0 - k) * 0.0, tm);
    // 触须表面的红色脉络
    float vein = step(0.8, fract(top * 0.05 - uTime * 0.8 + cell)) * tm * 0.6;
    col += vec3(0.5, 0.02, 0.05) * vein;
    a = max(a, tm);
  }

  // 近景断裂承重梁(斜穿)
  float bc = floor(fx / 3200.0);
  float bx = fx - (bc + 0.5) * 3200.0 - (hash11(bc) - 0.5) * 900.0;
  float along = bx * 0.55 + top;
  float beam = fillSoft(abs(along - 150.0) - 34.0, 4.0) * step(-300.0, bx) * step(bx, 260.0) * step(0.4, hash11(bc * 3.3));
  vec3 bcol = vec3(0.02, 0.012, 0.01) + vec3(0.3, 0.05, 0.02) * smoothstep(20.0, 34.0, along - 150.0) * 0.4;
  col = mix(col, bcol, beam);
  a = max(a, beam * 0.97);
  return vec4(col * a, a);
}
`;
