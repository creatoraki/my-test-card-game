/**
 * 护盾 · 六边形能量壳：扫描线自下而上把护罩「打印」出来(蜂窝格随扫描亮起) →
 * 爆点外壳一闪、蜂窝涟漪由中心向外推开 → 护罩稳定微光，末段蜂窝逐格熄灭消散。
 * 蜂窝只在外缘明显(菲涅尔)，保证护罩中央不遮挡被保护的单位。
 */
export const GLSL_HIT_SHIELD = /* glsl */ `
#define SHELL_R 96.0
#define HEX_SIZE 17.0

/** 六边形网格：返回 (格内局部坐标 xy, 格子编号 zw)。 */
vec4 hexCell(vec2 p) {
  vec2 s = vec2(1.0, 1.7320508);
  vec4 hc = floor(vec4(p, p - vec2(0.5, 1.0)) / s.xyxy) + 0.5;
  vec4 h = vec4(p - hc.xy * s, p - (hc.zw + 0.5) * s);
  return dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, hc.xy) : vec4(h.zw, hc.zw + 0.5);
}

/** 格内点到六边形边的距离(单位格；0 = 边上，0.5 = 格心)。 */
float hexEdgeDist(vec2 local) {
  vec2 a = abs(local);
  return 0.5 - max(dot(a, vec2(0.5, 0.8660254)), a.x);
}

void main() {
  vec2 q = hitCoord();
  float t = hitTime();
  vec4 c = vec4(0.0);
  float life = uTotal - uImpact;

  float r = length(q * vec2(1.0, 0.92));
  float inside = 1.0 - smoothstep(SHELL_R - 1.0, SHELL_R + 1.0, r);
  float rn = r / SHELL_R;
  float fres = smoothstep(0.3, 1.0, rn);
  fres *= fres;

  // 扫描成形：一条水平扫描线从底部升到顶部，线下方的护罩已成形。
  float scanK = easeOut3((t + 0.2) / 0.26);
  float scanY = mix(-SHELL_R - 12.0, SHELL_R + 12.0, scanK);
  float formed = smoothstep(scanY + 5.0, scanY - 5.0, q.y);
  float scanLine = glowOf(abs(q.y - scanY), 2.5) * inside * (1.0 - smoothstep(0.85, 1.0, scanK));

  // 末段消散：按格子随机先后熄灭。
  vec4 hx = hexCell(q / HEX_SIZE);
  float cellHash = hash21(hx.zw + uSeed * 17.0);
  float dissolve = smoothstep(life * 0.45, life * 0.95, t);
  float alive = t < 0.0 ? 1.0 : step(dissolve, cellHash * 0.92 + 0.04);

  float edge = hexEdgeDist(hx.xy);
  float line = fillAA((edge - 0.065) * HEX_SIZE);
  float cellFlicker = 0.75 + 0.25 * sin(uPhase * 9.0 + cellHash * 40.0);

  // 冲击涟漪：爆点起一圈亮格由中心推向外缘。
  float cellDist = length(hx.zw * vec2(1.0, 1.7320508)) * HEX_SIZE;
  float waveOff = (cellDist - 260.0 * t) / 16.0;
  float wave = t > 0.0 ? exp(-waveOff * waveOff) * (1.0 - smoothstep(0.1, 0.4, t)) : 0.0;

  float shellVis = formed * inside * alive;
  float hold = t < 0.0 ? 1.0 : 1.0 - 0.45 * smoothstep(0.15, life * 0.5, t);

  // 罩体：淡淡的蓝色填充，外缘更浓。
  paint(c, uColor * 0.35, (0.05 + 0.2 * fres) * shellVis * hold);
  // 蜂窝线：外缘清晰、中心几乎不可见；涟漪经过时整格点亮。
  emit(c, uColor, line * (0.12 + 0.75 * fres) * cellFlicker * shellVis * hold);
  emit(c, hotColor(0.45), (line * 0.9 + 0.35 * (1.0 - smoothstep(0.0, 0.5, edge))) * wave * shellVis);

  // 外壳轮廓：爆点闪亮，之后稳定微光。
  float dRim = abs(r - SHELL_R) - 1.6;
  float rimAmp = (t < 0.0 ? 0.6 : 0.55 + 1.3 * exp(-t * 9.0)) * formed * (t < 0.0 ? 1.0 : 1.0 - dissolve);
  emit(c, hotColor(0.3), (fillAA(dRim) + 0.7 * glowOf(dRim, 6.0)) * rimAmp);

  emit(c, hotColor(0.7), scanLine * 0.8);

  // 爆点：中心一记柔光。
  if (t > 0.0) emit(c, hotColor(0.6), glowOf(r, 22.0) * exp(-t * 12.0) * 0.6);

  gl_FragColor = finalize(c * hitEndFade());
}
`;
