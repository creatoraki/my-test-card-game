import { getCharacter } from "@/data";
import type { PartySnapshot } from "@/explore/types";
import type { ItemStack } from "@/items/types";
import { partySnapshot } from "@/store/run/party";
import { freshProfile, freshStorage } from "@/store/town/townProfile";
import { deriveStats, useTownStore, vitalsOf } from "@/store/town/townStore";

/**
 * 演示用队伍: 存档里有上阵队伍就直接用; 没有(从未建档)时按新档拼一份快照,
 * 全程只读, 不写入 townStore, 不影响真实存档。
 */
export function demoParty(): PartySnapshot[] {
  if (useTownStore.getState().party.length) return partySnapshot();
  const profile = freshProfile(false);
  return profile.party.map((id) => {
    const character = getCharacter(id);
    const state = profile.characters[id];
    const vitals = vitalsOf(state);
    return {
      charId: id,
      name: character.name,
      emoji: character.emoji,
      hp: vitals.hp,
      hpLimit: vitals.hpLimit,
      maxHp: vitals.maxHp,
      alive: true,
      burdenAdapt: deriveStats(state).burdenAdapt,
    };
  });
}

/** 演示背包: 新档的几件初始消耗品, 让底部背包栏不至于空空如也。 */
export function demoBackpack(): ItemStack[] {
  return freshStorage().slice(0, 6);
}
