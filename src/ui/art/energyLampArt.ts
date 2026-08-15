// 键 = EnergyTier.tier, 值 = 该档位的沙漏光色。
const ENERGY_LAMP_GLOW: Record<number, string> = {
  1: "#5cf07d",
  2: "#3fd2ff",
  3: "#ffd447",
  4: "#ff9836",
  5: "#ff4a3d",
};

const ENERGY_LAMP_INTENSITY: Record<number, number> = {
  1: 2.1,
  2: 1.95,
  3: 1.8,
  4: 1.65,
  5: 1.5,
};

export function energyLampGlow(tier: number): string {
  return ENERGY_LAMP_GLOW[tier] ?? ENERGY_LAMP_GLOW[5];
}

export function energyLampIntensity(tier: number): number {
  return ENERGY_LAMP_INTENSITY[tier] ?? ENERGY_LAMP_INTENSITY[5];
}