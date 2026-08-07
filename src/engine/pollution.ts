import type { Ally, BattleState, Card, StatBlock, StatModifier } from "./types";
import { rngPick } from "./rng";
import { addMod, statOf } from "./stats";
import {
  POLLUTION_RULES,
  QUIRK_DEFS,
  QUIRK_IDS,
  SICK_MOD,
  type QuirkId,
} from "./quirks";
import { log } from "./ops";

function syncMaxHp(ally: Ally): void {
  const nextMaxHp = Math.max(1, Math.round(statOf(ally, "maxHp")));
  ally.maxHp = nextMaxHp;
  ally.hpLimit = Math.min(ally.hpLimit, nextMaxHp);
  ally.hp = Math.min(ally.hp, nextMaxHp);
}

function applyPermanentModifier(ally: Ally, mod: StatModifier): void {
  for (const [stat, amount] of Object.entries(mod.pct ?? {}) as [keyof StatBlock, number][]) {
    addMod(ally, stat, amount, true);
  }
  for (const [stat, amount] of Object.entries(mod.flat ?? {}) as [keyof StatBlock, number][]) {
    addMod(ally, stat, amount, false);
  }
  syncMaxHp(ally);
}

function ownerOf(state: BattleState, ownerCharId: string): Ally | undefined {
  for (const id of state.playerIds) {
    const combatant = state.combatants[id];
    if (combatant.team === "player" && combatant.charId === ownerCharId) return combatant;
  }
  return undefined;
}

function addQuirk(state: BattleState, ally: Ally): void {
  if (ally.quirks.length >= POLLUTION_RULES.maxQuirks) return;

  const available = QUIRK_IDS.filter((id) => !ally.quirks.includes(id));
  if (!available.length) return;

  const id = rngPick(state, available);
  const def = QUIRK_DEFS[id];
  ally.quirks = [...ally.quirks, id];
  applyPermanentModifier(ally, def.mod);
  log(state, `${ally.emoji} ${ally.name} 获得永久怪癖「${def.name}」`);
}

// 污染卡进入手牌时调用。抽牌堆洗回、弃牌和出牌本身不会触发这里。
export function registerPollutedCardDraw(state: BattleState, card: Card): void {
  if (!card.contaminated) return;

  const ally = ownerOf(state, card.ownerCharId);
  if (!ally) return;

  ally.pollution += POLLUTION_RULES.perCard;
  log(
    state,
    `${ally.emoji} ${ally.name} 污染值 +${POLLUTION_RULES.perCard}（${ally.pollution}/${POLLUTION_RULES.threshold}）`,
  );

  if (ally.pollution < POLLUTION_RULES.threshold) return;

  ally.pollution = 0;
  log(state, `${ally.emoji} ${ally.name} 的污染值达到 ${POLLUTION_RULES.threshold}, 已归零`);

  if (!ally.sick) {
    ally.sick = true;
    applyPermanentModifier(ally, SICK_MOD);
    log(state, `${ally.emoji} ${ally.name} 生病了, 攻击、防御、先手降低 10%`);
  }

  addQuirk(state, ally);
}

export function quirkIdsOf(value: readonly string[] | undefined): QuirkId[] {
  const seen = new Set<QuirkId>();
  const out: QuirkId[] = [];
  for (const id of value ?? []) {
    if (!(id in QUIRK_DEFS)) continue;
    const quirkId = id as QuirkId;
    if (seen.has(quirkId)) continue;
    seen.add(quirkId);
    out.push(quirkId);
  }
  return out;
}