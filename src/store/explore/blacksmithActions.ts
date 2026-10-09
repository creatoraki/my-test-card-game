import { makeCard } from "@/data";
import { cardDisplayName, type Card } from "@/engine";
import { rngFloat, rngPick, shuffle } from "@/engine/core/rng";
import { BLACKSMITH_SERVICES, type BlacksmithService, type BlacksmithState } from "@/explore/curio/blacksmithTypes";
import { payServiceFood } from "@/explore/curio/foodPayment";
import type { ExploreState } from "@/explore/types";
import { addCardToDeck, commonReplaceCandidates, rollPartyDrawOffers } from "../town/deckCards";
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
  // 服务完成或付费后放弃时，同步房间与当前场景的使用状态，复用普通交互物的变灰表现。
  object.used = true;
  const sceneObject = session.corridor?.objects.find(candidate => candidate.id === object.id);
  if (sceneObject) sceneObject.used = true;
  const room = session.dungeon!.rooms[session.dungeon!.currentRoomId];
  const service = BLACKSMITH_SERVICES[forge.selected];
  const result = forge.result;
  const note = result?.after ? `获得「${cardDisplayName(result.after)}」`
    : result?.before ? `删除「${cardDisplayName(result.before)}」` : "已放弃服务";
  session.history.push({
    slot: "node", round: session.round, segment: room.curios.indexOf(object), lane: 0,
    roomLabel: room.label, eventId: "curio-blacksmith", eventTitle: "锻造师", eventKind: "merchant",
    choiceIndex: forge.services.indexOf(forge.selected), choiceLabel: service.name,
    notes: [note, `消耗临期食品${service.food}份`],
  });
  session.log.push(`${room.label}号房间：锻造师 · ${service.name} · ${note} · 临期食品−${service.food}`);
}

/**
 * 选择服务即扣除临期食品并锁定该服务，另一项服务随即失效。
 * 换牌 / 删牌 / 复制随后由卡组面板选人选卡; 抽牌同一步直接生成全队混合候选(不选人)。
 */
export function payBlacksmithService(service: BlacksmithService): boolean {
  const current = useExploreStore.getState().session;
  if (!current || current.phase !== "forging") return false;
  const forge = activeBlacksmith(current)?.blacksmith;
  const town = useTownStore.getState();
  if (!forge?.services.includes(service) || blacksmithServiceReason(current, town.characters, service)) return false;
  const draft = structuredClone(current);
  let offers: BlacksmithState["offers"];
  if (service === "draw") {
    // 先抽后扣费: 抽不出候选(理论上 serviceReason 已拦下)时整笔不提交。
    const members = draft.party.flatMap(member => member.alive && town.characters[member.charId] ? [town.characters[member.charId]] : []);
    offers = rollPartyDrawOffers(members, () => rngFloat(draft)).map(offer => ({ charId: offer.charId, card: makeCard(offer.cardDefId) }));
    if (!offers.length) return false;
  }
  if (!payServiceFood(draft, BLACKSMITH_SERVICES[service].food)) return false;
  const nextForge = activeBlacksmith(draft)!.blacksmith!;
  nextForge.status = offers ? "drawing" : "paid";
  nextForge.selected = service;
  nextForge.offers = offers;
  useExploreStore.setState({ session: draft });
  return true;
}

/** 已付费的服务中途放弃：不退款，本次相遇直接结束。 */
export function abandonBlacksmithService(): boolean {
  const current = useExploreStore.getState().session;
  if (!current || current.phase !== "forging") return false;
  const forge = activeBlacksmith(current)?.blacksmith;
  if (forge?.status !== "paid" && forge?.status !== "drawing") return false;
  const draft = structuredClone(current);
  const nextForge = activeBlacksmith(draft)!.blacksmith!;
  nextForge.status = "completed";
  nextForge.offers = undefined;
  nextForge.result = undefined;
  recordService(draft, nextForge);
  useExploreStore.setState({ session: draft });
  return true;
}

function paidFor(session: ExploreState, service: BlacksmithService): boolean {
  const forge = activeBlacksmith(session)?.blacksmith;
  return forge?.status === "paid" && forge.selected === service;
}

export function pickBlacksmithDraw(uid: string): boolean {
  const current = useExploreStore.getState().session;
  if (!current || current.phase !== "forging") return false;
  const forge = activeBlacksmith(current)?.blacksmith;
  const offer = forge?.offers?.find(candidate => candidate.card.uid === uid);
  if (forge?.status !== "drawing" || !offer) return false;
  const { charId } = offer;
  const town = useTownStore.getState();
  const character = town.characters[charId];
  if (!character || !current.party.some(member => member.alive && member.charId === charId)) return false;
  const nextCharacter = structuredClone(character);
  if (!addCardToDeck(nextCharacter, offer.card.id)) return false;
  const draft = structuredClone(current);
  const nextForge = activeBlacksmith(draft)!.blacksmith!;
  nextForge.status = "completed";
  nextForge.offers = undefined;
  nextForge.result = { charId, after: structuredClone(nextCharacter.deck[nextCharacter.deck.length - 1]) };
  recordService(draft, nextForge);
  useTownStore.setState({ characters: { ...town.characters, [charId]: nextCharacter } });
  useExploreStore.setState({ session: draft });
  return true;
}

/** 三种指定卡牌的服务(已付费)在同步操作内校验和结算，失败不提交任何修改。 */
export function performBlacksmithService(service: Exclude<BlacksmithService, "draw">, charId: string, uid: string): boolean {
  const current = useExploreStore.getState().session;
  const town = useTownStore.getState();
  const character = town.characters[charId];
  if (!current || current.phase !== "forging" || !character || !paidFor(current, service)) return false;
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
  const nextForge = activeBlacksmith(draft)!.blacksmith!;
  nextForge.status = "completed";
  nextForge.result = { charId, before: structuredClone(before), after: after ? structuredClone(after) : undefined };
  recordService(draft, nextForge);
  useTownStore.setState({ characters: { ...town.characters, [charId]: nextCharacter } });
  useExploreStore.setState({ session: draft });
  return true;
}
