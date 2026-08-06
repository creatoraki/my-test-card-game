// 净化粒子能量灯的素材登记处(与 mapArt.ts / eventArt.ts 同思路: 静态 import + 登记表)。
// 5 张图构图完全重叠, 只有内部发光色不同 —— 按能量档位(EnergyTier.tier 1..5)取图,
// 换档时视觉上就是「同一个装置换了一种光」。
// ⚠ 档位阈值的真相点只有 explore/rules.ts 的 ENERGY_TIERS, 这里只做「档位号 → 图」的映射。
import lampGreen from "@/assets/通用素材/能量灯-绿.png";
import lampBlue from "@/assets/通用素材/能量灯-蓝.png";
import lampYellow from "@/assets/通用素材/能量灯-黄.png";
import lampPurple from "@/assets/通用素材/能量灯-紫.png";
import lampRed from "@/assets/通用素材/能量灯-红.png";

// 键 = EnergyTier.tier: 1 充盈 / 2 稳定 / 3 衰减 / 4 告急 / 5 枯竭。
const ENERGY_LAMP_ART: Record<number, string> = {
  1: lampGreen,
  2: lampBlue,
  3: lampYellow,
  4: lampPurple,
  5: lampRed,
};

export const ENERGY_LAMP_SOURCES: readonly string[] = [...new Set(Object.values(ENERGY_LAMP_ART))];

export function energyLampArt(tier: number): string {
  return ENERGY_LAMP_ART[tier] ?? lampRed;
}