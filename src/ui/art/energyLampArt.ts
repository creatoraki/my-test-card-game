// 净化粒子能量灯的素材登记处: 装置只使用一张透明底素材。
// 档位变化由萤火虫光色和提示层表达, 不再为同一构图预加载五张彩色图。
import lamp from "@/assets/通用素材/能量灯.png";

export const ENERGY_LAMP_ART = lamp;

// 键 = EnergyTier.tier, 值 = 该档位的灯笼光色。
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

export const ENERGY_LAMP_SOURCES: readonly string[] = [ENERGY_LAMP_ART];

export function energyLampGlow(tier: number): string {
  return ENERGY_LAMP_GLOW[tier] ?? ENERGY_LAMP_GLOW[5];
}

export function energyLampIntensity(tier: number): number {
  return ENERGY_LAMP_INTENSITY[tier] ?? ENERGY_LAMP_INTENSITY[5];
}