import { RULES } from "@/engine";
import { useTownStore } from "@/store/town/townStore";

/** 主城只订阅常驻概览所需数据。 */
export function useStationStatus() {
  const day = useTownStore((state) => state.day);
  const loot = useTownStore((state) => state.loot);
  const partyCount = useTownStore((state) => state.party.length);

  return { day, loot, partyCount, partySize: RULES.progression.partySize };
}
