import { getCardDef } from "@/data";
import type { Card } from "@/engine";
import type { ExploreState } from "@/explore/types";
import type { BlacksmithService } from "@/explore/curio/blacksmithTypes";
import { BLACKSMITH_SERVICES } from "@/explore/curio/blacksmithTypes";
import { serviceFoodCount } from "@/explore/curio/foodPayment";
import { availablePools, canAddCopy, canAddRarity, commonReplaceCandidates } from "../town/deckCards";
import type { CharacterState } from "../town/townTypes";

export function activeBlacksmith(session: ExploreState) {
  const room = session.dungeon?.rooms[session.dungeon.currentRoomId];
  return room?.curios.find(object => object.id === session.corridor?.activeObjectId && object.kind === "blacksmith") ?? null;
}

export function blacksmithCardReason(character: CharacterState, service: BlacksmithService, card: Card): string | null {
  if (service === "remove") return character.deck.length <= character.minDeckSize ? `卡组至少保留${character.minDeckSize}张` : null;
  if (service === "replace") return commonReplaceCandidates(character, card.uid).length ? null : "没有可替换的普通卡";
  if (service === "copy") {
    const def = getCardDef(card.id);
    if (def.temporary) return "临时卡无法复制";
    const rarity = def.rarity === "basic" ? "common" : def.rarity ?? "common";
    if (!canAddCopy(character.deck, card.id)) return "同名卡数量已达上限";
    if (!canAddRarity(character.deck, rarity)) return "该稀有度卡牌数量已达上限";
  }
  return null;
}

export function blacksmithCharacterReason(character: CharacterState, service: BlacksmithService): string | null {
  if (service === "draw") return Object.values(availablePools(character)).some(pool => pool.length) ? null : "没有可抽取的卡牌";
  return character.deck.some(card => !blacksmithCardReason(character, service, card)) ? null : "没有可处理的卡牌";
}

export function blacksmithServiceReason(session: ExploreState, characters: Record<string, CharacterState>, service: BlacksmithService): string | null {
  if (activeBlacksmith(session)?.blacksmith?.status !== "available") return "本次服务已锁定或结束";
  const price = BLACKSMITH_SERVICES[service].food;
  if (serviceFoodCount(session) < price) return `需要临期食品${price}份`;
  return session.party.some(member => member.alive && characters[member.charId] && !blacksmithCharacterReason(characters[member.charId], service))
    ? null : "没有可执行此服务的存活角色";
}
