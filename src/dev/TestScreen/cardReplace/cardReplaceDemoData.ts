import { getCharacter, makeCard } from "@/data";
import type { CardReplaceResult, PartySnapshot } from "@/explore/types";
import type { DeckServiceMode, DeckServiceResult } from "@/ui/explore/CardReplace";
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

/** 演示用删牌 / 复制: 返回结果与改动后的卡组, 不写入游戏存档。 */
export function runDemoService(mode: DeckServiceMode, character: CharacterState, uid: string): { result: DeckServiceResult; deck: CharacterState["deck"] } | null {
  const before = character.deck.find((card) => card.uid === uid);
  if (!before) return null;
  if (mode === "replace") {
    const result = replaceDemoCard(character, uid);
    return result ? { result, deck: character.deck.map((card) => card.uid === uid ? result.after : card) } : null;
  }
  if (mode === "remove") {
    return { result: { charId: character.charId, before }, deck: character.deck.filter((card) => card.uid !== uid) };
  }
  const after = makeCard(before.id);
  return { result: { charId: character.charId, before, after }, deck: [...character.deck, after] };
}
