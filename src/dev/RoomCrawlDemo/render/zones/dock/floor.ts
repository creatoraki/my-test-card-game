// ① 货运入口地面: 分缝混凝土地坪、黄色车道线、叉车轮胎痕、油渍与积水。

export const DOCK_FLOOR = /* glsl */ `
Surf zoneFloor(vec2 p) {
  float x = p.x;
  float z = p.y;
  // 地面被纵深压扁显示, 纹理在 z 方向放大 2 倍才显得「平铺」
  vec2 fp = vec2(x, z * 2.0);
  vec2 sp = vec2(x / 400.0, z / 150.0);
  vec2 sc = floor(sp);
  vec2 sq = abs(fract(sp) - 0.5) * vec2(400.0, 150.0);
  float joint = fillAA(min(200.0 - sq.x, 75.0 - sq.y) - 1.2);
  Surf s = surfOf(mix(C_CONCRETE, C_CONCRETE_DARK, 0.3) * (0.88 + 0.22 * hash12(sc + uSeed)));
  s.albedo *= 1.0 - joint * 0.45;
  s.albedo = weather(s.albedo, fp, 0.9, 0.0, 1.0, uSeed + 3.0);
  s.height = -joint * 1.5 + fbm3(fp * 0.12) * 0.8;
  s.gloss = 0.12;

  float lane = fillAA(abs(z - 36.0) - 4.0);
  float dashed = fillAA(abs(z - 262.0) - 3.0) * step(0.45, fract(x / 90.0));
  float paintWear = smoothstep(0.38, 0.62, fbm3(fp * 0.05 + 3.0));
  s.albedo = mix(s.albedo, C_HAZARD * 0.7, max(lane, dashed) * (1.0 - paintWear * 0.85));

  // 叉车轮胎痕: 两道平行弯曲的深色带, 带齿纹
  float tc = 150.0 + sin(x * 0.0021 + uSeed) * 60.0 + sin(x * 0.0007) * 30.0;
  float tire = fillSoft(abs(abs(z - tc) - 18.0) - 5.0, 2.5);
  tire *= smoothstep(0.3, 0.7, fbm3(vec2(x * 0.004, 1.0))) * (0.75 + 0.25 * step(0.5, fract(x / 7.0)));
  s.albedo *= 1.0 - tire * 0.4;

  float oil = smoothstep(0.64, 0.71, fbm(fp * 0.005 + 7.0));
  s.albedo = mix(s.albedo, vec3(0.025, 0.025, 0.03), oil * 0.85);
  s.gloss = mix(s.gloss, 0.55, oil);

  // 积水: 横向拉长的水洼, 水面平整
  float pud = smoothstep(0.56, 0.6, fbm(vec2(x * 0.0035, z * 0.011) + uSeed));
  s.wet = max(pud, oil * 0.35);
  s.albedo = mix(s.albedo, s.albedo * 0.3, pud);
  s.gloss = mix(s.gloss, 0.95, pud);
  s.height = mix(s.height, 0.0, pud);
  return s;
}
`;

/** 每帧: 动画发光调制(实时材质只拼这一段, 不含烘焙部分)。 */
export const DOCK_FLOOR_LIVE = /* glsl */ `

vec3 zoneFloorLive(vec2 p, vec4 anim) {
  return vec3(0.0);
}
`;
