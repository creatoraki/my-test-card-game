// 经验、污染与怪癖 —— 战斗与远征结束时回填城镇档案, 以及探索事件对卡组的污染 / 净化。

import { POLLUTION_RULES, quirkIdsOf } from "@/engine";
import { getCharacter } from "@/data";
import { deriveStats, shiftVitals } from "../town/characterStats";
import type { ContaminationHit, ExpGain, TownGet, TownSet, TownStore } from "../town/townTypes";

export type ConditionSlice = Pick<
  TownStore,
  | "grantExp"
  | "grantExpEach"
  | "contaminateCards"
  | "cureQuirk"
  | "reducePollution"
  | "purifyCards"
  | "syncBattleConditions"
  | "syncExpeditionStatus"
>;

// 污染值落档口径: 不超过阈值 - 1(达到阈值的那一刻已在战斗内结算成怪癖并归零)。
function clampPollution(value: number): number {
  return Math.max(0, Math.min(POLLUTION_RULES.threshold - 1, Math.floor(value)));
}

export function createConditionSlice(set: TownSet, get: TownGet): ConditionSlice {
  return {
    // 发经验。★ 没有等级也没有升级 —— 经验只是进池子, 等玩家拿去锻造卡组。
    grantExp: (charIds, amount) => {
      const characters = { ...get().characters };
      const report: ExpGain[] = [];
      for (const id of charIds) {
        const cs = characters[id];
        if (!cs) continue;
        const exp = cs.exp + amount;
        characters[id] = { ...cs, exp, expEarned: cs.expEarned + amount };
        report.push({ charId: id, gained: amount, expAfter: exp });
      }
      set({ characters });
      return report;
    },

    grantExpEach: (byChar) => {
      const characters = { ...get().characters };
      const report: ExpGain[] = [];
      for (const [charId, amount] of Object.entries(byChar)) {
        const cs = characters[charId];
        if (!cs || amount <= 0) continue;
        const exp = cs.exp + amount;
        characters[charId] = { ...cs, exp, expEarned: cs.expEarned + amount };
        report.push({ charId, gained: amount, expAfter: exp });
      }
      if (report.length) set({ characters });
      return report;
    },

    contaminateCards: (charIds, count, each = false) => {
      const wanted = Math.max(0, Math.floor(count));
      if (!wanted || !charIds.length) return [];

      const characters = { ...get().characters };
      const hits: ContaminationHit[] = [];
      const targets = each ? charIds : ["__all__"];
      for (const target of targets) {
        const candidates: { charId: string; index: number }[] = [];
        for (const charId of each ? [target] : charIds) {
          const cs = characters[charId];
          if (!cs) continue;
          cs.deck.forEach((card, index) => {
            if (!card.contaminated) candidates.push({ charId, index });
          });
        }
        const amount = Math.min(wanted, candidates.length);
        for (let i = 0; i < amount; i++) {
          const pick = Math.floor(Math.random() * candidates.length);
          const candidate = candidates.splice(pick, 1)[0];
          const cs = characters[candidate.charId];
          const card = cs.deck[candidate.index];
          hits.push({
            charId: candidate.charId,
            charName: getCharacter(candidate.charId).name,
            cardName: card.name,
          });
          characters[candidate.charId] = {
            ...cs,
            deck: cs.deck.map((card, index) =>
              index === candidate.index ? { ...card, contaminated: true } : card,
            ),
          };
        }
      }

      if (hits.length) set({ characters });
      return hits;
    },

    cureQuirk: (charId, quirkId) => {
      const cs = get().characters[charId];
      if (!cs?.quirks.length) return null;
      const target = quirkId && cs.quirks.includes(quirkId) ? quirkId : cs.quirks[0];
      const next = { ...cs, quirks: cs.quirks.filter((id) => id !== target) };
      set({ characters: { ...get().characters, [charId]: shiftVitals(cs, next) } });
      return target;
    },

    reducePollution: (charId, amount) => {
      const cs = get().characters[charId];
      const wanted = Math.max(0, Math.floor(amount));
      if (!cs || !wanted) return 0;
      const actual = Math.min(cs.pollution, wanted);
      if (!actual) return 0;
      set({ characters: { ...get().characters, [charId]: { ...cs, pollution: cs.pollution - actual } } });
      return actual;
    },

    purifyCards: (charId, count, uids) => {
      const cs = get().characters[charId];
      let remaining = Math.max(0, Math.floor(count));
      if (!cs || !remaining) return 0;
      const wanted = uids?.length ? new Set(uids) : null;
      let purified = 0;
      const deck = cs.deck.map((card) => {
        if (remaining <= 0 || !card.contaminated || (wanted && !wanted.has(card.uid))) return card;
        remaining -= 1;
        purified += 1;
        return { ...card, contaminated: false };
      });
      if (!purified) return 0;
      set({ characters: { ...get().characters, [charId]: { ...cs, deck } } });
      return purified;
    },

    syncBattleConditions: (conditions) => {
      const characters = { ...get().characters };
      let changed = false;
      for (const condition of conditions) {
        const cs = characters[condition.charId];
        if (!cs) continue;
        const quirks = quirkIdsOf(condition.quirks).slice(0, POLLUTION_RULES.maxQuirks);
        const pollution = clampPollution(condition.pollution);
        if (
          cs.pollution === pollution &&
          cs.sick === condition.sick &&
          cs.quirks.length === quirks.length &&
          cs.quirks.every((id, index) => id === quirks[index])
        ) {
          continue;
        }
        const next = { ...cs, pollution, sick: condition.sick, quirks };
        characters[condition.charId] = shiftVitals(cs, next);
        changed = true;
      }
      if (changed) set({ characters });
    },

    // 回城落档 —— 生命三段里的前两段在这里变成永久损伤。
    // ★ 阵亡成员不再走这里, 见 markFallen; 这里只回填存活成员的最终状态。
    // ⚠ 夹取顺序是 hpLimit ≤ maxHp, 再 hp ≤ hpLimit —— 三段的不变式只在这一处维护。
    syncExpeditionStatus: (conditions) => {
      const characters = { ...get().characters };
      let changed = false;
      for (const condition of conditions) {
        const cs = characters[condition.charId];
        if (!cs) continue;
        const maxHp = Math.max(1, Math.round(deriveStats(cs).maxHp));
        const hpLimit = Math.max(1, Math.min(maxHp, Math.round(condition.hpLimit)));
        const hp = Math.max(1, Math.min(hpLimit, Math.round(condition.hp)));
        const pollution = clampPollution(condition.pollution);
        if (cs.hp === hp && cs.hpLimit === hpLimit && cs.pollution === pollution) continue;
        characters[condition.charId] = { ...cs, hp, hpLimit, pollution };
        changed = true;
      }
      if (changed) set({ characters });
    },
  };
}
