// 净化粒子能量灯的素材登记处: 装置只使用一张透明底素材。
// 档位变化由萤火虫光色和提示层表达, 不再为同一构图预加载五张彩色图。
import lamp from "@/assets/通用素材/能量灯.png";

export const ENERGY_LAMP_ART = lamp;

// 键 = EnergyTier.tier, 值 = 该档位的萤火虫光色。
const ENERGY_LAMP_GLOW: Record<number, string> = {
  1: "#7bd93a",
  2: "#3fa9ff",
  3: "#ffd43b",
  4: "#b56bff",
  5: "#ff5a5a",
};

export const ENERGY_LAMP_SOURCES: readonly string[] = [ENERGY_LAMP_ART];

export function energyLampGlow(tier: number): string {
  return ENERGY_LAMP_GLOW[tier] ?? ENERGY_LAMP_GLOW[5];
}