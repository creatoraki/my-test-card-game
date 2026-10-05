import type { BondDef } from "@/data/roster/bonds";

/** 将同一效果的各档数值合并，门槛与数值始终读取实际羁绊配置。 */
export function bondEffectParts(def: BondDef) {
  const effects = def.tiers.map((tier) => tier.desc.match(/^(.*?)(\d+(?:\.\d+)?)(%?)(.*)$/));
  const first = effects[0];

  if (!first || !effects.every((effect) =>
    effect && effect[1] === first[1] && effect[3] === first[3] && effect[4] === first[4],
  )) {
    return null;
  }

  const prefix = first[1].replace(/\s*\+\s*$/, "提升 ");
  const values = effects.map((effect) => `${effect![2]}${effect![3]}`);
  return { prefix, values, suffix: first[4] };
}

export function bondEffectText(def: BondDef): string {
  const parts = bondEffectParts(def);
  if (!parts) return def.tiers.map((tier) => `${tier.desc}（${tier.count}）`).join("；");
  return `${parts.prefix}${parts.values.join("/")}${parts.suffix}（${def.tiers.map((tier) => tier.count).join("/")}）`;
}
