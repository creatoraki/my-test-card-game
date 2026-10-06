import type { AnimHit, CardAnim } from "@/engine";

/** 同拍多个 DOT 按实际扣血量选主导特效，痛楚沿用引擎的 boneRot 标签。 */
export function dotHurtAnim(hits: readonly AnimHit[]): CardAnim {
  const damage = { fire: 0, poison: 0, torment: 0 };
  for (const part of hits.flatMap((hit) => hit.parts ?? [])) {
    if (part.hpDelta <= 0) continue;
    const kind = part.flags?.includes("boneRot") ? "torment"
      : part.flags?.includes("burn") ? "fire" : "poison";
    damage[kind] += part.hpDelta;
  }
  if (damage.torment > 0 && damage.torment >= damage.fire && damage.torment >= damage.poison) return "torment";
  return damage.fire > damage.poison ? "fire" : "poison";
}

/** 只有痛楚伤害的提前结算帧也使用诅咒动效，混合攻击保留招式自身表现。 */
export function isTormentOnly(hits: readonly AnimHit[]): boolean {
  const parts = hits.flatMap((hit) => hit.parts ?? []).filter((part) => part.hpDelta > 0);
  return parts.length > 0 && parts.every((part) => part.flags?.includes("boneRot"));
}
