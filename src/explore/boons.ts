import { newUid } from "../data";
import { rngInt } from "../engine/rng";
import { rollEquipment } from "../items/equipRoll";
import { pickByQuality, rollAffinity, rollCount, type DropContext } from "../items/drops";
import type { ItemStack } from "../items/types";
import { EXPLORE_RULES } from "./rules";
import type {
  BoonEntry,
  BattleBoonKind,
  CardOfferCandidate,
  ExploreState,
  PendingBoon,
} from "./types";

export function rollBoons(
  s: ExploreState,
  tables: (BoonEntry[] | undefined)[],
  k: number,
): PendingBoon[] {
  const rolled: PendingBoon[] = [];
  for (const table of tables) {
    for (const entry of table ?? []) {
      const count = rollCount(s, entry.chance, k);
      for (let index = 0; index < count; index += 1) {
        rolled.push({ uid: newUid("boon"), kind: entry.kind, dropK: k });
      }
    }
  }

  let cardOfferCount = 0;
  return rolled.filter((boon) => {
    if (boon.kind !== "cardOffer") return true;
    if (cardOfferCount >= EXPLORE_RULES.boons.cardOfferCap) return false;
    cardOfferCount += 1;
    return true;
  });
}

export function takeBoon(s: ExploreState, uid: string): PendingBoon | null {
  const index = s.pendingBoons.findIndex((boon) => boon.uid === uid);
  if (index < 0) return null;
  const [boon] = s.pendingBoons.splice(index, 1);
  return boon;
}

export function healPartyFlat(s: ExploreState, amount: number): number {
  let affected = 0;
  for (const member of s.party) {
    if (!member.alive) continue;
    const nextHp = Math.min(member.hpLimit, member.hp + Math.max(0, amount));
    if (nextHp > member.hp) affected += 1;
    member.hp = nextHp;
  }
  return affected;
}

export function rollEquipCrate(s: ExploreState, ctx: DropContext): ItemStack | null {
  const familyIds = ctx.equipmentFamilyIds ?? [];
  if (!familyIds.length) return null;
  const familyId = familyIds[rngInt(s, familyIds.length)];
  const def = pickByQuality(s, ctx.getFamily(familyId), ctx.weights);
  const affinity = rollAffinity(def, ctx.affinityPool, (n) => rngInt(s, n));
  return ctx.makeStack(def.id, 1, {
    affinity,
    roll: rollEquipment(def, (n) => rngInt(s, n)),
  });
}

export function openCardOffer(s: ExploreState, offers: CardOfferCandidate[]): void {
  s.pendingCardOffer = offers.length ? offers.map((offer) => ({ ...offer })) : null;
}

export function takeCardOffer(s: ExploreState): CardOfferCandidate[] | null {
  const offers = s.pendingCardOffer;
  s.pendingCardOffer = null;
  return offers?.map((offer) => ({ ...offer })) ?? null;
}

export function abandonBoons(s: ExploreState): boolean {
  if (!s.pendingBoons.length && !s.pendingCardOffer) return false;
  s.pendingBoons = [];
  s.pendingCardOffer = null;
  return true;
}