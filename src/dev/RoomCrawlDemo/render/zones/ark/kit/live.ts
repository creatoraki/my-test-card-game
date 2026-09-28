// 生态方舟三个区域共用的实时段(每帧): 灯带流光、徽标呼吸、水面焦散与灯具外形。
// 实时材质只拼这一段, 只能依赖公共前缀与 ROOM_HEADER; 不含循环内的梯度指令。

/**
 * 后墙: anim.x = 青色灯带(沿横向缓慢流过的亮段), anim.y = 徽标呼吸光。
 * 灯具为白色细长灯板, 发光跟随灯的闪烁。
 */
export const ARK_WALL_LIVE = /* glsl */ `
vec3 zoneWallLive(vec2 p, vec4 anim) {
  if (anim.x + anim.y < 0.01) return vec3(0.0);
  float run = pow(0.5 + 0.5 * sin(p.x * 0.004 + p.y * 0.006 - uTime * 1.4), 3.0);
  float breathe = 0.55 + 0.45 * sin(uTime * 1.2);
  return vec3(0.25, 0.95, 1.0) * (anim.x * (0.25 + run * 0.9) + anim.y * breathe * 1.1);
}

void zoneFixture(vec2 d, float level, vec3 light, inout Surf s) {
  float housing = sdRoundBox(d, vec2(70.0, 8.0), 6.0);
  float panel = sdRoundBox(d - vec2(0.0, -1.0), vec2(62.0, 3.5), 3.0);
  float hm = fillAA(housing);
  layerSurf(s, hm, vec3(0.8, 0.82, 0.83), 5.0 + bevelH(housing, 3.0) * 3.0, 0.6);
  s.alpha = max(s.alpha, hm);
  vec3 lc = light / max(max(light.r, max(light.g, light.b)), 1e-3);
  float pm = fillAA(panel);
  s.albedo = mix(s.albedo, vec3(0.95), pm);
  s.emit += lc * pm * (0.6 + level * 3.0);
  s.emit += lc * exp(-length(d * vec2(0.35, 1.0)) / 18.0) * level * 0.35;
}
`;

/** 地面: anim.x = 嵌入式灯带(沿 x 流动的亮段), anim.y = 浅水(两层流动焦散)。anim.w 被高度占用。 */
export const ARK_FLOOR_LIVE = /* glsl */ `
vec3 zoneFloorLive(vec2 p, vec4 anim) {
  vec3 add = vec3(0.0);
  if (anim.x > 0.01) {
    float run = pow(0.5 + 0.5 * sin(p.x * 0.005 - uTime * 2.0), 4.0);
    add += vec3(0.25, 0.95, 1.0) * anim.x * (0.3 + run * 1.0);
  }
  if (anim.y > 0.01) {
    vec2 wp = vec2(p.x * 0.012 + uTime * 0.1, p.y * 0.03 - uTime * 0.06);
    float caust = pow(1.0 - min(voronoiF1(wp * 2.0), voronoiF1(wp * 2.9 + 4.0)), 5.0);
    add += vec3(0.55, 0.85, 0.8) * caust * anim.y * 0.35;
  }
  return add;
}
`;
