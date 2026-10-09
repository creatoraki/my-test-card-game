import { getCharacter, makeCard } from "@/data";
import type { CardReplaceResult, PartySnapshot } from "@/explore/types";
import { commonReplaceCandidates } from "@/store/town/deckCards";
import { freshCharacter } from "@/store/town/townProfile";
import type { CharacterState } from "@/store/town/townTypes";

const DEMO_CHAR_IDS = ["swordsman", "prophet", "botanist"];

/** 每轮生成全新的演示卡组，不写入游戏存档。 */
export function createCardReplaceDemo() {
  const characters: Record<string, CharacterState> = {};
  const members: PartySnapshot[] = DEMO_CHAR_IDS.map((charId) => {
    const def = getCharacter(charId);
    const character = freshCharacter(def);
    character.deck.push(...def.pools.uncommon.slice(0, 2).map((id) => makeCard(id)));
    characters[charId] = character;
    return {
      charId,
      name: def.name,
      emoji: def.emoji,
      hp: character.hp,
      hpLimit: character.hpLimit,
      maxHp: def.base.maxHp,
      alive: true,
      burdenAdapt: 0,
    };
  });
  return { characters, members };
}

export function replaceDemoCard(character: CharacterState, uid: string): CardReplaceResult | null {
  const before = character.deck.find((card) => card.uid === uid);
  const candidates = commonReplaceCandidates(character, uid);
  if (!before || !candidates.length) return null;
  const after = makeCard(candidates[Math.floor(Math.random() * candidates.length)]);
  return { charId: character.charId, before, after };
}
