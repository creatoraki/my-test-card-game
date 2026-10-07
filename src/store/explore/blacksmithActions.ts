import { makeCard } from "@/data";
import { cardDisplayName, RULES, type Card } from "@/engine";
import { rngFloat, rngPick, shuffle } from "@/engine/core/rng";
import { BLACKSMITH_SERVICES, type BlacksmithService, type BlacksmithState } from "@/explore/curio/blacksmithTypes";
import { payServiceFood } from "@/explore/curio/foodPayment";
import type { ExploreState } from "@/explore/types";
import { addCardToDeck, availablePools, commonReplaceCandidates, rollRarity } from "../town/deckCards";
import { useTownStore } from "../town/townStore";
import { useExploreStore } from "./exploreStore";
import { activeBlacksmith, blacksmithCardReason, blacksmithServiceReason } from "./blacksmithRules";

export function openBlacksmith(): boolean {
  const current = useExploreStore.getState().session;
  if (!current || (current.phase !== "landed" && current.phase !== "forging") || !activeBlacksmith(current)) return false;
  if (current.phase === "forging" && activeBlacksmith(current)?.blacksmith) return true;
  const draft = structuredClone(current);
  const object = activeBlacksmith(draft)!;
  object.blacksmith ??= {
    services: shuffle(draft, Object.keys(BLACKSMITH_SERVICES) as BlacksmithService[]).slice(0, 2) as [BlacksmithService, BlacksmithService],
    status: "available",
  };
  draft.phase = "forging";
  useExploreStore.setState({ session: draft });
  return true;
}

function recordService(session: ExploreState, forge: BlacksmithState): void {
  if (!forge.selected) return;
  const object = activeBlacksmith(session)!;
  const room = session.dungeon!.rooms[session.dungeon!.currentRoomId];
  const service = BLACKSMITH_SERVICES[forge.selected];
  const result = forge.result;
  const note = result?.after ? `获得「${cardDisplayName(result.after)}」`
    : result?.before ? `删除「${cardDisplayName(result.before)}」` : service.name;
  session.history.push({
    slot: "node", round: session.round, segment: room.curios.indexOf(object), lane: 0,
    roomLabel: room.label, eventId: "curio-blacksmith", eventTitle: "锻造师", eventKind: "merchant",
    choiceIndex: forge.services.indexOf(forge.selected), choiceLabel: service.name,
    notes: [note, `消耗临期食品${service.food}份`],
  });
  session.log.push(`${room.label}号房间：锻造师 · ${service.name} · ${note} · 临期食品−${service.food}`);
}

/** 选人后确认抽牌：候选保存在探索房间，不占用据点的抽卡待办。 */
export function startBlacksmithDraw(charId: string): boolean {
  const current = useExploreStore.getState().session;
  const town = useTownStore.getState();
  const character = town.characters[charId];
  if (!current || current.phase !== "forging" || !character) return false;
  const forge = activeBlacksmith(current)?.blacksmith;
  if (!forge?.services.includes("draw") || blacksmithServiceReason(current, town.characters, "draw")) return false;
  if (!current.party.some(member => member.charId === charId && member.alive)) return false;
  const draft = structuredClone(current);
  const pools = availablePools(character);
  const rarity = rollRarity(character.deckLevel, pools, () => rngFloat(draft));
  const options = shuffle(draft, pools[rarity]).slice(0, RULES.deck.drawChoices);
  if (!options.length || !payServiceFood(draft, BLACKSMITH_SERVICES.draw.food)) return false;
  const nextForge = activeBlacksmith(draft)!.blacksmith!;
  nextForge.status = "drawing";
  nextForge.selected = "draw";
  nextForge.charId = charId;
  nextForge.offers = options.map(id => makeCard(id));
  useExploreStore.setState({ session: draft });
  return true;
}

export function pickBlacksmithDraw(uid: string): boolean {
  const current = useExploreStore.getState().session;
  if (!current || current.phase !== "forging") return false;
  const forge = activeBlacksmith(current)?.blacksmith;
  const offer = forge?.offers?.find(card => card.uid === uid);
  if (forge?.status !== "drawing" || !forge.charId || !offer) return false;
  const town = useTownStore.getState();
  const character = town.characters[forge.charId];
  if (!character || !current.party.some(member => member.alive && member.charId === forge.charId)) return false;
  const nextCharacter = structuredClone(character);
  if (!addCardToDeck(nextCharacter, offer.id)) return false;
  const draft = structuredClone(current);
  const nextForge = activeBlacksmith(draft)!.blacksmith!;
  nextForge.status = "completed";
  nextForge.offers = undefined;
  nextForge.result = { charId: forge.charId, after: structuredClone(nextCharacter.deck[nextCharacter.deck.length - 1]) };
  recordService(draft, nextForge);
  useTownStore.setState({ characters: { ...town.characters, [forge.charId]: nextCharacter } });
  useExploreStore.setState({ session: draft });
  return true;
}

/** 三种指定卡牌的服务在同步操作内校验和结算，失败不提交任何修改。 */
export function performBlacksmithService(service: Exclude<BlacksmithService, "draw">, charId: string, uid: string): boolean {
  const current = useExploreStore.getState().session;
  const town = useTownStore.getState();
  const character = town.characters[charId];
  if (!current || current.phase !== "forging" || !character) return false;
  const forge = activeBlacksmith(current)?.blacksmith;
  if (!forge?.services.includes(service) || blacksmithServiceReason(current, town.characters, service)) return false;
  if (!current.party.some(member => member.alive && member.charId === charId)) return false;
  const before = character.deck.find(card => card.uid === uid);
  if (!before || blacksmithCardReason(character, service, before)) return false;
  const draft = structuredClone(current);
  const nextCharacter = structuredClone(character);
  let after: Card | undefined;
  if (service === "replace") {
    after = makeCard(rngPick(draft, commonReplaceCandidates(character, uid)));
    nextCharacter.deck = nextCharacter.deck.map(card => card.uid === uid ? after! : card);
  } else if (service === "remove") {
    nextCharacter.deck = nextCharacter.deck.filter(card => card.uid !== uid);
  } else {
    if (!addCardToDeck(nextCharacter, before.id)) return false;
    after = nextCharacter.deck[nextCharacter.deck.length - 1];
  }
  if (!payServiceFood(draft, BLACKSMITH_SERVICES[service].food)) return false;
  const nextForge = activeBlacksmith(draft)!.blacksmith!;
  nextForge.status = "completed";
  nextForge.selected = service;
  nextForge.result = { charId, before: structuredClone(before), after: after ? structuredClone(after) : undefined };
  recordService(draft, nextForge);
  useTownStore.setState({ characters: { ...town.characters, [charId]: nextCharacter } });
  useExploreStore.setState({ session: draft });
  return true;
}
