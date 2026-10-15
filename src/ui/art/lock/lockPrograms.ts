import { GLSL_COMMON, type GlslProgramDef, type GlslUniforms } from "@/ui/common/fx/GlslSprite";
import { GLSL_PADLOCK, GLSL_PADLOCK_UNIFORMS } from "./padlock.glsl";
import { GLSL_PADLOCK_UNLOCK } from "./padlockUnlock.glsl";

/** 绘制顺序：刻度环 → (锁头单独成层：外晕 → 锁梁 → 锁身 → 扫描线 → 拒绝闪光 → 碎片) → 开锁火花。 */
const MAIN = /* glsl */ `
void main() {
  vec2 p = vUv * uSize - uSize * 0.5;
  float t = uPhase;
  float deny = uActive * (1.0 - uUnlock);
  float burst = unlockBurst(t);
  vec3 glow = mix(mix(uGlow, uAlert, deny), uOpen, unlockTint(t));
  float lit = 0.9 + 0.1 * vnoise(vec2(uTime * 9.0, uSeed * 13.0));
  // 常态缓慢上下浮动；拒绝时横向急抖
  p.y -= sin(uTime * 1.4 + uSeed * 6.28) * 3.0;
  p.x += deny * sin(uTime * 58.0) * 5.0;

  vec4 c = vec4(0.0);
  drawRings(c, p / (1.0 + burst * 0.7), glow, t * (1.0 + uUnlock * 3.0), lit * (1.0 + deny * 0.8) * (1.0 - burst));

  // 锁头：碎散时整体微微胀开
  vec2 lp = p / (1.0 + burst * 0.12);
  vec2 shackleP = lp - vec2(0.0, unlockPop(t));
  float dAll = min(sdRoundBox(lp - vec2(0.0, BODY_Y), BODY_HALF, 8.0), sdShackle(shackleP - vec2(0.0, SHACKLE_Y)));
  vec4 lc = vec4(0.0);
  drawShackle(lc, shackleP);
  drawBody(lc, lp, glow, t);
  drawHolo(lc, lp, dAll, glow, t, lit * (1.0 - burst));
  emit(lc, uAlert, deny * 0.22 * fillAA(dAll));
  emit(lc, uOpen, uUnlock * 0.3 * exp(-length(lp - vec2(0.0, -7.0)) / 10.0) * smoothstep(0.15, 0.4, t) * (1.0 - burst));
  if (burst > 0.0) {
    vec2 shard = shardState(lp, burst);
    emit(lc, uOpen, 0.9 * shard.y * fillAA(dAll));
    lc *= 1.0 - shard.x;
  }
  c = lc + c * (1.0 - lc.a);

  drawUnlockBurst(c, p, uOpen, burst);
  gl_FragColor = finalize(c);
}
`;

/** 未开放建筑的锁头(常态与开锁演出共用一个程序)。 */
export const PADLOCK_PROGRAM: GlslProgramDef = {
  key: "town.padlock",
  fragment: [GLSL_PADLOCK_UNIFORMS, GLSL_COMMON, GLSL_PADLOCK, GLSL_PADLOCK_UNLOCK, MAIN].join("\n"),
};

/** 画布几何(设计 px)：锁头居中，外圈刻度环半径约 75，开锁火花最远约 100。 */
export const PADLOCK_GEOMETRY = { width: 220, height: 220 } as const;

/** 常态警示红、拒绝时更亮的告警色、开锁转成的据点青。 */
const PALETTE = {
  uGlow: [1.0, 0.22, 0.2],
  uAlert: [1.0, 0.52, 0.4],
  uOpen: [0.34, 1.0, 0.89],
} as const;

export const PADLOCK_UNIFORMS: GlslUniforms = { ...PALETTE, uUnlock: 0 };

/** 开锁演出：须重新挂载 GlslSprite 让 uPhase 从 0 起算。 */
export const PADLOCK_UNLOCK_UNIFORMS: GlslUniforms = { ...PALETTE, uUnlock: 1 };
