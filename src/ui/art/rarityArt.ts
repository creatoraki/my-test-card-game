import type { Rarity } from "@/engine";
import commonCrystal from "@/assets/通用素材/白色水晶.png";
import uncommonCrystal from "@/assets/通用素材/绿色水晶.png";
import rareCrystal from "@/assets/通用素材/紫色水晶.png";

export const RARITY_CRYSTAL_ART: Record<Rarity, string> = {
  common: commonCrystal,
  uncommon: uncommonCrystal,
  rare: rareCrystal,
};

export const RARITY_CRYSTAL_SOURCES: readonly string[] = [commonCrystal, uncommonCrystal, rareCrystal];