// 新增状态美术只在此登记一次，StatusPips 与 HitFxLayer 自动生效。

import poisonArt from "@/assets/buffs/中毒.png";
import shieldArt from "@/assets/buffs/护盾.png";
import burnArt from "@/assets/buffs/烧伤.png";
import sharpArt from "@/assets/buffs/锋利.png";

export const STATUS_ART: Record<string, string> = {
  sharp: sharpArt,
  burn: burnArt,
  poison: poisonArt,
};

export const SHIELD_ART: string = shieldArt;

export function statusArtOf(id: string): string | undefined {
  return STATUS_ART[id];
}

export const STATUS_ART_SOURCES: readonly string[] = [sharpArt, burnArt, poisonArt, shieldArt];
