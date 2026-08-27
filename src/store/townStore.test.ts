import { describe, expect, it } from "vitest";
import { CHARACTERS } from "../data";
import { useTownStore } from "./townStore";

describe("城镇档案初始化", () => {
  it("重置存档时所有角色的初始卡牌都标记为污染", () => {
    useTownStore.getState().resetProfile();
    const characters = useTownStore.getState().characters;

    for (const character of CHARACTERS) {
      const deck = characters[character.id].deck;
      expect(deck).toHaveLength(character.startingCardIds.length);
      expect(deck.every((card) => card.contaminated)).toBe(true);
    }
  });
});