// 描边: 程序化形体用 SDF 外扩描边; 贴图精灵用 alpha 膨胀描边。风格上与角色立绘的深色勾线一致。

export const OUTLINE_GLSL = /* glsl */ `
const vec3 C_OUTLINE = vec3(0.012, 0.014, 0.02);

/** SDF 外描边强度: 形体外侧 width px 内为 1。 */
float sdfOutline(float d, float width) {
  float w = fwidth(d) * 0.75 + 1e-4;
  return smoothstep(-w, w, d) * (1.0 - smoothstep(width - w, width + w, d));
}

/** 采样 8 个方向求邻域最大 alpha, 同时输出 alpha 梯度(屏幕平面外法线)。 */
float alphaDilate(sampler2D tex, vec2 uv, vec2 texel, float radius, out vec2 grad) {
  float m = 0.0;
  vec2 g = vec2(0.0);
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.7853982;
    vec2 dir = vec2(cos(a), sin(a));
    float s = texture2D(tex, uv + dir * texel * radius).a;
    m = max(m, s);
    g -= dir * s;
  }
  grad = g;
  return m;
}
`;
