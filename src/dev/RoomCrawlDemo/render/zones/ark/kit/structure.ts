// 生态方舟共用结构母题(烘焙段): 白灰复合面板、青色灯带、玻璃幕墙、叶形徽标。
// 方舟是维护良好的新建筑: 只有淡淡的水渍与灰尘, 没有锈蚀。依赖公共前缀与 ROOM_HEADER。

export const ARK_STRUCTURE_GLSL = /* glsl */ `
const vec3 C_ARK_WHITE = vec3(0.74, 0.77, 0.78);
const vec3 C_ARK_GREY = vec3(0.4, 0.44, 0.47);
const vec3 C_ARK_SLATE = vec3(0.075, 0.1, 0.12);
const vec3 C_ARK_CYAN = vec3(0.25, 0.95, 1.0);

/** 轻度风化: 低频明暗 + 淡水渍 + 薄灰, 保持洁净感。 */
vec3 arkClean(vec3 base, vec2 p, float seed) {
  vec3 c = base * (0.93 + 0.12 * fbm3(p * 0.01 + seed));
  c = mix(c, c * vec3(0.82, 0.86, 0.84), streaks(p, seed) * 0.3);
  c = mix(c, c * vec3(0.86, 0.9, 0.84), grime(p, seed) * 0.22);
  return c;
}

/** 复合面板: size 为单块尺寸、gap 为分缝半宽。返回分缝遮罩, hgt 输出面板倒角高度。 */
float arkPanels(vec2 p, vec2 size, float gap, out float hgt) {
  vec2 q = abs(mod(p, size) - size * 0.5);
  float e = max(q.x - (size.x * 0.5 - gap), q.y - (size.y * 0.5 - gap));
  hgt = bevelH(e, 4.0) * 2.0;
  return 1.0 - fillAA(e);
}

/** 叶片: 叶柄在原点, 沿 +y 伸长 len, 最宽 wid(近似距离)。 */
float arkLeaf(vec2 q, float len, float wid) {
  float t = clamp(q.y / len, 0.0, 1.0);
  float w = wid * pow(sin(3.14159 * t), 0.7);
  return max(abs(q.x) - w, max(-q.y, q.y - len)) * 0.8;
}

/** 方舟徽标: 三片叶子托起的新芽 + 下半圈环弧, r 为环半径。 */
float arkEmblem(vec2 q, float r) {
  vec2 b = q + vec2(0.0, r * 0.55);
  float mid = arkLeaf(b, r * 1.3, r * 0.26);
  float left = arkLeaf(rot2(0.8) * b, r * 1.0, r * 0.24);
  float right = arkLeaf(rot2(-0.8) * b, r * 1.0, r * 0.24);
  float ring = max(abs(length(q) - r) - r * 0.07, q.y + r * 0.05);
  return min(min(mid, min(left, right)), ring);
}

/** 青色灯带: 在 mask 处写入烘焙底光与动画遮罩 anim.x(呼吸流光由 live 段叠加)。 */
void arkStrip(inout Surf s, float mask) {
  layerSurf(s, mask, vec3(0.7, 0.95, 0.95), s.height + 1.0, 0.6);
  s.emit += C_ARK_CYAN * mask * 0.5;
  s.anim.x = max(s.anim.x, mask);
}

/** 玻璃: mask 处变为半透明浅青玻璃(透出远景), 带两道斜向反光。 */
void arkGlass(inout Surf s, vec2 p, float mask) {
  float band = abs(fract((p.x * 0.6 + p.y) / 560.0) - 0.5);
  float sheen = (1.0 - smoothstep(0.02, 0.09, band)) * 0.8 + (1.0 - smoothstep(0.0, 0.012, abs(band - 0.14))) * 0.5;
  s.albedo = mix(s.albedo, vec3(0.72, 0.9, 0.92), mask);
  s.height = mix(s.height, 0.0, mask);
  s.gloss = mix(s.gloss, 0.95, mask);
  s.alpha = mix(s.alpha, 0.1 + sheen * 0.16, mask);
  s.emit += vec3(0.55, 0.75, 0.8) * sheen * 0.1 * mask;
  s.ao = mix(s.ao, 1.0, mask);
}
`;
