// 据点左上角终端面板的数据源: 生存日、居民积分、三色水晶库存、队伍概况。
// ★ 面板自己订阅 townStore, TownScreen 不再逐项转发 —— 以后加一栏只改这里和面板本身。

import { useMemo } from "react";
import { RULES } from "@/engine";
import { countByItemId } from "@/items/inventory";
import { useTownStore } from "@/store/townStore";

export const HUD_CRYSTALS = [
  { itemId: "green-crystal", name: "绿色水晶", tone: "green" },
  { itemId: "blue-crystal", name: "蓝色水晶", tone: "blue" },
  { itemId: "red-crystal", name: "红色水晶", tone: "red" },
] as const;

export type HudCrystalTone = (typeof HUD_CRYSTALS)[number]["tone"];

export function useStationStatus() {
  const day = useTownStore((state) => state.day);
  const loot = useTownStore((state) => state.loot);
  const storage = useTownStore((state) => state.storage);
  const party = useTownStore((state) => state.party);
  const awakened = useTownStore((state) => state.awakened);
  const fallen = useTownStore((state) => state.fallen);
  const resting = useTownStore((state) => state.nutrition.occupants.length);
  const purifying = useTownStore((state) => state.sanctuary.purifying.length);

  const crystals = useMemo(
    () => HUD_CRYSTALS.map((crystal) => ({ ...crystal, count: countByItemId(storage, crystal.itemId) })),
    [storage],
  );

  return {
    day,
    loot,
    crystals,
    partyCount: party.length,
    partySize: RULES.progression.partySize,
    rosterCount: awakened.length,
    fallenCount: fallen.length,
    resting,
    purifying,
  };
}
