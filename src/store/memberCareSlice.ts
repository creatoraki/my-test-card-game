// 队员生命周期 —— 编队上下阵、阵亡与复苏、营养舱疗养、圣水池净化诅咒遗物。

import { RULES } from "../engine";
import {
  NUTRITION_TECHS,
  NUTRITION_TREAT_COST,
  SANCTUARY_RULES,
  getBadge,
  getCharacter,
  getItemDef,
  isTechAvailable,
  nutritionHeal,
  nutritionPods,
  nutritionTechCost,
  spentPoints,
} from "../data";
import { consumeItems, removeByUid } from "../items/inventory";
import { freshCharacter, squadTrainingPoints } from "./townProfile";
import type { TownGet, TownSet, TownStore } from "./townTypes";

export type MemberCareSlice = Pick<
  TownStore,
  | "toggleParty"
  | "markFallen"
  | "reviveFallen"
  | "admitToNutritionPods"
  | "researchNutritionTech"
  | "purifyRelic"
>;

export function createMemberCareSlice(set: TownSet, get: TownGet): MemberCareSlice {
  return {
    toggleParty: (charId) => {
      const { party, characters, awakened, nutrition } = get();
      if (!characters[charId]) return;
      if (nutrition.occupants.some((occupant) => occupant.charId === charId)) return;
      if (party.includes(charId)) {
        if (party.length <= 1) return; // 至少保留 1 人上阵
        set({ party: party.filter((id) => id !== charId) });
      } else {
        if (!awakened.includes(charId)) return; // 阵亡或未归队的人上不了阵
        if (party.length >= RULES.progression.partySize) return;
        set({ party: [...party, charId] });
      }
    },

    // 回城落袋时唯一的阵亡出口。装备在 run 层里先被剥离, 这里保留档案供复苏舱展示姓名。
    markFallen: (charIds) => {
      const { awakened, fallen, party, characters, squadTalent, techTree } = get();
      const nextIds = [...new Set(charIds)].filter(
        (charId) => awakened.includes(charId) && !fallen.includes(charId),
      );
      if (!nextIds.length) return;

      const nextAwakened = awakened.filter((charId) => !nextIds.includes(charId));
      const nextFallen = [...fallen, ...nextIds];
      const badge = squadTalent.badgeId ? getBadge(squadTalent.badgeId) : null;
      const nextTalent =
        badge && spentPoints(badge, squadTalent.nodes) > squadTrainingPoints({ characters, awakened: nextAwakened, techTree })
          ? { ...squadTalent, nodes: [] }
          : squadTalent;
      set({
        awakened: nextAwakened,
        fallen: nextFallen,
        party: party.filter((charId) => !nextIds.includes(charId)),
        squadTalent: nextTalent,
      });
    },

    // 复苏不自动上阵 —— 队伍可能已经满员, 编队取舍交给玩家。
    // ★ 不做积分余额护栏, 全员阵亡时允许透支复苏, 避免形成死档。
    reviveFallen: (charId) => {
      const { fallen, awakened, characters, loot } = get();
      if (!fallen.includes(charId) || !characters[charId]) return;
      const cost = RULES.progression.reviveCost;
      set({
        loot: loot - cost,
        fallen: fallen.filter((id) => id !== charId),
        awakened: [...awakened, charId],
        characters: { ...characters, [charId]: freshCharacter(getCharacter(charId)) },
      });
    },

    admitToNutritionPods: (assignments) => {
      if (!assignments.length) return;

      const { awakened, characters, day, loot, nutrition, party } = get();
      const capacity = nutritionPods(nutrition.techs);
      const occupiedSlots = new Set(nutrition.occupants.map((occupant) => occupant.slot));
      const occupiedCharacters = new Set(nutrition.occupants.map((occupant) => occupant.charId));
      const assignedCharacters = new Set<string>();
      const assignedSlots = new Set<number>();

      for (const assignment of assignments) {
        const cs = characters[assignment.charId];
        if (
          !cs ||
          !awakened.includes(assignment.charId) ||
          occupiedCharacters.has(assignment.charId) ||
          assignedCharacters.has(assignment.charId) ||
          !Number.isInteger(assignment.slot) ||
          assignment.slot < 0 ||
          assignment.slot >= capacity ||
          assignedSlots.has(assignment.slot) ||
          occupiedSlots.has(assignment.slot)
        ) return;
        assignedCharacters.add(assignment.charId);
        assignedSlots.add(assignment.slot);
      }

      if (party.filter((id) => !assignedCharacters.has(id)).length < 1) return;

      const totalCost = NUTRITION_TREAT_COST * assignments.length;
      if (loot < totalCost) return;

      const heal = nutritionHeal(nutrition.techs);
      set({
        loot: loot - totalCost,
        party: party.filter((id) => !assignedCharacters.has(id)),
        nutrition: {
          ...nutrition,
          occupants: [
            ...nutrition.occupants,
            ...assignments.map(({ charId, slot }) => ({ charId, heal, day, slot })),
          ],
        },
      });
    },

    researchNutritionTech: (techId) => {
      const { nutrition, storage } = get();
      const tech = NUTRITION_TECHS.find((entry) => entry.id === techId);
      if (!tech || !isTechAvailable(tech, nutrition.techs)) return;
      if (!nutritionTechCost(tech, storage).ok) return;

      let nextStorage = storage;
      for (const material of tech.materials) {
        nextStorage = consumeItems(nextStorage, material.itemId, material.count);
      }
      set({
        storage: nextStorage,
        nutrition: { ...nutrition, techs: [...nutrition.techs, tech.id] },
      });
    },

    purifyRelic: (relicId) => {
      const { storage, loot, sanctuary } = get();
      if (sanctuary.purifying.length >= SANCTUARY_RULES.capacity) return false;
      const relic = storage.find((stack) => stack.itemId === relicId);
      if (!relic) return false;
      const def = getItemDef(relicId);
      const spec = def.relic;
      if (def.category !== "relic" || spec?.polarity !== "curse" || !spec.purifyTo) return false;

      const materials = SANCTUARY_RULES.crystalCostByRarity[def.rarity];
      const enoughMaterials = Object.entries(materials).every(
        ([itemId, count]) => get().storage.filter((stack) => stack.itemId === itemId).reduce((sum, stack) => sum + stack.count, 0) >= count,
      );
      const cost = SANCTUARY_RULES.lootByRarity[def.rarity];
      if (!enoughMaterials || loot < cost) return false;

      let nextStorage = removeByUid(storage, relic.uid);
      for (const [itemId, count] of Object.entries(materials))
        nextStorage = consumeItems(nextStorage, itemId, count);
      set({
        storage: nextStorage,
        loot: loot - cost,
        sanctuary: {
          ...sanctuary,
          purifying: [...sanctuary.purifying, { relicId, daysLeft: SANCTUARY_RULES.days }],
        },
      });
      return true;
    },
  };
}
