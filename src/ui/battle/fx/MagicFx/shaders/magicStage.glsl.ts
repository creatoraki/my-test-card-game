/**
 * 全屏群攻特效的公共片段(拼在 GLSL_MAGIC_COMMON 之后)。
 * 坐标: s = vUv * uSize, 原点在画布左下角、y 朝上、单位设计 px;
 * 目标中心由 uT0~uT2 传入(同一坐标系), uCount 为实际目标数(0~3)。
 * 所有目标共用同一个爆点(战斗里掉血/飘字同时结算), 不做错拍。
 */
export const GLSL_MAGIC_STAGE = /* glsl */ `
uniform vec2 uT0;
uniform vec2 uT1;
uniform vec2 uT2;
uniform float uCount;

vec2 stageCoord() {
  return vUv * uSize;
}

vec2 stageTarget(int i) {
  if (i == 0) return uT0;
  if (i == 1) return uT1;
  return uT2;
}

/** 目标行的平均高度: 群体特效的横带(暗幕、怨灵群)围绕它铺开。 */
float stageRowY() {
  float sum = uT0.y;
  if (uCount > 1.5) sum += uT1.y;
  if (uCount > 2.5) sum += uT2.y;
  return sum / max(uCount, 1.0);
}

/** 整张画布边缘 32px 渐隐。 */
float stageEdge(vec2 s) {
  return smoothstep(0.0, 32.0, min(min(s.x, uSize.x - s.x), min(s.y, uSize.y - s.y)));
}
`;
