// 城镇角色档案 ↔ 探索层队伍快照的换算。

import { getCharacter } from "../../data";
import type { PartySnapshot } from "../../explore/types";
import { useExploreStore } from "../exploreStore";
import { deriveStats, useTownStore, vitalsOf } from "../townStore";

// 上阵角色 → 探索层的队伍快照。血量在整趟远征里由 exploreStore 持有并跨战斗继承。
// ★ 出发时**不回满**: 当前 HP 与体力极限直接读城镇存档(vitalsOf) —— 上一趟远征留下的
//   是永久损伤, 跨日传承。据点暂无治疗手段, 唯一的恢复途径是远征途中的消耗品与生存事件。
// ⚠ 这里的 maxHp **不含羁绊加成** —— 羁绊在 launchBattle 才叠。本期实装的羁绊都不改 maxHp,
//   所以两处口径一致; 日后一旦有加 maxHp 的羁绊, 这里必须一并叠, 否则出发时的血量会对不上。
export function partySnapshot(): PartySnapshot[] {
  const { characters, party } = useTownStore.getState();
  return party.map((id) => {
    const c = getCharacter(id);
    const stats = deriveStats(characters[id]);
    const vitals = vitalsOf(characters[id]);
    return {
      charId: id,
      name: c.name,
      emoji: c.emoji,
      hp: vitals.hp,
      hpLimit: vitals.hpLimit,
      maxHp: vitals.maxHp,
      alive: true,
      // ★ 负重适应随快照一起带进探索层 —— 之后算负重惩罚就不用回头来问 townStore 了。
      burdenAdapt: stats.burdenAdapt,
      tradeEligibility: {
        deckSize: characters[id].deck.length,
        minDeckSize: characters[id].minDeckSize,
        contaminatedCards: characters[id].deck.filter((card) => card.contaminated).length,
        quirkCount: characters[id].quirks.length,
      },
    };
  });
}

// 换装之后把这名角色的快照对齐到新的面板值。
// ★ 只裁不补(见 explore/session syncPartyVitals): 上限跟着装备走, 当前血量不因换装回复。
// ⚠ 口径必须与 partySnapshot() 一致(同样是 deriveStats 的局外值、同样不含羁绊), 否则
//   出击时算一套、途中换装又算另一套, 血量上限会在开战瞬间跳一下。
export function syncMemberStats(charId: string): void {
  const cs = useTownStore.getState().characters[charId];
  if (!cs) return;
  const stats = deriveStats(cs);
  useExploreStore.getState().syncPartyVitals(charId, stats.maxHp, stats.burdenAdapt);
}

export function alivePartyIds(): string[] {
  return (
    useExploreStore
      .getState()
      .session?.party.filter((member) => member.alive)
      .map((member) => member.charId) ?? []
  );
}
