// ⑤ 冷却核心地面: 花纹防滑钢板 + 红光出风口 + 向外蔓延的黑色腐化斑块(脉动红纹)与油亮积液。

export const CORE_FLOOR = /* glsl */ `
Surf zoneFloor(vec2 p) {
  float x = p.x;
  float z = p.y;
  vec2 fp = vec2(x, z * 2.0);
  // 钢板: 大板 + 菱形防滑纹
  vec2 pp = fp / vec2(240.0, 240.0);
  vec2 pq = abs(fract(pp) - 0.5) * 240.0;
  float seam = fillAA(min(120.0 - pq.x, 120.0 - pq.y) - 1.4);
  vec2 dq = rot2(0.785) * fp / 14.0;
  vec2 df = abs(fract(dq) - 0.5);
  float tread = fillAA((max(df.x, df.y) - 0.28) * 14.0);
  vec3 steel = vec3(0.14, 0.12, 0.115) * (0.85 + 0.3 * hash12(floor(pp) + uSeed));
  Surf s = surfOf(weather(steel * (1.0 - seam * 0.6 + tread * 0.15), fp, 1.0, 0.6, 1.0, uSeed + 1.0));
  s.gloss = 0.4;
  s.height = tread * 1.2 - seam * 2.0;

  // 出风口: 红光从格栅缝里透出来
  vec2 vc = floor(fp / vec2(480.0, 200.0));
  vec2 vq = fp - (vc + 0.5) * vec2(480.0, 200.0);
  float vent = sdRoundBox(vq, vec2(60.0, 26.0), 4.0);
  float hasVent = step(0.55, hash12(vc + uSeed));
  float slots = fillAA(abs(mod(vq.x, 12.0) - 6.0) - 2.5) * fillAA(vent + 4.0) * hasVent;
  float frame = fillAA(abs(vent) - 3.0) * hasVent;
  s.albedo = mix(s.albedo, vec3(0.02), slots);
  s.anim.x = slots;
  layerSurf(s, frame, vec3(0.08, 0.07, 0.07), 3.0, 0.5);

  // 腐化斑块: 黑色油状团块, 边缘触须状扩散, 红纹随心跳脉动
  vec2 w = fp + vec2(fbm3(fp * 0.008) * 80.0, fbm3(fp * 0.008 + 3.0) * 80.0);
  float blob = fbm(w * 0.0035 + uSeed * 0.3);
  float tend = ridged(w * 0.012);
  float cor = smoothstep(0.58, 0.62, blob + tend * 0.12);
  float veins = smoothstep(0.82, 0.95, ridged(w * 0.025)) * cor;
  vec3 ooze = vec3(0.01, 0.005, 0.008);
  s.albedo = mix(s.albedo, ooze, cor);
  s.gloss = mix(s.gloss, 0.95, cor);
  s.height = mix(s.height, tend * 3.0, cor);
  s.wet = cor * 0.6;
  s.anim.y = veins;
  // 斑块边缘的暗红晕
  float rim = smoothstep(0.5, 0.58, blob + tend * 0.12) * (1.0 - cor);
  s.albedo = mix(s.albedo, vec3(0.08, 0.01, 0.01), rim * 0.6);
  return s;
}
`;

/** 每帧: 动画发光调制(实时材质只拼这一段, 不含烘焙部分)。 */
export const CORE_FLOOR_LIVE = /* glsl */ `
/** A = 出风口红光(各口错开的呼吸), B = 腐化红纹(随心跳脉动)。 */
vec3 zoneFloorLive(vec2 p, vec4 anim) {
  if (anim.x + anim.y < 0.004) return vec3(0.0);
  vec2 vc = floor(vec2(p.x, p.y * 2.0) / vec2(480.0, 200.0));
  float vent = 0.5 + 0.3 * sin(uTime * 2.0 + vc.x);
  float heart = pow(0.5 + 0.5 * sin(uTime * 2.2), 3.0);
  return vec3(1.0, 0.15, 0.05) * anim.x * vent * 0.8 + vec3(1.0, 0.05, 0.12) * anim.y * (0.4 + heart * 1.4);
}
`;
